import { serverSupabaseServiceRole } from '#supabase/server'
import { MAX_FILE_SIZE, IMAGE_MIME_TYPES, sanitizeFileName } from '~~/server/utils/files'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const fileField = formData.find(f => f.name === 'file')
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: 'File data is required' })
  }

  const mimeType = fileField.type || 'application/octet-stream'
  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    throw createError({ statusCode: 415, message: 'Only images are allowed' })
  }

  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: 'Image too large' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const timestamp = Date.now()
  const safeName = sanitizeFileName(fileField.filename || 'image.png')
  const storagePath = `${workspaceId}/tasks/inline/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(storagePath, fileField.data, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    throw createError({ statusCode: 500, message: 'Error uploading image' })
  }

  const { data: signedUrl } = await supabase.storage
    .from('workspace-files')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1 year

  return { url: signedUrl?.signedUrl || '' }
})
