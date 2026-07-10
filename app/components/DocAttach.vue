<template>
  <div class="space-y-1.5">
    <div class="flex items-center gap-2 flex-wrap">
      <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:border-focusflow-300 dark:hover:border-focusflow-500/40 cursor-pointer transition-colors">
        <UIcon name="i-heroicons-paper-clip" class="w-3.5 h-3.5" />
        {{ label || (es ? 'Adjuntar archivos' : 'Attach files') }}
        <input type="file" multiple :accept="accept" class="hidden" @change="onFiles">
      </label>
      <span v-if="totalChars > 0" class="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
        {{ files.length }} {{ es ? 'archivo(s)' : 'file(s)' }} · {{ Math.round(totalChars / 1000) }}k chars
      </span>
    </div>
    <div v-if="files.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="(f, i) in files"
        :key="f.name + i"
        class="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-focusflow-50 dark:bg-focusflow-500/10 border border-focusflow-200/60 dark:border-focusflow-500/20 text-[10px] font-medium text-focusflow-700 dark:text-focusflow-300"
      >
        <UIcon name="i-heroicons-document-text" class="w-3 h-3 shrink-0" />
        <span class="max-w-[140px] truncate">{{ f.name }}</span>
        <button
          type="button"
          class="w-4 h-4 rounded flex items-center justify-center hover:bg-focusflow-100 dark:hover:bg-white/10 cursor-pointer"
          @click="remove(i)"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface AttachedDoc { name: string; content: string }

const props = defineProps<{
  modelValue: AttachedDoc[]
  accept?: string
  label?: string
  maxFiles?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: AttachedDoc[]] }>()

const lang = useLanguage()
const es = computed(() => lang.language.value !== 'en')

const accept = computed(() => props.accept || '.md,.markdown,.txt,.csv,.json,.yaml,.yml,.html,.xml')
const files = computed(() => props.modelValue)
const totalChars = computed(() => files.value.reduce((sum, f) => sum + f.content.length, 0))

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const selected = Array.from(input.files || [])
  input.value = ''
  const max = props.maxFiles || 10
  const next = [...props.modelValue]
  for (const file of selected) {
    if (next.length >= max) break
    try {
      const content = await file.text()
      if (content.trim()) next.push({ name: file.name, content })
    } catch { /* unreadable file — skip */ }
  }
  emit('update:modelValue', next)
}

function remove(i: number) {
  const next = [...props.modelValue]
  next.splice(i, 1)
  emit('update:modelValue', next)
}
</script>
