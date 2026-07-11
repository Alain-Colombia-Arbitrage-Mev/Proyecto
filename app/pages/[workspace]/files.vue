<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ t.filesTitle }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ t.filesDesc }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          size="sm" variant="soft" icon="i-heroicons-arrow-up-tray"
          :loading="source === 'drive' ? driveUploading : uploading"
          class="font-medium"
          @click="source === 'drive' ? triggerDriveUpload() : triggerUpload()"
        >
          {{ t.uploadFile }}
        </UButton>
      </div>
    </div>

    <!-- Source tabs: Workspace storage | Google Drive -->
    <div class="flex items-center gap-1 mb-4 animate-fade-up">
      <button
        v-for="tab in sourceTabs"
        :key="tab.value"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        :class="source === tab.value
          ? 'bg-focusflow-50 dark:bg-focusflow-950/40 text-focusflow-700 dark:text-focusflow-300 ring-1 ring-focusflow-200 dark:ring-focusflow-500/30'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'"
        @click="switchSource(tab.value)"
      >
        <UIcon :name="tab.icon" class="w-3.5 h-3.5" />
        {{ tab.label }}
        <span v-if="tab.value === 'drive' && drive.connected.value" class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </button>
    </div>

    <!-- Breadcrumb -->
    <div v-if="source === 'workspace'" class="flex items-center gap-1.5 mb-4 text-sm animate-fade-up">
      <button
        class="text-gray-500 dark:text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 font-medium transition-colors cursor-pointer"
        @click="navigateTo('/')"
      >
        <UIcon name="i-heroicons-home" class="w-4 h-4" />
      </button>
      <template v-for="(part, i) in breadcrumbs" :key="i">
        <UIcon name="i-heroicons-chevron-right" class="w-3 h-3 text-gray-300 dark:text-gray-600" />
        <button
          class="text-gray-500 dark:text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 font-medium transition-colors cursor-pointer"
          @click="navigateTo(breadcrumbPath(i))"
        >
          {{ part }}
        </button>
      </template>
    </div>

    <!-- Loading -->
    <div v-if="source === 'workspace' && loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400 dark:text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loadingFiles }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="source === 'workspace' && files.length === 0 && subfolders.length === 0" class="text-center py-20 animate-fade-up">
      <div class="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-folder-open" class="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.noFiles }}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-xs mx-auto">{{ t.noFilesDesc }}</p>
      <UButton icon="i-heroicons-arrow-up-tray" color="primary" size="lg" class="font-semibold" @click="triggerUpload">{{ t.uploadFile }}</UButton>
    </div>

    <!-- File grid -->
    <div v-else-if="source === 'workspace'" class="animate-fade-up delay-100">
      <!-- Subfolders -->
      <div v-if="subfolders.length > 0" class="mb-4">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">{{ t.folders }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <button
            v-for="folder in subfolders"
            :key="folder"
            class="flex items-center gap-3 bg-white dark:bg-[#1b1b1b] rounded-xl p-3.5 border border-gray-200/80 dark:border-white/10 hover:border-focusflow-200 dark:hover:border-focusflow-500/30 transition-all cursor-pointer group shadow-card hover:shadow-card-hover"
            @click="navigateTo(currentFolder === '/' ? `/${folder}` : `${currentFolder}/${folder}`)"
          >
            <div class="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-folder" class="w-5 h-5 text-amber-500" />
            </div>
            <span class="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-focusflow-700 dark:group-hover:text-focusflow-400 transition-colors">{{ folder }}</span>
          </button>
        </div>
      </div>

      <!-- Files -->
      <div v-if="files.length > 0">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">{{ t.filesTitle }}</p>
        <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
          >
            <!-- Icon -->
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="fileIconBg(file.mime_type)">
              <UIcon :name="fileIcon(file.mime_type)" class="w-5 h-5" :class="fileIconColor(file.mime_type)" />
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ file.file_name }}</p>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ formatFileSize(file.file_size) }}</span>
                <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ formatDate(file.created_at) }}</span>
                <span v-if="file.source === 'ai_generated'" class="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">AI</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-focusflow-700 dark:hover:text-focusflow-400 hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 transition-all cursor-pointer"
                @click="downloadFile(file)"
                :title="t.download"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                @click="deleteFile(file)"
                :title="t.delete"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ Google Drive ══ -->
    <div v-if="source === 'drive'" class="animate-fade-up">
      <!-- Not connected -->
      <div v-if="!drive.connected.value" class="text-center py-20">
        <div class="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
          <UIcon name="i-heroicons-cloud" class="w-10 h-10 text-gray-300 dark:text-gray-600" />
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Google Drive</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-8 max-w-sm mx-auto">
          {{ es ? 'Conecta tu Google Drive para almacenar la documentación de tus proyectos en una carpeta de FocusFlow.' : 'Connect your Google Drive to store project documentation in a FocusFlow folder.' }}
        </p>
        <UButton
          icon="i-heroicons-link" color="primary" size="lg" class="font-semibold"
          :loading="drive.checking.value"
          @click="drive.connect()"
        >
          {{ es ? 'Conectar Google Drive' : 'Connect Google Drive' }}
        </UButton>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-4 max-w-xs mx-auto">
          {{ es ? 'Solo accedemos a los archivos creados por FocusFlow (permiso drive.file).' : 'We only access files created by FocusFlow (drive.file scope).' }}
        </p>
      </div>

      <template v-else>
        <!-- Drive toolbar -->
        <div class="flex items-center gap-2 mb-4">
          <span class="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-folder" class="w-4 h-4 text-amber-500" />
            FocusFlow – {{ store.workspace?.name }}
          </span>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-focusflow-600 hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 transition-colors cursor-pointer"
            :title="es ? 'Actualizar' : 'Refresh'"
            @click="loadDrive"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': driveLoading }" />
          </button>
        </div>

        <div v-if="driveLoading && !driveFiles.length" class="flex justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
        </div>

        <div v-else-if="!driveFiles.length" class="text-center py-16">
          <UIcon name="i-heroicons-folder-open" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">{{ es ? 'La carpeta de Drive está vacía. Sube documentación del proyecto.' : 'The Drive folder is empty. Upload project documentation.' }}</p>
          <UButton icon="i-heroicons-arrow-up-tray" color="primary" class="font-semibold" :loading="driveUploading" @click="triggerDriveUpload">{{ t.uploadFile }}</UButton>
        </div>

        <div v-else class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-card overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
          <div
            v-for="file in driveFiles"
            :key="file.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
          >
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="fileIconBg(file.mimeType)">
              <UIcon :name="fileIcon(file.mimeType)" class="w-5 h-5" :class="fileIconColor(file.mimeType)" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ file.name }}</p>
              <div class="flex items-center gap-3 mt-0.5">
                <span v-if="file.size" class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ formatFileSize(Number(file.size)) }}</span>
                <span v-if="file.modifiedTime" class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{{ formatDate(file.modifiedTime) }}</span>
                <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">Drive</span>
              </div>
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                v-if="file.webViewLink"
                :href="file.webViewLink" target="_blank" rel="noopener"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-focusflow-700 dark:hover:text-focusflow-400 hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 transition-all"
                :title="es ? 'Abrir en Drive' : 'Open in Drive'"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
              </a>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                :title="t.delete"
                @click="deleteDriveFile(file)"
              >
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Hidden file inputs -->
    <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload" multiple />
    <input ref="driveFileInput" type="file" class="hidden" @change="handleDriveUpload" multiple />
  </div>
</template>

<script setup lang="ts">
import type { WorkspaceFile } from '~/types'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

definePageMeta({ middleware: 'auth' })

const lang = useLanguage()
const t = lang.labels
const route = useRoute()
const store = useWorkspaceStore()

const files = ref<WorkspaceFile[]>([])
const subfolders = ref<string[]>([])
const currentFolder = ref('/')
const loading = ref(true)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// ── Google Drive ──
const drive = useGoogleDrive()
const es = computed(() => lang.language.value !== 'en')
const source = ref<'workspace' | 'drive'>('workspace')
const driveFiles = ref<import('~/composables/useGoogleDrive').DriveFile[]>([])
const driveFolderId = ref('')
const driveLoading = ref(false)
const driveUploading = ref(false)
const driveFileInput = ref<HTMLInputElement | null>(null)

const sourceTabs = computed(() => [
  { value: 'workspace' as const, label: 'Workspace', icon: 'i-heroicons-server-stack' },
  { value: 'drive' as const, label: 'Google Drive', icon: 'i-heroicons-cloud' },
])

async function switchSource(value: 'workspace' | 'drive') {
  source.value = value
  if (value === 'drive') {
    const ok = await drive.checkConnection()
    if (ok) await loadDrive()
  }
}

async function loadDrive() {
  if (!store.workspace?.name) return
  driveLoading.value = true
  try {
    if (!driveFolderId.value) {
      driveFolderId.value = await drive.ensureFolder(`FocusFlow – ${store.workspace.name}`)
    }
    driveFiles.value = await drive.listFiles(driveFolderId.value)
  } catch (e: any) {
    if (e.message !== 'NOT_CONNECTED') console.error('[drive]', e.message)
  } finally {
    driveLoading.value = false
  }
}

function triggerDriveUpload() {
  driveFileInput.value?.click()
}

async function handleDriveUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return
  driveUploading.value = true
  try {
    if (!driveFolderId.value && store.workspace?.name) {
      driveFolderId.value = await drive.ensureFolder(`FocusFlow – ${store.workspace.name}`)
    }
    for (const file of Array.from(input.files)) {
      await drive.uploadFile(file, driveFolderId.value)
    }
    await loadDrive()
  } catch (e: any) {
    if (e.message === 'NOT_CONNECTED') {
      alert(es.value ? 'Sesión de Google expirada — vuelve a conectar Drive.' : 'Google session expired — reconnect Drive.')
    } else {
      alert(e.message || (es.value ? 'Error al subir a Drive' : 'Drive upload error'))
    }
  } finally {
    driveUploading.value = false
    input.value = ''
  }
}

async function deleteDriveFile(file: { id: string; name: string }) {
  if (!confirm(t.value.confirmDeleteFile.replace('{name}', file.name))) return
  try {
    await drive.deleteFile(file.id)
    driveFiles.value = driveFiles.value.filter(f => f.id !== file.id)
  } catch (e: any) {
    alert(e.message || 'Error')
    await loadDrive()
  }
}

const workspaceId = computed(() => store.workspace?.id || '')

const breadcrumbs = computed(() => {
  if (currentFolder.value === '/') return []
  return currentFolder.value.split('/').filter(Boolean)
})

function breadcrumbPath(index: number) {
  const parts = currentFolder.value.split('/').filter(Boolean)
  return '/' + parts.slice(0, index + 1).join('/')
}

onMounted(async () => {
  await store.loadWorkspace(route.params.workspace as string)
  await loadFiles()
  // Silent Drive connection check (shows the green dot on the tab)
  drive.checkConnection().then((ok) => {
    if (ok && source.value === 'drive') loadDrive()
  }).catch(() => {})
})

async function loadFiles() {
  if (!workspaceId.value) return
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/workspaces/${workspaceId.value}/files`, {
      query: { folder: currentFolder.value },
    })
    files.value = data.files || []
    subfolders.value = data.subfolders || []
  } finally {
    loading.value = false
  }
}

function navigateTo(folder: string) {
  currentFolder.value = folder
  loadFiles()
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !workspaceId.value) return

  uploading.value = true
  try {
    for (const file of Array.from(input.files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', currentFolder.value)

      await $fetch(`/api/workspaces/${workspaceId.value}/files`, {
        method: 'POST',
        body: formData,
      })
    }
    await loadFiles()
  } catch (e: any) {
    alert(e.data?.message || t.value.errorUploading)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function downloadFile(file: WorkspaceFile) {
  try {
    const data = await $fetch<any>(`/api/workspaces/${workspaceId.value}/files/${file.id}`)
    if (data.download_url) {
      window.open(data.download_url, '_blank')
    }
  } catch (e: any) {
    alert(e.data?.message || t.value.errorDownloading)
  }
}

const deleting = ref<string | null>(null)

async function deleteFile(file: WorkspaceFile) {
  if (!confirm(t.value.confirmDeleteFile.replace('{name}', file.file_name))) return
  deleting.value = file.id
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/files/${file.id}`, { method: 'DELETE' })
    // Optimistic removal
    files.value = files.value.filter(f => f.id !== file.id)
  } catch (e: any) {
    console.error('[files] Delete error:', e.data || e.message)
    alert(e.data?.message || t.value.errorDeletingFile)
    await loadFiles()
  } finally {
    deleting.value = null
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(d: string) {
  try { return format(new Date(d), 'dd MMM yyyy HH:mm', { locale: lang.language.value === 'en' ? enUS : es }) } catch { return d }
}

function fileIcon(mime: string) {
  if (mime.startsWith('image/')) return 'i-heroicons-photo'
  if (mime === 'application/pdf') return 'i-heroicons-document'
  if (mime === 'text/markdown' || mime === 'text/plain') return 'i-heroicons-document-text'
  if (mime === 'application/json') return 'i-heroicons-code-bracket'
  return 'i-heroicons-paper-clip'
}

function fileIconBg(mime: string) {
  if (mime.startsWith('image/')) return 'bg-pink-50 dark:bg-pink-500/10'
  if (mime === 'application/pdf') return 'bg-red-50 dark:bg-red-500/10'
  if (mime === 'text/markdown' || mime === 'text/plain') return 'bg-sky-50 dark:bg-sky-500/10'
  if (mime === 'application/json') return 'bg-amber-50 dark:bg-amber-500/10'
  return 'bg-gray-50 dark:bg-white/5'
}

function fileIconColor(mime: string) {
  if (mime.startsWith('image/')) return 'text-pink-500'
  if (mime === 'application/pdf') return 'text-red-500'
  if (mime === 'text/markdown' || mime === 'text/plain') return 'text-sky-500'
  if (mime === 'application/json') return 'text-amber-500'
  return 'text-gray-500 dark:text-gray-400'
}
</script>
