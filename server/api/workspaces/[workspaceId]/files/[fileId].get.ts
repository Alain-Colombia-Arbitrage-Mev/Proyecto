import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const fileId = getRouterParam(event, 'fileId')!
  await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Get file record ensuring it belongs to this workspace
  const { data: file } = await supabase
    .from('workspace_files')
    .select('*')
    .eq('id', fileId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!file) throw createError({ statusCode: 404, message: 'File not found' })

  // Defense-in-depth: verify storage path starts with this workspace's prefix
  if (!file.file_path.startsWith(`${workspaceId}/`)) {
    console.error(`[files.get] Path mismatch: file ${fileId} path "${file.file_path}" doesn't match workspace ${workspaceId}`)
    throw createError({ statusCode: 403, message: 'File path mismatch' })
  }

  // Generate signed download URL (valid 1 hour) — R2 or Supabase per file metadata
  if ((file.metadata as any)?.storage === 'r2') {
    try {
      const url = await r2SignedUrl(file.file_path, 3600)
      return { ...file, download_url: url }
    } catch (e: any) {
      console.error('[files.get] R2 sign error:', e.message)
      throw createError({ statusCode: 500, message: 'Error generating download URL' })
    }
  }

  const { data: signedUrl, error } = await supabase.storage
    .from('workspace-files')
    .createSignedUrl(file.file_path, 3600)

  if (error || !signedUrl) {
    throw createError({ statusCode: 500, message: 'Error generating download URL' })
  }

  return {
    ...file,
    download_url: signedUrl.signedUrl,
  }
})
