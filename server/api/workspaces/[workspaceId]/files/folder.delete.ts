import { serverSupabaseServiceRole } from '#supabase/server'
import { r2Delete } from '~~/server/utils/r2'
import { escapeLikePattern } from '~~/server/utils/files'

/** Delete a virtual folder and EVERYTHING inside it (files in storage + records, recursively). */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'delete_files')

  const body = await readBody(event)
  let path = String(body.path || '').replace(/\.\./g, '').replace(/[,()]/g, '').replace(/\/+/g, '/')
  if (!path.startsWith('/')) path = '/' + path
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  if (path === '/' || !path) throw createError({ statusCode: 400, message: 'Cannot delete the root folder' })

  const supabase = serverSupabaseServiceRole(event)
  // LIKE metacharacters in the path must be escaped or a crafted name could
  // match (and delete) unrelated folders
  const likePrefix = `${escapeLikePattern(path)}/%`

  // Collect every row in the folder and below (capped for safety)
  const [{ data: exact }, { data: nested }] = await Promise.all([
    supabase.from('workspace_files')
      .select('id, file_path, mime_type, metadata')
      .eq('workspace_id', workspaceId)
      .eq('folder', path)
      .limit(500),
    supabase.from('workspace_files')
      .select('id, file_path, mime_type, metadata')
      .eq('workspace_id', workspaceId)
      .like('folder', likePrefix)
      .limit(500),
  ])
  const rows = [...(exact || []), ...(nested || [])]

  const supabasePaths: string[] = []
  for (const row of rows) {
    if (row.mime_type === 'inode/directory') continue
    if ((row.metadata as any)?.storage === 'r2') {
      await r2Delete(row.file_path).catch(() => {})
    } else {
      supabasePaths.push(row.file_path)
    }
  }
  if (supabasePaths.length) {
    await supabase.storage.from('workspace-files').remove(supabasePaths)
  }

  const { error: e1 } = await supabase
    .from('workspace_files').delete()
    .eq('workspace_id', workspaceId).eq('folder', path)
  const { error: e2 } = await supabase
    .from('workspace_files').delete()
    .eq('workspace_id', workspaceId).like('folder', likePrefix)
  if (e1 || e2) throw createError({ statusCode: 500, message: `Delete failed: ${(e1 || e2)!.message}` })

  return { deleted: true, folder: path, files_removed: rows.length }
})
