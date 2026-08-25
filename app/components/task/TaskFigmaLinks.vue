<template>
  <div class="space-y-2">
    <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ sectionTitle }}</h4>

    <!-- Existing links -->
    <div v-for="(link, i) in modelValue" :key="i" class="flex items-center gap-2 group">
      <div class="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 dark:bg-white/[0.05] rounded-lg px-2.5 py-1.5 border border-gray-200/80 dark:border-white/10">
        <UIcon :name="iconForUrl(link.url)" class="w-4 h-4 flex-shrink-0" :class="isFigmaUrl(link.url) ? 'text-[#A259FF]' : 'text-focusflow-500 dark:text-focusflow-300'" />
        <a :href="link.url" target="_blank" class="text-xs text-gray-700 dark:text-gray-300 hover:text-focusflow-600 dark:hover:text-focusflow-400 truncate flex-1" :title="link.url">
          {{ link.label || truncateUrl(link.url) }}
        </a>
      </div>
      <button type="button" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer" @click="removeLink(i)">
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- Add new link -->
    <form @submit.prevent="addLink" class="flex items-center gap-2">
      <div class="flex items-center gap-2 flex-1 bg-white dark:bg-[#1b1b1b] rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-focusflow-300 focus-within:border-focusflow-300">
        <UIcon name="i-heroicons-link" class="w-3.5 h-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
        <input
          v-model="newUrl"
          type="url"
          :placeholder="placeholder"
          class="flex-1 text-xs bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
      <UButton type="submit" size="xs" variant="soft" :disabled="!isValidUrl" class="font-medium">{{ addLabel }}</UButton>
    </form>
    <p v-if="newUrl && !isValidUrl" class="text-[10px] text-red-500">{{ invalidLabel }}</p>
  </div>
</template>

<script setup lang="ts">
import type { FigmaLink } from '~/types'

const props = defineProps<{
  modelValue: FigmaLink[]
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FigmaLink[]]
}>()

const newUrl = ref('')

const lang = useLanguage()
const isEn = computed(() => lang.language.value === 'en')

const sectionTitle = computed(() => props.title || (isEn.value ? 'Links' : 'Enlaces'))
const addLabel = computed(() => isEn.value ? 'Add' : 'Agregar')
const invalidLabel = computed(() => isEn.value ? 'Enter a valid http or https URL' : 'Ingresa una URL http o https válida')
const placeholder = computed(() => isEn.value ? 'https://example.com/deliverable' : 'https://ejemplo.com/entregable')

const isValidUrl = computed(() => {
  const candidate = newUrl.value.trim()
  if (!candidate) return false
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
})

function isFigmaUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('figma.com')
  } catch {
    return false
  }
}

function iconForUrl(url: string): string {
  return isFigmaUrl(url) ? 'i-simple-icons-figma' : 'i-heroicons-link'
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.split('/').filter(Boolean)
    if (path.length >= 2) return `${u.host}/${path[0]}/${path[1]!.slice(0, 20)}${path[1]!.length > 20 ? '...' : ''}`
    return u.host + u.pathname.slice(0, 40)
  } catch {
    return url.slice(0, 50)
  }
}

function labelFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function addLink() {
  if (!isValidUrl.value) return
  const url = newUrl.value.trim()
  const updated = [...props.modelValue, { url, label: labelFromUrl(url) }]
  emit('update:modelValue', updated)
  newUrl.value = ''
}

function removeLink(index: number) {
  const updated = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}
</script>
