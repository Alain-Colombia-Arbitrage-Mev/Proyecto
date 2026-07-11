import { serverSupabaseServiceRole } from '#supabase/server'
import { escapeLikePattern } from '~~/server/utils/files'

/** Rename a virtual folder: updates the folder path on every file inside (recursively). */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requirePermission(event, workspaceId, 'upload_files')

  const body = await readBody(event)
  const path = normalizeFolder(String(body.path || ''))
  const newName = String(body.new_name || '').trim().replace(/[/\\]/g, '').replace(/\.\./g, '').replace(/[,()]/g, '').slice(0, 80)

  if (path === '/' || !path) throw createError({ statusCode: 400, message: 'Cannot rename the root folder' })
  if (!newName) throw createError({ statusCode: 400, message: 'new_name is required' })

  const parent = path.slice(0, path.lastIndexOf('/')) || ''
  const newPath = `${parent}/${newName}`
  if (newPath === path) return { renamed: false, folder: path }

  const supabase = serverSupabaseServiceRole(event)

  // Target name collision check
  const { data: collision } = await supabase
    .from('workspace_files').select('id').eq('workspace_id', workspaceId).eq('folder', newPath).limit(1)
  if (collision?.length) throw createError({ statusCode: 409, message: 'A folder with that name already exists' })

  // Rows exactly in the folder
  const { error: e1 } = await supabase
    .from('workspace_files')
    .update({ folder: newPath, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)
    .eq('folder', path)
  if (e1) throw createError({ statusCode: 500, message: `Rename failed: ${e1.message}` })

  // Rows in subfolders: rewrite prefix (LIKE metacharacters escaped)
  const { data: nested } = await supabase
    .from('workspace_files')
    .select('id, folder')
    .eq('workspace_id', workspaceId)
    .like('folder', `${escapeLikePattern(path)}/%`)

  for (const row of nested || []) {
    const updatedPath = newPath + String(row.folder).slice(path.length)
    await supabase.from('workspace_files').update({ folder: updatedPath }).eq('id', row.id)
  }

  return { renamed: true, folder: newPath, nested_updated: (nested || []).length }
})

function normalizeFolder(raw: string): string {
  let f = raw.replace(/\.\./g, '').replace(/[,()]/g, '').replace(/\/+/g, '/')
  if (!f.startsWith('/')) f = '/' + f
  if (f.length > 1 && f.endsWith('/')) f = f.slice(0, -1)
  return f.slice(0, 255)
}
