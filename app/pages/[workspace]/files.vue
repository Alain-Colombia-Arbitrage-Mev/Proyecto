<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">{{ t.filesTitle }}</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ t.filesDesc }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton size="sm" variant="soft" icon="i-heroicons-arrow-up-tray" @click="triggerUpload" :loading="uploading" class="font-medium">
          {{ t.uploadFile }}
        </UButton>
      </div>
    </div>

    <!-- Breadcrumb -->
    <div class="flex items-center gap-1.5 mb-4 text-sm animate-fade-up">
      <button
        class="text-gray-500 hover:text-focusflow-700 font-medium transition-colors cursor-pointer"
        @click="navigateTo('/')"
      >
        <UIcon name="i-heroicons-home" class="w-4 h-4" />
      </button>
      <template v-for="(part, i) in breadcrumbs" :key="i">
        <UIcon name="i-heroicons-chevron-right" class="w-3 h-3 text-gray-300" />
        <button
          class="text-gray-500 hover:text-focusflow-700 font-medium transition-colors cursor-pointer"
          @click="navigateTo(breadcrumbPath(i))"
        >
          {{ part }}
        </button>
      </template>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loadingFiles }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="files.length === 0 && subfolders.length === 0" class="text-center py-20 animate-fade-up">
      <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-folder-open" class="w-10 h-10 text-gray-300" />
      </div>
      <h2 class="text-xl font-bold text-gray-900">{{ t.noFiles }}</h2>
      <p class="text-sm text-gray-500 mt-2 mb-8 max-w-xs mx-auto">{{ t.noFilesDesc }}</p>
      <UButton icon="i-heroicons-arrow-up-tray" color="primary" size="lg" class="font-semibold" @click="triggerUpload">{{ t.uploadFile }}</UButton>
    </div>

    <!-- File grid -->
    <div v-else class="animate-fade-up delay-100">
      <!-- Subfolders -->
      <div v-if="subfolders.length > 0" class="mb-4">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{{ t.folders }}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <button
            v-for="folder in subfolders"
            :key="folder"
            class="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-gray-100 hover:border-focusflow-200 transition-all cursor-pointer group shadow-card hover:shadow-card-hover"
            @click="navigateTo(currentFolder === '/' ? `/${folder}` : `${currentFolder}/${folder}`)"
          >
            <div class="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-folder" class="w-5 h-5 text-amber-500" />
            </div>
            <span class="text-sm font-medium text-gray-900 truncate group-hover:text-focusflow-700 transition-colors">{{ folder }}</span>
          </button>
        </div>
      </div>

      <!-- Files -->
      <div v-if="files.length > 0">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">{{ t.filesTitle }}</p>
        <div class="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden divide-y divide-gray-50">
          <div
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors group"
          >
            <!-- Icon -->
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="fileIconBg(file.mime_type)">
              <UIcon :name="fileIcon(file.mime_type)" class="w-5 h-5" :class="fileIconColor(file.mime_type)" />
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900 truncate">{{ file.file_name }}</p>
              <div class="flex items-center gap-3 mt-0.5">
                <span class="text-[10px] text-gray-400 font-medium">{{ formatFileSize(file.file_size) }}</span>
                <span class="text-[10px] text-gray-400 font-medium">{{ formatDate(file.created_at) }}</span>
                <span v-if="file.source === 'ai_generated'" class="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">AI</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-focusflow-700 hover:bg-focusflow-50 transition-all cursor-pointer"
                @click="downloadFile(file)"
                :title="t.download"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
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

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload" multiple />
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
  if (mime.startsWith('image/')) return 'bg-pink-50'
  if (mime === 'application/pdf') return 'bg-red-50'
  if (mime === 'text/markdown' || mime === 'text/plain') return 'bg-sky-50'
  if (mime === 'application/json') return 'bg-amber-50'
  return 'bg-gray-50'
}

function fileIconColor(mime: string) {
  if (mime.startsWith('image/')) return 'text-pink-500'
  if (mime === 'application/pdf') return 'text-red-500'
  if (mime === 'text/markdown' || mime === 'text/plain') return 'text-sky-500'
  if (mime === 'application/json') return 'text-amber-500'
  return 'text-gray-400'
}
</script>
