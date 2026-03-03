import { serverSupabaseServiceRole } from '#supabase/server'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, sanitizeFileName } from '~~/server/utils/files'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const taskId = getRouterParam(event, 'taskId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const supabase = serverSupabaseServiceRole(event)

  // Verify task belongs to workspace
  const { data: task } = await supabase
    .from('tasks')
    .select('id, project_id, projects!inner(workspace_id)')
    .eq('id', taskId)
    .maybeSingle()

  if (!task || (task as any).projects?.workspace_id !== workspaceId) {
    throw createError({ statusCode: 404, message: 'Task not found in this workspace' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const fileField = formData.find(f => f.name === 'file')
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: 'File data is required' })
  }

  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 413, message: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` })
  }

  const fileName = fileField.filename || 'unnamed'
  const mimeType = fileField.type || 'application/octet-stream'

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw createError({ statusCode: 415, message: `File type '${mimeType}' not allowed` })
  }

  const timestamp = Date.now()
  const safeName = sanitizeFileName(fileName)
  const storagePath = `${workspaceId}/tasks/${taskId}/${timestamp}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(storagePath, fileField.data, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('[attachments.post] Upload error:', uploadError.message)
    throw createError({ statusCode: 500, message: 'Error uploading file' })
  }

  const { data: record, error: dbError } = await supabase
    .from('task_attachments')
    .insert({
      task_id: taskId,
      workspace_id: workspaceId,
      file_name: fileName.slice(0, 500),
      file_path: storagePath,
      file_size: fileField.data.length,
      mime_type: mimeType,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('workspace-files').remove([storagePath])
    console.error('[attachments.post] DB error:', dbError.message)
    throw createError({ statusCode: 500, message: 'Error recording attachment' })
  }

  return record
})
