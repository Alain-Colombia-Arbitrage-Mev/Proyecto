import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Get counts per agent type
  const { data: counts, error } = await supabase
    .from('memory_embeddings')
    .select('agent_type')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('[memory.agents] Error:', error.message)
    throw createError({ statusCode: 500, message: 'Error fetching agent stats' })
  }

  const agentCounts: Record<string, number> = {}
  for (const row of counts || []) {
    agentCounts[row.agent_type] = (agentCounts[row.agent_type] || 0) + 1
  }

  const agents = [
    {
      type: 'memory',
      name: 'Agente de Memoria',
      description: 'Recuerda decisiones, patrones y contexto pasado',
      icon: 'i-heroicons-light-bulb',
      color: '#8B5CF6',
      count: agentCounts['memory'] || 0,
    },
    {
      type: 'architecture',
      name: 'Agente de Arquitectura',
      description: 'Stack técnico, APIs y configuraciones de deployment',
      icon: 'i-heroicons-cpu-chip',
      color: '#3B82F6',
      count: agentCounts['architecture'] || 0,
    },
    {
      type: 'task',
      name: 'Agente de Tareas',
      description: 'Aprende de tareas completadas para sugerir mejores',
      icon: 'i-heroicons-clipboard-document-check',
      color: '#10B981',
      count: agentCounts['task'] || 0,
    },
  ]

  return { agents, totalMemories: (counts || []).length }
})
