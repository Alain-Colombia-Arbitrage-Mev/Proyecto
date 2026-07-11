import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const fileId = getRouterParam(event, 'fileId')!
  await requirePermission(event, workspaceId, 'delete_files')

  const supabase = serverSupabaseServiceRole(event)

  // Get file ensuring workspace isolation
  const { data: file, error: fetchError } = await supabase
    .from('workspace_files')
    .select('id, file_path, file_name, mime_type, metadata')
    .eq('id', fileId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError) {
    console.error('[files.delete] Fetch error:', fetchError.message, { fileId, workspaceId })
    throw createError({ statusCode: 500, message: 'Error fetching file record' })
  }

  if (!file) throw createError({ statusCode: 404, message: 'File not found' })

  // Delete from storage first (folder markers have no storage object)
  const isFolderMarker = file.mime_type === 'inode/directory'
  if (!isFolderMarker) {
    if ((file.metadata as any)?.storage === 'r2') {
      await r2Delete(file.file_path).catch((e: any) => {
        console.error('[files.delete] R2 delete error:', e.message, { filePath: file.file_path, fileId })
      })
    } else {
      const { error: storageError } = await supabase.storage
        .from('workspace-files')
        .remove([file.file_path])

      if (storageError) {
        console.error('[files.delete] Storage delete error:', storageError.message, { filePath: file.file_path, fileId, workspaceId })
        // Continue — DB record should still be removed to avoid orphan references
      }
    }
  }

  // Delete record — scope by workspace_id for defense-in-depth
  const { error } = await supabase
    .from('workspace_files')
    .delete()
    .eq('id', fileId)
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('[files.delete] DB delete error:', error.message, { fileId, workspaceId })
    throw createError({ statusCode: 500, message: 'Error deleting file record' })
  }

  console.log('[files.delete] Successfully deleted:', file.file_name, { fileId, workspaceId })
  return { success: true }
})
