import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB — matches bucket limit

const ALLOWED_MIME_TYPES = new Set([
  'text/plain', 'text/markdown', 'text/csv', 'application/json',
  'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const fileField = formData.find(f => f.name === 'file')
  const folderField = formData.find(f => f.name === 'folder')
  const projectIdField = formData.find(f => f.name === 'project_id')

  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: 'File data is required' })
  }

  // Validate file size early
  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
  }

  const fileName = fileField.filename || 'unnamed'
  const mimeType = fileField.type || 'application/octet-stream'

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw createError({ statusCode: 415, message: `File type '${mimeType}' not allowed` })
  }

  // Sanitize folder — prevent path traversal
  const rawFolder = folderField?.data?.toString() || '/'
  const folder = sanitizeFolder(rawFolder)

  const projectId = projectIdField?.data?.toString() || null

  // Build storage path: {workspaceId}/{folder}/{timestamp}_{filename}
  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
  const storagePath = `${workspaceId}${folder === '/' ? '' : folder}/${timestamp}_${safeName}`

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(storagePath, fileField.data, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('[files.post] Upload error:', uploadError.message)
    throw createError({ statusCode: 500, message: 'Error uploading file' })
  }

  // Record in workspace_files table
  const { data: record, error: dbError } = await supabase
    .from('workspace_files')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      uploaded_by: user.id,
      file_name: fileName.slice(0, 500),
      file_path: storagePath,
      file_size: fileField.data.length,
      mime_type: mimeType,
      folder,
      source: 'upload',
    })
    .select()
    .single()

  if (dbError) {
    // Cleanup orphan storage file
    await supabase.storage.from('workspace-files').remove([storagePath])
    console.error('[files.post] DB error:', dbError.message)
    throw createError({ statusCode: 500, message: 'Error recording file' })
  }

  return record
})

function sanitizeFolder(raw: string): string {
  let folder = raw.replace(/\.\./g, '').replace(/\/+/g, '/')
  if (!folder.startsWith('/')) folder = '/' + folder
  if (folder.length > 1 && folder.endsWith('/')) folder = folder.slice(0, -1)
  if (folder.length > 255) folder = folder.slice(0, 255)
  return folder
}
