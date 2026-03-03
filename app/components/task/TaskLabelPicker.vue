<template>
  <div class="space-y-2">
    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Labels</h4>

    <!-- Current labels -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="label in allLabels"
        :key="label.id"
        type="button"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer border"
        :class="isSelected(label.id)
          ? 'border-transparent ring-1 ring-offset-1'
          : 'border-gray-200 opacity-60 hover:opacity-100'"
        :style="{
          backgroundColor: isSelected(label.id) ? label.color + '20' : 'transparent',
          color: label.color,
          '--tw-ring-color': isSelected(label.id) ? label.color : undefined,
        } as any"
        @click="toggleLabel(label)"
      >
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: label.color }" />
        {{ label.name }}
      </button>
    </div>

    <!-- Create label inline -->
    <div v-if="showCreate" class="flex items-center gap-2 mt-2">
      <input
        v-model="newLabelName"
        class="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-focusflow-300"
        placeholder="Nombre del label"
        @keydown.enter.prevent="createLabel"
      />
      <div class="flex gap-1">
        <button
          v-for="c in presetColors"
          :key="c"
          type="button"
          class="w-5 h-5 rounded-full border-2 cursor-pointer transition-all"
          :class="newLabelColor === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'"
          :style="{ backgroundColor: c }"
          @click="newLabelColor = c"
        />
      </div>
      <UButton size="xs" variant="soft" @click="createLabel" :disabled="!newLabelName.trim()">OK</UButton>
      <button type="button" class="text-gray-400 hover:text-gray-600 cursor-pointer" @click="showCreate = false">
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </button>
    </div>
    <button v-else type="button" class="text-[11px] text-focusflow-600 hover:text-focusflow-700 font-medium cursor-pointer" @click="showCreate = true">
      + Crear label
    </button>

    <!-- Predefined suggestions -->
    <div v-if="allLabels.length === 0 && !showCreate" class="mt-1">
      <p class="text-[10px] text-gray-400 mb-1.5">Sugerencias:</p>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="s in suggestions"
          :key="s.name"
          type="button"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer border border-gray-200 hover:bg-gray-50 transition-colors"
          :style="{ color: s.color }"
          @click="createSuggested(s)"
        >
          <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: s.color }" />
          {{ s.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Label } from '~/types'

const props = defineProps<{
  workspaceId: string
  taskId: string
  selectedLabelIds: string[]
}>()

const emit = defineEmits<{
  labelsChanged: [labels: Label[]]
}>()

const allLabels = ref<Label[]>([])
const showCreate = ref(false)
const newLabelName = ref('')
const newLabelColor = ref('#EF4444')

const presetColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899']

const suggestions = [
  { name: 'Urgente', color: '#EF4444' },
  { name: 'Alta', color: '#F97316' },
  { name: 'Media', color: '#EAB308' },
  { name: 'Baja', color: '#22C55E' },
]

function isSelected(labelId: string) {
  return props.selectedLabelIds.includes(labelId)
}

async function loadLabels() {
  try {
    const data = await $fetch<Label[]>(`/api/workspaces/${props.workspaceId}/labels`)
    allLabels.value = data
  } catch {}
}

async function toggleLabel(label: Label) {
  try {
    if (isSelected(label.id)) {
      await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/labels/${label.id}`, { method: 'DELETE' })
    } else {
      await $fetch(`/api/workspaces/${props.workspaceId}/tasks/${props.taskId}/labels`, {
        method: 'POST',
        body: { label_id: label.id },
      })
    }
    // Emit updated selected labels
    const currentSelected = isSelected(label.id)
      ? allLabels.value.filter(l => props.selectedLabelIds.includes(l.id) && l.id !== label.id)
      : [...allLabels.value.filter(l => props.selectedLabelIds.includes(l.id)), label]
    emit('labelsChanged', currentSelected)
  } catch {}
}

async function createLabel() {
  if (!newLabelName.value.trim()) return
  try {
    const label = await $fetch<Label>(`/api/workspaces/${props.workspaceId}/labels`, {
      method: 'POST',
      body: { name: newLabelName.value.trim(), color: newLabelColor.value },
    })
    allLabels.value.push(label)
    newLabelName.value = ''
    showCreate.value = false
  } catch {}
}

async function createSuggested(s: { name: string; color: string }) {
  try {
    const label = await $fetch<Label>(`/api/workspaces/${props.workspaceId}/labels`, {
      method: 'POST',
      body: { name: s.name, color: s.color },
    })
    allLabels.value.push(label)
  } catch {}
}

onMounted(loadLabels)
</script>
