import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const attachmentId = getRouterParam(event, 'attachmentId')!
  await requireWorkspaceRole(event, workspaceId, 'member')

  const supabase = serverSupabaseServiceRole(event)

  const { data: attachment } = await supabase
    .from('task_attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('task_id', taskId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!attachment) {
    throw createError({ statusCode: 404, message: 'Attachment not found' })
  }

  // Delete from storage
  await supabase.storage.from('workspace-files').remove([attachment.file_path])

  // Delete from DB
  const { error } = await supabase
    .from('task_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) throw createError({ statusCode: 500, message: 'Error deleting attachment' })

  return { success: true }
})
