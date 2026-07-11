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
    .neq('mime_type', 'inode/directory') // folder markers are not files
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (projectId) {
    q = q.eq('project_id', projectId)
  }

  const { data, error, count } = await q
  if (error) throw createError({ statusCode: 500, message: 'Error fetching files' })

  // Get subfolders with item counts — folder values + mime to exclude markers
  const { data: folderRows } = await supabase
    .from('workspace_files')
    .select('folder, mime_type')
    .eq('workspace_id', workspaceId)
    .like('folder', folder === '/' ? '/%' : `${escapeLikePattern(folder)}/%`)

  const subfolderCounts = new Map<string, number>()
  const prefix = folder === '/' ? '/' : `${folder}/`
  for (const f of folderRows || []) {
    if (f.folder !== folder && f.folder.startsWith(prefix)) {
      const relative = f.folder.slice(prefix.length)
      const nextPart = relative.split('/')[0]
      if (nextPart) {
        const isFile = f.mime_type !== 'inode/directory'
        subfolderCounts.set(nextPart, (subfolderCounts.get(nextPart) || 0) + (isFile ? 1 : 0))
      }
    }
  }
  const subfolders = Array.from(subfolderCounts.entries())
    .map(([name, fileCount]) => ({ name, count: fileCount }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // All distinct folders in the workspace (for the move-to-folder picker)
  const { data: allFolderRows } = await supabase
    .from('workspace_files')
    .select('folder')
    .eq('workspace_id', workspaceId)
    .limit(1000)
  const allFolders = Array.from(new Set(['/', ...(allFolderRows || []).map((f: any) => f.folder)])).sort()

  return {
    files: data || [],
    subfolders,
    all_folders: allFolders,
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
