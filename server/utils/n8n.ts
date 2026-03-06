/**
 * n8n API Client — integrates FocusFlow workflows with n8n as execution engine.
 *
 * Maps FocusFlow node types to n8n node types and creates/executes workflows
 * via the n8n REST API.
 */

interface N8nConfig {
  baseUrl: string
  apiKey: string
}

interface N8nNode {
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, unknown>
  credentials?: Record<string, { id: string; name: string }>
}

interface N8nConnection {
  node: string
  type: string
  index: number
}

interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: Record<string, { main: N8nConnection[][] }>
  active: boolean
  settings?: Record<string, unknown>
}

/** Get n8n configuration from runtime config or workspace ai_config */
export function getN8nConfig(workspaceConfig?: Record<string, unknown>): N8nConfig | null {
  const runtimeConfig = useRuntimeConfig()

  // Priority: workspace-level config > env vars
  const baseUrl = (workspaceConfig?.n8n_url as string) || (runtimeConfig.n8nBaseUrl as string) || ''
  const apiKey = (workspaceConfig?.n8n_api_key as string) || (runtimeConfig.n8nApiKey as string) || ''

  if (!baseUrl || !apiKey) return null
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey }
}

/** Check if n8n is reachable */
export async function checkN8nHealth(config: N8nConfig): Promise<boolean> {
  try {
    await $fetch(`${config.baseUrl}/api/v1/workflows`, {
      method: 'GET',
      headers: { 'X-N8N-API-KEY': config.apiKey },
      query: { limit: 1 },
    })
    return true
  } catch {
    return false
  }
}

/** Map FocusFlow node type to n8n node definition */
function mapNodeToN8n(
  node: { id: string; type: string; label: string; config: Record<string, unknown> },
  index: number,
  prevNodeOutput?: string
): N8nNode {
  const x = 250 + index * 300
  const y = 300

  switch (node.type) {
    case 'trigger':
      return {
        name: node.label || 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [x, y],
        parameters: {},
      }

    case 'ai_prompt':
      return {
        name: node.label || 'AI Prompt',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: 'POST',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          authentication: 'genericCredentialType',
          genericAuthType: 'httpHeaderAuth',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `=Bearer {{$env.OPENROUTER_API_KEY}}` },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            model: (node.config.model as string) || 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: (node.config.prompt as string) || '' }],
            max_tokens: 2000,
          }),
          options: {},
        },
      }

    case 'ai_agent':
      return {
        name: node.label || 'AI Agent',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: 'POST',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `=Bearer {{$env.OPENROUTER_API_KEY}}` },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            model: (node.config.model as string) || 'openai/gpt-4o',
            messages: [
              { role: 'system', content: 'You are an autonomous AI agent. Complete the task thoroughly.' },
              { role: 'user', content: (node.config.prompt as string) || '' },
            ],
            max_tokens: 4000,
          }),
          options: {},
        },
      }

    case 'social_post': {
      const platform = (node.config.platform as string) || 'twitter'
      // Use HTTP Request to social APIs — platform-specific webhook or API
      return {
        name: node.label || `Post to ${platform}`,
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: 'POST',
          url: `={{$env.SOCIAL_WEBHOOK_${platform.toUpperCase()} || ""}}`,
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            platform,
            caption: (node.config.caption as string) || '',
            hashtags: (node.config.hashtags as string) || '',
            content: prevNodeOutput ? `={{$json.choices[0].message.content || $json.body || ""}}` : '',
          }),
          options: {},
        },
      }
    }

    case 'video_generate':
      return {
        name: node.label || 'Generate Video (Runway)',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: 'POST',
          url: 'https://api.dev.runwayml.com/v1/image_to_video',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `=Bearer {{$env.RUNWAY_API_KEY}}` },
              { name: 'X-Runway-Version', value: '2024-11-06' },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            model: (node.config.runway_model as string) || 'gen3a_turbo',
            promptText: (node.config.prompt as string) || '',
            duration: (node.config.duration as number) || 5,
            watermark: false,
          }),
          options: { timeout: 120000 },
        },
      }

    case 'image_generate':
      return {
        name: node.label || 'Generate Image',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: 'POST',
          url: 'https://openrouter.ai/api/v1/images/generations',
          sendHeaders: true,
          headerParameters: {
            parameters: [
              { name: 'Authorization', value: `=Bearer {{$env.OPENROUTER_API_KEY}}` },
            ],
          },
          sendBody: true,
          specifyBody: 'json',
          jsonBody: JSON.stringify({
            prompt: (node.config.prompt as string) || '',
            n: 1,
            size: '1024x1024',
          }),
          options: {},
        },
      }

    case 'send_email':
      return {
        name: node.label || 'Send Email',
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2,
        position: [x, y],
        parameters: {
          fromEmail: '={{$env.EMAIL_FROM || "noreply@focusflow.app"}}',
          toEmail: (node.config.to as string) || '',
          subject: (node.config.subject as string) || '',
          emailType: 'text',
          message: (node.config.body as string) || '',
          options: {},
        },
      }

    case 'webhook':
      return {
        name: node.label || 'Webhook',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: {
          method: (node.config.method as string) || 'POST',
          url: (node.config.url as string) || '',
          sendBody: true,
          specifyBody: 'json',
          jsonBody: prevNodeOutput ? '={{JSON.stringify($json)}}' : '{}',
          options: {},
        },
      }

    case 'http_request': {
      const params: Record<string, unknown> = {
        method: (node.config.method as string) || 'GET',
        url: (node.config.url as string) || '',
        options: {},
      }
      if (node.config.headers) {
        try {
          const headers = JSON.parse(node.config.headers as string)
          params.sendHeaders = true
          params.headerParameters = {
            parameters: Object.entries(headers).map(([name, value]) => ({ name, value })),
          }
        } catch {}
      }
      if (node.config.request_body) {
        params.sendBody = true
        params.specifyBody = 'json'
        params.jsonBody = node.config.request_body as string
      }
      return {
        name: node.label || 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [x, y],
        parameters: params,
      }
    }

    case 'condition':
      return {
        name: node.label || 'IF',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [x, y],
        parameters: {
          conditions: {
            string: [{
              value1: `={{${(node.config.expression as string) || 'true'}}}`,
              value2: 'true',
            }],
          },
        },
      }

    case 'delay':
      return {
        name: node.label || 'Wait',
        type: 'n8n-nodes-base.wait',
        typeVersion: 1,
        position: [x, y],
        parameters: {
          amount: (node.config.seconds as number) || 5,
          unit: 'seconds',
        },
      }

    case 'transform':
      return {
        name: node.label || 'Set',
        type: 'n8n-nodes-base.set',
        typeVersion: 3,
        position: [x, y],
        parameters: {
          mode: 'manual',
          duplicateItem: false,
          assignments: {
            assignments: [{
              id: 'result',
              name: 'result',
              value: (node.config.template as string) || '={{$json}}',
              type: 'string',
            }],
          },
          options: {},
        },
      }

    case 'output':
      return {
        name: node.label || 'Output',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [x, y],
        parameters: {},
      }

    default:
      return {
        name: node.label || 'No Operation',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [x, y],
        parameters: {},
      }
  }
}

/** Convert FocusFlow workflow to n8n workflow format */
export function convertToN8nWorkflow(
  name: string,
  nodes: Array<{ id: string; type: string; label: string; config: Record<string, unknown> }>
): N8nWorkflow {
  // If no trigger node at start, add a manual trigger
  const hasTrigger = nodes.length > 0 && nodes[0].type === 'trigger'

  const n8nNodes: N8nNode[] = []
  const connections: Record<string, { main: N8nConnection[][] }> = {}

  let offset = 0

  if (!hasTrigger) {
    n8nNodes.push({
      name: 'Manual Trigger',
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [250, 300],
      parameters: {},
    })
    offset = 1
  }

  for (let i = 0; i < nodes.length; i++) {
    const prevOutput = i > 0 ? nodes[i - 1].id : undefined
    const n8nNode = mapNodeToN8n(nodes[i], i + offset, prevOutput)
    n8nNodes.push(n8nNode)
  }

  // Build sequential connections
  for (let i = 0; i < n8nNodes.length - 1; i++) {
    const fromName = n8nNodes[i].name
    const toName = n8nNodes[i + 1].name
    connections[fromName] = {
      main: [[{ node: toName, type: 'main', index: 0 }]],
    }
  }

  return {
    name,
    nodes: n8nNodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
    },
  }
}

/** Create a workflow in n8n and return its ID */
export async function createN8nWorkflow(config: N8nConfig, workflow: N8nWorkflow): Promise<{ id: string }> {
  const result = await $fetch<{ id: string }>(`${config.baseUrl}/api/v1/workflows`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': config.apiKey, 'Content-Type': 'application/json' },
    body: workflow,
  })
  return result
}

/** Execute a workflow in n8n and return the execution result */
export async function executeN8nWorkflow(
  config: N8nConfig,
  n8nWorkflowId: string
): Promise<{ id: string; finished: boolean; status: string; data?: any }> {
  // Activate workflow first (required for execution)
  try {
    await $fetch(`${config.baseUrl}/api/v1/workflows/${n8nWorkflowId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': config.apiKey },
    })
  } catch {
    // May already be active
  }

  // Execute via production endpoint
  const result = await $fetch<{ id: string; finished: boolean; status: string; data?: any }>(
    `${config.baseUrl}/api/v1/workflows/${n8nWorkflowId}/run`,
    {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': config.apiKey, 'Content-Type': 'application/json' },
      body: {},
    }
  )

  return result
}

/** Delete a workflow from n8n */
export async function deleteN8nWorkflow(config: N8nConfig, n8nWorkflowId: string): Promise<void> {
  await $fetch(`${config.baseUrl}/api/v1/workflows/${n8nWorkflowId}`, {
    method: 'DELETE',
    headers: { 'X-N8N-API-KEY': config.apiKey },
  })
}

/** Get execution result from n8n */
export async function getN8nExecution(
  config: N8nConfig,
  executionId: string
): Promise<{ id: string; finished: boolean; status: string; data?: any }> {
  return await $fetch<{ id: string; finished: boolean; status: string; data?: any }>(
    `${config.baseUrl}/api/v1/executions/${executionId}`,
    {
      method: 'GET',
      headers: { 'X-N8N-API-KEY': config.apiKey },
    }
  )
}

/** List workflows from n8n */
export async function listN8nWorkflows(config: N8nConfig): Promise<{ data: any[] }> {
  return await $fetch<{ data: any[] }>(`${config.baseUrl}/api/v1/workflows`, {
    method: 'GET',
    headers: { 'X-N8N-API-KEY': config.apiKey },
    query: { limit: 100 },
  })
}
