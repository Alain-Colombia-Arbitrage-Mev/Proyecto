import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'use_workflows')

  const user = await requireUser(event)

  const workflowId = getRouterParam(event, 'workflowId')!
  const supabase = serverSupabaseServiceRole(event)

  // Get workflow
  const { data: workflow, error: wErr } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('workspace_id', workspaceId)
    .single()

  if (wErr || !workflow) throw createError({ statusCode: 404, message: 'Workflow not found' })

  const nodes = (workflow.nodes || []) as Array<{
    id: string; type: string; label: string; config: Record<string, unknown>; next?: string[]
  }>

  if (nodes.length === 0) throw createError({ statusCode: 400, message: 'Workflow has no nodes' })

  // Create run record
  const { data: run, error: rErr } = await supabase
    .from('workflow_runs')
    .insert({
      workflow_id: workflowId,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (rErr) throw createError({ statusCode: 500, message: rErr.message })

  // Check for n8n configuration
  const { data: ws } = await supabase
    .from('workspaces')
    .select('ai_config')
    .eq('id', workspaceId)
    .single()

  const wsConfig = (ws?.ai_config as Record<string, unknown>) || {}
  const n8nConfig = getN8nConfig(wsConfig)

  let results: Record<string, unknown> = {}
  let hasError = false
  let errorMsg = ''
  let executionEngine: 'n8n' | 'builtin' = 'builtin'

  if (n8nConfig) {
    // ═══ n8n Execution Engine ═══
    executionEngine = 'n8n'
    try {
      // Convert FocusFlow workflow to n8n format
      const n8nWorkflow = convertToN8nWorkflow(workflow.name, nodes)

      // Create workflow in n8n
      const created = await createN8nWorkflow(n8nConfig, n8nWorkflow)

      // Execute it
      const execution = await executeN8nWorkflow(n8nConfig, created.id)

      // Poll for completion (max 60 seconds)
      let finalResult = execution
      if (!finalResult.finished) {
        const maxAttempts = 30
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          try {
            finalResult = await getN8nExecution(n8nConfig, execution.id)
            if (finalResult.finished) break
          } catch { break }
        }
      }

      // Store n8n workflow id for future reference
      await supabase
        .from('workflows')
        .update({ n8n_workflow_id: created.id })
        .eq('id', workflowId)

      if (finalResult.status === 'success' || finalResult.finished) {
        results = {
          engine: 'n8n',
          execution_id: execution.id,
          n8n_workflow_id: created.id,
          status: finalResult.status,
          data: finalResult.data || {},
        }
      } else {
        hasError = true
        errorMsg = `n8n execution ${finalResult.status}: check n8n dashboard for details`
        results = {
          engine: 'n8n',
          execution_id: execution.id,
          status: finalResult.status,
        }
      }
    } catch (e: any) {
      hasError = true
      errorMsg = `n8n error: ${e.message || 'Failed to execute via n8n'}`
      results = { engine: 'n8n', error: e.message }
    }
  } else {
    // ═══ Built-in Execution Engine (fallback) ═══
    for (const node of nodes) {
      try {
        switch (node.type) {
          case 'ai_prompt': {
            const prompt = (node.config.prompt as string) || ''
            const model = (node.config.model as string) || 'openai/gpt-4o-mini'
            const apiKey = process.env.OPENROUTER_API_KEY || process.env.NUXT_OPENROUTER_API_KEY
            if (!apiKey) throw new Error('OpenRouter API key not configured')

            const response = await $fetch<{ choices: { message: { content: string } }[] }>('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
              body: { model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 },
            })
            results[node.id] = response.choices?.[0]?.message?.content || ''
            break
          }
          case 'social_post': {
            results[node.id] = {
              status: 'queued',
              platform: node.config.platform || 'twitter',
              caption: node.config.caption || '',
              scheduled_at: node.config.schedule_at || null,
            }
            break
          }
          case 'video_generate': {
            const runwayKey = process.env.RUNWAY_API_KEY
            if (!runwayKey) {
              results[node.id] = { status: 'simulated', message: 'Runway API key not configured - simulated run' }
              break
            }
            results[node.id] = {
              status: 'queued',
              model: node.config.runway_model || 'gen3a_turbo',
              duration: node.config.duration || 5,
              prompt: node.config.prompt || '',
            }
            break
          }
          case 'image_generate': {
            results[node.id] = { status: 'queued', prompt: node.config.prompt || '' }
            break
          }
          case 'send_email': {
            try {
              await sendEmail({
                to: (node.config.to as string) || '',
                subject: (node.config.subject as string) || '',
                html: (node.config.body as string) || '',
              })
              results[node.id] = { status: 'sent', to: node.config.to }
            } catch (emailErr: any) {
              results[node.id] = { status: 'failed', error: emailErr.message }
            }
            break
          }
          case 'webhook':
          case 'http_request': {
            try {
              const method = (node.config.method as string) || 'GET'
              const url = (node.config.url as string) || ''
              if (!url) throw new Error('URL is required')

              const fetchOpts: any = { method }

              if (node.config.headers) {
                try { fetchOpts.headers = JSON.parse(node.config.headers as string) } catch {}
              }
              if (node.config.request_body || node.config.body) {
                const bodyStr = (node.config.request_body || node.config.body) as string
                try { fetchOpts.body = JSON.parse(bodyStr) } catch { fetchOpts.body = bodyStr }
              }

              const resp = await $fetch(url, fetchOpts)
              results[node.id] = { status: 'success', response: resp }
            } catch (httpErr: any) {
              results[node.id] = { status: 'failed', error: httpErr.message }
            }
            break
          }
          case 'transform': {
            results[node.id] = { transformed: true }
            break
          }
          case 'delay': {
            const seconds = Math.min((node.config.seconds as number) || 0, 30)
            if (seconds > 0) await new Promise(r => setTimeout(r, seconds * 1000))
            results[node.id] = { delayed: true, seconds }
            break
          }
          case 'condition': {
            results[node.id] = { evaluated: true }
            break
          }
          default:
            results[node.id] = { type: node.type, status: 'processed' }
        }
      } catch (e: any) {
        hasError = true
        errorMsg = `Node "${node.label}": ${e.message}`
        results[node.id] = { error: e.message }
        break
      }
    }
    results = { engine: 'builtin', ...results }
  }

  // Update run record
  await supabase
    .from('workflow_runs')
    .update({
      status: hasError ? 'failed' : 'completed',
      finished_at: new Date().toISOString(),
      output: results,
      error: errorMsg || null,
    })
    .eq('id', run.id)

  // Update workflow run count
  await supabase
    .from('workflows')
    .update({
      run_count: (workflow.run_count || 0) + 1,
      last_run_at: new Date().toISOString(),
      status: hasError ? 'failed' : workflow.status,
    })
    .eq('id', workflowId)

  return {
    run_id: run.id,
    status: hasError ? 'failed' : 'completed',
    engine: executionEngine,
    error: errorMsg || null,
    results,
  }
})
