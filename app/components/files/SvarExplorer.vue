<template>
  <div class="svar-explorer rounded-2xl overflow-hidden border border-gray-200/80 dark:border-white/10 shadow-card">
    <div v-if="loading" class="flex items-center justify-center h-[560px] bg-white dark:bg-[#1b1b1b]">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
    </div>
    <!-- SVAR widgets render invisible without a theme wrapper (CSS vars) -->
    <component :is="isDark ? WillowDark : Willow" v-else>
      <Filemanager
        :data="entries"
        :init="init"
      />
    </component>
  </div>
</template>

<script setup lang="ts">
import { Filemanager, Willow, WillowDark } from '@svar-ui/vue-filemanager'
import '@svar-ui/vue-filemanager/all.css'
import type { WorkspaceFile } from '~/types'

const props = defineProps<{ workspaceId: string }>()
const emit = defineEmits<{ open: [file: WorkspaceFile] }>()

const lang = useLanguage()
const { isDark } = useDarkMode()
const es = computed(() => lang.language.value !== 'en')

const loading = ref(true)
const entries = ref<any[]>([])
// SVAR uses paths as ids — map them back to our DB records
const byPath = new Map<string, WorkspaceFile>()
let fmApi: any = null

function filePath(file: any): string {
  const base = file.folder === '/' ? '' : file.folder
  let path = `${base}/${file.file_name}`
  // Disambiguate duplicate names within the same folder
  if (byPath.has(path)) {
    const dot = file.file_name.lastIndexOf('.')
    const stem = dot > 0 ? file.file_name.slice(0, dot) : file.file_name
    const ext = dot > 0 ? file.file_name.slice(dot) : ''
    path = `${base}/${stem} (${String(file.id).slice(0, 4)})${ext}`
  }
  byPath.set(path, file)
  return path
}

async function load() {
  loading.value = true
  byPath.clear()
  try {
    const data = await $fetch<{ files: any[]; folders: string[] }>(
      `/api/workspaces/${props.workspaceId}/files`,
      { query: { all: '1' } },
    )
    const folderEntries = (data.folders || []).map(f => ({
      id: f,
      type: 'folder',
      date: new Date(),
    }))
    const fileEntries = (data.files || []).map(f => ({
      id: filePath(f),
      type: 'file',
      size: f.file_size || 0,
      date: f.created_at ? new Date(f.created_at) : new Date(),
    }))
    entries.value = [...folderEntries, ...fileEntries]
  } finally {
    loading.value = false
  }
}

function recordFor(pathId: string): WorkspaceFile | null {
  return byPath.get(pathId) || null
}

function parentOf(pathId: string): string {
  const parent = pathId.slice(0, pathId.lastIndexOf('/'))
  return parent || '/'
}

function init(api: any) {
  fmApi = api

  // Rename (file or folder)
  api.on('rename-file', async (ev: any) => {
    const rec = recordFor(ev.id)
    try {
      if (rec) {
        await $fetch(`/api/workspaces/${props.workspaceId}/files/${rec.id}`, {
          method: 'PATCH', body: { file_name: ev.name },
        })
      } else {
        // Folder rename
        await $fetch(`/api/workspaces/${props.workspaceId}/files/folder`, {
          method: 'PATCH', body: { path: ev.id, new_name: ev.name },
        })
      }
      await load()
    } catch (e: any) {
      alert(e.data?.message || 'Error')
      await load()
    }
  })

  // Delete (files and/or folders)
  api.on('delete-files', async (ev: any) => {
    const ids: string[] = ev.ids || (ev.id ? [ev.id] : [])
    for (const pathId of ids) {
      const rec = recordFor(pathId)
      try {
        if (rec) {
          await $fetch(`/api/workspaces/${props.workspaceId}/files/${rec.id}`, { method: 'DELETE' })
        } else {
          await $fetch(`/api/workspaces/${props.workspaceId}/files/folder`, {
            method: 'DELETE', body: { path: pathId },
          })
        }
      } catch { /* reload reflects the real state */ }
    }
    await load()
  })

  // Move (cut & paste / drag)
  api.on('move-files', async (ev: any) => {
    const ids: string[] = ev.ids || (ev.id ? [ev.id] : [])
    const target: string = ev.target || ev.parent || '/'
    for (const pathId of ids) {
      const rec = recordFor(pathId)
      try {
        if (rec) {
          await $fetch(`/api/workspaces/${props.workspaceId}/files/${rec.id}`, {
            method: 'PATCH', body: { folder: target === '/' ? '/' : target },
          })
        }
        // Folder moves are not supported by the backend yet — reload restores truth
      } catch { /* reload below */ }
    }
    await load()
  })

  // New folder
  api.on('create-file', async (ev: any) => {
    const pathId: string = ev.file?.id || ev.id || ''
    if (!pathId) return
    const name = pathId.slice(pathId.lastIndexOf('/') + 1)
    try {
      await $fetch(`/api/workspaces/${props.workspaceId}/files/folder`, {
        method: 'POST', body: { parent: parentOf(pathId), name },
      })
    } catch (e: any) {
      alert(e.data?.message || 'Error')
    }
    await load()
  })

  // Copy is not supported by the backend — block it
  api.intercept('copy-files', () => {
    alert(es.value ? 'Copiar no está soportado — usa mover.' : 'Copy is not supported — use move.')
    return false
  })

  // Open → app preview modal (image/video/audio/text/PDF)
  api.on('open-file', (ev: any) => {
    const rec = recordFor(ev.id)
    if (rec) emit('open', rec)
  })

  // Download via signed URL
  api.intercept('download-file', (ev: any) => {
    const rec = recordFor(ev.id)
    if (rec) {
      $fetch<any>(`/api/workspaces/${props.workspaceId}/files/${rec.id}`)
        .then(d => { if (d.download_url) window.open(d.download_url, '_blank') })
        .catch(() => {})
      return false // we handle it
    }
  })
}

defineExpose({ reload: load })

watch(() => props.workspaceId, (id) => { if (id) load() }, { immediate: true })
</script>

<style scoped>
.svar-explorer :deep(.wx-filemanager) {
  height: calc(100vh - 300px);
  min-height: 520px;
}
</style>
