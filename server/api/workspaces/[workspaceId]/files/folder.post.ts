import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Create a virtual folder. Folders are derived from workspace_files.folder,
 * so an empty folder is represented by a zero-size marker row
 * (mime_type 'inode/directory') that listings hide.
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requirePermission(event, workspaceId, 'upload_files')

  const body = await readBody(event)
  const parent = sanitizeFolderPath(String(body.parent || '/'))
  const rawName = String(body.name || '').trim()

  const name = rawName.replace(/[/\\]/g, '').replace(/\.\./g, '').slice(0, 80)
  if (!name) throw createError({ statusCode: 400, message: 'Folder name is required' })

  const path = parent === '/' ? `/${name}` : `${parent}/${name}`
  const supabase = serverSupabaseServiceRole(event)

  // Already exists? (marker or any file inside)
  const { data: existing } = await supabase
    .from('workspace_files')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('folder', path)
    .limit(1)
  if (existing?.length) throw createError({ statusCode: 409, message: 'Folder already exists' })

  const { data: marker, error } = await supabase
    .from('workspace_files')
    .insert({
      workspace_id: workspaceId,
      uploaded_by: user.id,
      file_name: '.folder',
      file_path: `folder:${workspaceId}${path}`,
      file_size: 0,
      mime_type: 'inode/directory',
      folder: path,
      source: 'system',
    })
    .select('id, folder')
    .single()

  if (error) throw createError({ statusCode: 500, message: `Error creating folder: ${error.message}` })
  return { created: true, folder: marker.folder }
})

function sanitizeFolderPath(raw: string): string {
  let folder = raw.replace(/\.\./g, '').replace(/\/+/g, '/')
  if (!folder.startsWith('/')) folder = '/' + folder
  if (folder.length > 1 && folder.endsWith('/')) folder = folder.slice(0, -1)
  return folder.slice(0, 255)
}
