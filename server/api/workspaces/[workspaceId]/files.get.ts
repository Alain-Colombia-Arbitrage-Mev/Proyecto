import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_FILES_PER_PAGE = 100

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceMember(event, workspaceId)

  const query = getQuery(event)
  const folder = sanitizeFolder(query.folder as string | undefined)
  const projectId = query.project_id as string | undefined
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(MAX_FILES_PER_PAGE, Math.max(1, parseInt(query.limit as string) || 50))
  const offset = (page - 1) * limit

  const supabase = serverSupabaseServiceRole(event)

  let q = supabase
    .from('workspace_files')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('folder', folder)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (projectId) {
    q = q.eq('project_id', projectId)
  }

  const { data, error, count } = await q
  if (error) throw createError({ statusCode: 500, message: 'Error fetching files' })

  // Get distinct subfolders efficiently — only select unique folder values, not all rows
  const { data: folderRows } = await supabase
    .from('workspace_files')
    .select('folder')
    .eq('workspace_id', workspaceId)
    .like('folder', folder === '/' ? '/%' : `${folder}/%`)

  const subfolders = new Set<string>()
  const prefix = folder === '/' ? '/' : `${folder}/`
  for (const f of folderRows || []) {
    if (f.folder !== folder && f.folder.startsWith(prefix)) {
      const relative = f.folder.slice(prefix.length)
      const nextPart = relative.split('/')[0]
      if (nextPart) subfolders.add(nextPart)
    }
  }

  return {
    files: data || [],
    subfolders: Array.from(subfolders).sort(),
    currentFolder: folder,
    total: count || 0,
    page,
    limit,
  }
})

/** Sanitize folder path: prevent traversal, normalize */
function sanitizeFolder(raw: string | undefined): string {
  if (!raw) return '/'
  // Remove path traversal sequences
  let folder = raw.replace(/\.\./g, '').replace(/\/+/g, '/')
  // Must start with /
  if (!folder.startsWith('/')) folder = '/' + folder
  // Remove trailing slash (except root)
  if (folder.length > 1 && folder.endsWith('/')) folder = folder.slice(0, -1)
  // Max length
  if (folder.length > 255) folder = folder.slice(0, 255)
  return folder
}
