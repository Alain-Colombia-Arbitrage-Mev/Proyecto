<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Adjuntos</h4>
      <button v-if="!readonly" type="button" class="text-xs text-focusflow-600 hover:text-focusflow-700 font-medium cursor-pointer" @click="triggerUpload">
        + Agregar
      </button>
    </div>

    <!-- Drop zone -->
    <div
      v-if="!readonly"
      class="border-2 border-dashed rounded-lg p-4 text-center transition-colors"
      :class="isDragging ? 'border-focusflow-400 bg-focusflow-50' : 'border-gray-200 hover:border-gray-300'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <UIcon name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-gray-400 mx-auto mb-1" />
      <p class="text-[11px] text-gray-400">Arrastra archivos aquí o <button type="button" class="text-focusflow-600 underline cursor-pointer" @click="triggerUpload">selecciona</button></p>
    </div>

    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileSelect" />

    <!-- Uploading indicator -->
    <div v-if="uploading" class="flex items-center gap-2 text-xs text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
      Subiendo...
    </div>

    <!-- Attachment grid -->
    <div v-if="attachments.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div v-for="att in attachments" :key="att.id" class="group relative bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
        <!-- Image thumbnail -->
        <a v-if="isImage(att.mime_type)" :href="att.url" target="_blank" class="block">
          <img :src="att.url" :alt="att.file_name" class="w-full h-20 object-cover" />
        </a>
        <!-- File icon -->
        <div v-else class="flex items-center justify-center h-20">
          <UIcon name="i-heroicons-document" class="w-8 h-8 text-gray-300" />
        </div>
        <!-- File name + delete -->
        <div class="px-2 py-1.5 flex items-center justify-between">
          <span class="text-[10px] text-gray-600 truncate flex-1">{{ att.file_name }}</span>
          <button v-if="!readonly" type="button" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer ml-1" @click="handleDelete(att)">
            <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskAttachment } from '~/types'

const props = defineProps<{
  taskId: string
  workspaceId: string
  readonly?: boolean
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const attachments = ref<TaskAttachment[]>([])

function isImage(mime: string) {
  return mime.startsWith('image/')
}

async function loadAttachments() {
  try {
    const data = await $fetch<TaskAttachment[]>(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/attachments`)
    attachments.value = data
  } catch {}
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) uploadFiles(Array.from(files))
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files) uploadFiles(Array.from(files))
}

async function uploadFiles(files: File[]) {
  uploading.value = true
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/attachments`, {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('[TaskAttachments] Upload error:', err)
    }
  }
  uploading.value = false
  await loadAttachments()
}

async function handleDelete(att: TaskAttachment) {
  if (!confirm(`¿Eliminar "${att.file_name}"?`)) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/attachments/${att.id}`, {
      method: 'DELETE',
    })
    attachments.value = attachments.value.filter(a => a.id !== att.id)
  } catch {}
}

onMounted(loadAttachments)
</script>
