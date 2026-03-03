import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const { data: attachments, error } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('task_id', taskId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: 'Error fetching attachments' })

  // Generate signed URLs
  const withUrls = await Promise.all(
    (attachments || []).map(async (att) => {
      const { data } = await supabase.storage
        .from('workspace-files')
        .createSignedUrl(att.file_path, 3600) // 1 hour
      return { ...att, url: data?.signedUrl || null }
    })
  )

  return withUrls
})
