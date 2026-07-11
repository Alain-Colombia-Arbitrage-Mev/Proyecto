export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime?: string
  webViewLink?: string
  iconLink?: string
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

// Shared state
const connected = ref(false)
const checking = ref(false)

/**
 * Google Drive integration (scope: drive.file — only files/folders created by
 * FocusFlow are visible). Uses the Google provider_token from the Supabase
 * session, so all calls run client-side; no server-side token storage.
 */
export function useGoogleDrive() {
  const supabase = useSupabaseClient()

  async function getToken(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession()
      return (data?.session as any)?.provider_token || null
    } catch {
      return null
    }
  }

  /** Verify the current provider token exists and has Drive access */
  async function checkConnection(): Promise<boolean> {
    checking.value = true
    try {
      const token = await getToken()
      if (!token) { connected.value = false; return false }
      const res = await fetch(`${DRIVE_API}/files?pageSize=1&q=trashed=false`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      connected.value = res.ok
      return res.ok
    } catch {
      connected.value = false
      return false
    } finally {
      checking.value = false
    }
  }

  /** Re-auth with Google requesting the Drive scope, returning to the current page */
  async function connect() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
        scopes: 'https://www.googleapis.com/auth/drive.file',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  async function driveFetch(path: string, init?: RequestInit): Promise<any> {
    const token = await getToken()
    if (!token) throw new Error('NOT_CONNECTED')
    const res = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    })
    if (res.status === 401 || res.status === 403) {
      connected.value = false
      throw new Error('NOT_CONNECTED')
    }
    if (!res.ok) throw new Error(`Drive API error ${res.status}`)
    return res.json()
  }

  /** Find or create the FocusFlow folder for a workspace (optionally a project subfolder) */
  async function ensureFolder(name: string, parentId?: string): Promise<string> {
    const safeName = name.replace(/'/g, "\\'")
    const parentClause = parentId ? ` and '${parentId}' in parents` : ''
    const q = encodeURIComponent(`name='${safeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`)
    const found = await driveFetch(`${DRIVE_API}/files?q=${q}&fields=files(id,name)`)
    if (found.files?.length) return found.files[0].id

    const created = await driveFetch(`${DRIVE_API}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    })
    return created.id
  }

  async function listFiles(folderId: string): Promise<DriveFile[]> {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`)
    const data = await driveFetch(
      `${DRIVE_API}/files?q=${q}&pageSize=100&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink)`,
    )
    return data.files || []
  }

  /** Multipart upload of one file into a folder */
  async function uploadFile(file: File, folderId: string): Promise<DriveFile> {
    const token = await getToken()
    if (!token) throw new Error('NOT_CONNECTED')

    const metadata = { name: file.name, parents: [folderId] }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', file)

    const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,iconLink`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (res.status === 401 || res.status === 403) {
      connected.value = false
      throw new Error('NOT_CONNECTED')
    }
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)
    return res.json()
  }

  async function deleteFile(fileId: string): Promise<void> {
    const token = await getToken()
    if (!token) throw new Error('NOT_CONNECTED')
    const res = await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok && res.status !== 204) throw new Error(`Delete failed (${res.status})`)
  }

  /** Download a Drive file's content as text (for AI document context) */
  async function readFileText(fileId: string): Promise<string> {
    const token = await getToken()
    if (!token) throw new Error('NOT_CONNECTED')
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Read failed (${res.status})`)
    return res.text()
  }

  return {
    connected,
    checking,
    checkConnection,
    connect,
    ensureFolder,
    listFiles,
    uploadFile,
    deleteFile,
    readFileText,
  }
}
