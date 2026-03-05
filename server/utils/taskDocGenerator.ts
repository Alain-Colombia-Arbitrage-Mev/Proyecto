/**
 * Auto-generates implementation guide .md files for tasks created by AI chat.
 * Each doc includes sections from senior profiles: Backend, Frontend, Marketing, Design, UI/UX.
 * Uses a single compact LLM call per batch of tasks.
 */

const DOC_MODEL = 'qwen/qwen3-coder-next'

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

interface TaskForDoc {
  id: string
  title: string
  description?: string | null
}

/**
 * Generate implementation guide .md for a batch of tasks (fire-and-forget).
 * Creates one .md per task with multi-profile sections.
 */
export async function generateTaskDocs(opts: {
  supabase: any
  workspaceId: string
  projectId: string
  userId: string
  tasks: TaskForDoc[]
}): Promise<void> {
  const { openrouterApiKey } = useRuntimeConfig()
  if (!openrouterApiKey || !opts.tasks.length) return

  const { supabase, workspaceId, projectId, userId, tasks } = opts

  // Process in batches of 3 tasks per LLM call
  const BATCH = 3
  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH)
    try {
      await generateDocBatch({ supabase, workspaceId, projectId, userId, tasks: batch, openrouterApiKey })
    } catch (err: any) {
      console.error('[taskDocGen] Batch error:', err.message)
    }
  }
}

async function generateDocBatch(opts: {
  supabase: any
  workspaceId: string
  projectId: string
  userId: string
  tasks: TaskForDoc[]
  openrouterApiKey: string
}): Promise<void> {
  const { supabase, workspaceId, projectId, userId, tasks, openrouterApiKey } = opts

  // Compact input: one line per task
  const input = tasks.map((t, i) =>
    `${i}:${t.title}${t.description ? '|' + String(t.description).slice(0, 200) : ''}`
  ).join('\n')

  const response = await $fetch<any>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: DOC_MODEL,
      messages: [
        {
          role: 'system',
          content: `Para cada tarea, genera guía de implementación por perfil senior. JSON array:
[{i:0,sections:[{profile:"Backend",guide:"..."},{profile:"Frontend",guide:"..."},{profile:"Diseño UI/UX",guide:"..."},{profile:"Marketing",guide:"..."}]}]
Cada guide: 3-5 pasos concretos con archivos, herramientas, criterios. Conciso y ejecutable. ES. Solo JSON.`,
        },
        { role: 'user', content: input },
      ],
      temperature: 0.3,
      max_tokens: Math.min(tasks.length * 800, 4000),
    },
  })

  const raw = stripThinkTags(response.choices?.[0]?.message?.content || '')
  let parsed: any = null
  try { parsed = JSON.parse(raw.trim()) } catch {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) try { parsed = JSON.parse(match[0]) } catch {}
  }

  if (!Array.isArray(parsed)) return

  // Generate and save .md for each task
  for (const item of parsed) {
    const idx = item.i ?? 0
    const task = tasks[idx]
    if (!task || !Array.isArray(item.sections)) continue

    const md = buildMarkdown(task, item.sections)
    await saveTaskDoc({ supabase, workspaceId, projectId, userId, task, markdown: md })
  }
}

function buildMarkdown(task: TaskForDoc, sections: Array<{ profile: string; guide: string }>): string {
  const header = `# ${task.title}\n\n> Guía de implementación generada automáticamente\n`
  const body = sections.map(s =>
    `## ${s.profile}\n\n${s.guide}`
  ).join('\n\n---\n\n')

  return `${header}\n${body}`
}

async function saveTaskDoc(opts: {
  supabase: any
  workspaceId: string
  projectId: string
  userId: string
  task: TaskForDoc
  markdown: string
}): Promise<void> {
  const { supabase, workspaceId, projectId, userId, task, markdown } = opts

  try {
    const safeName = task.title.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_').slice(0, 60)
    const fileName = `guia_${safeName}.md`
    const fileBuffer = new TextEncoder().encode(markdown)
    const storagePath = `${workspaceId}/docs/guias/${Date.now()}_${fileName}`

    await supabase.storage
      .from('workspace-files')
      .upload(storagePath, fileBuffer, { contentType: 'text/markdown', upsert: false })

    await supabase
      .from('workspace_files')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        uploaded_by: userId,
        file_name: fileName,
        file_path: storagePath,
        file_size: fileBuffer.length,
        mime_type: 'text/markdown',
        folder: '/docs/guias',
        source: 'ai_generated',
      })
  } catch (err: any) {
    console.error(`[taskDocGen] Save error for "${task.title}":`, err.message)
  }
}
