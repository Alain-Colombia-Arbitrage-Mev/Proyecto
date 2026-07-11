import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Move a file to another virtual folder (and/or rename it).
 * Storage objects stay in place — navigation is driven by the folder column.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const fileId = getRouterParam(event, 'fileId')!
  await requirePermission(event, workspaceId, 'upload_files')

  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data: file } = await supabase
    .from('workspace_files')
    .select('id, file_name, folder, mime_type')
    .eq('id', fileId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (!file) throw createError({ statusCode: 404, message: 'File not found' })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  if (body.folder !== undefined) {
    let folder = String(body.folder).replace(/\.\./g, '').replace(/\/+/g, '/')
    if (!folder.startsWith('/')) folder = '/' + folder
    if (folder.length > 1 && folder.endsWith('/')) folder = folder.slice(0, -1)
    updates.folder = folder.slice(0, 255)
  }

  if (body.file_name !== undefined && file.mime_type !== 'inode/directory') {
    const name = String(body.file_name).trim().replace(/[/\\]/g, '').slice(0, 500)
    if (name) updates.file_name = name
  }

  if (Object.keys(updates).length === 1) {
    throw createError({ statusCode: 400, message: 'Nothing to update — provide folder and/or file_name' })
  }

  const { data: updated, error } = await supabase
    .from('workspace_files')
    .update(updates)
    .eq('id', fileId)
    .eq('workspace_id', workspaceId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: `Error moving file: ${error.message}` })
  return updated
})
