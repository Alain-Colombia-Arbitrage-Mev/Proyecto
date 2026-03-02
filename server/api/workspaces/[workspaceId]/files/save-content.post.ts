import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_CONTENT_SIZE = 5 * 1024 * 1024 // 5MB for text content

/**
 * Save text content (e.g. AI-generated markdown) as a file in workspace storage.
 * Body: { file_name, content, folder?, project_id?, source?, mime_type? }
 */
export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)

  const body = await readBody(event)
  if (!body.file_name || typeof body.file_name !== 'string') {
    throw createError({ statusCode: 400, message: 'file_name is required' })
  }
  if (!body.content || typeof body.content !== 'string') {
    throw createError({ statusCode: 400, message: 'content is required' })
  }
  if (body.content.length > MAX_CONTENT_SIZE) {
    throw createError({ statusCode: 413, message: `Content too large. Max ${MAX_CONTENT_SIZE / 1024 / 1024}MB` })
  }

  const supabase = serverSupabaseServiceRole(event)

  const fileName = body.file_name.slice(0, 500)
  const content = body.content as string
  const folder = sanitizeFolder((body.folder as string) || '/documentos')
  const projectId = (body.project_id as string) || null
  const source = validateSource(body.source as string)
  const mimeType = (body.mime_type as string) || 'text/markdown'

  const timestamp = Date.now()
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200)
  const storagePath = `${workspaceId}${folder}/${timestamp}_${safeName}`

  const fileBuffer = new TextEncoder().encode(content)

  const { error: uploadError } = await supabase.storage
    .from('workspace-files')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (uploadError) {
    console.error('[save-content] Upload error:', uploadError.message)
    throw createError({ statusCode: 500, message: 'Error saving file' })
  }

  const { data: record, error: dbError } = await supabase
    .from('workspace_files')
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      uploaded_by: user.id,
      file_name: fileName,
      file_path: storagePath,
      file_size: fileBuffer.length,
      mime_type: mimeType,
      folder,
      source,
    })
    .select()
    .single()

  if (dbError) {
    await supabase.storage.from('workspace-files').remove([storagePath])
    console.error('[save-content] DB error:', dbError.message)
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

function validateSource(raw: string | undefined): string {
  const allowed = ['upload', 'ai_generated', 'export']
  return allowed.includes(raw || '') ? raw! : 'ai_generated'
}
