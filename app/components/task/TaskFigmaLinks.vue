<template>
  <div class="space-y-2">
    <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Figma Links</h4>

    <!-- Existing links -->
    <div v-for="(link, i) in modelValue" :key="i" class="flex items-center gap-2 group">
      <div class="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
        <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
          <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
          <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
          <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
          <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
        </svg>
        <a :href="link.url" target="_blank" class="text-xs text-gray-700 hover:text-focusflow-600 truncate flex-1" :title="link.url">
          {{ link.label || truncateUrl(link.url) }}
        </a>
      </div>
      <button type="button" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 cursor-pointer" @click="removeLink(i)">
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </button>
    </div>

    <!-- Add new link -->
    <form @submit.prevent="addLink" class="flex items-center gap-2">
      <div class="flex items-center gap-2 flex-1 bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-focusflow-300 focus-within:border-focusflow-300">
        <svg class="w-3.5 h-3.5 flex-shrink-0 opacity-40" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
          <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
          <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
          <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
          <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
        </svg>
        <input
          v-model="newUrl"
          type="url"
          placeholder="https://figma.com/design/..."
          class="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>
      <UButton type="submit" size="xs" variant="soft" :disabled="!isValidFigmaUrl" class="font-medium">Agregar</UButton>
    </form>
    <p v-if="newUrl && !isValidFigmaUrl" class="text-[10px] text-red-500">URL de Figma no válida</p>
  </div>
</template>

<script setup lang="ts">
import type { FigmaLink } from '~/types'

const props = defineProps<{
  modelValue: FigmaLink[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FigmaLink[]]
}>()

const newUrl = ref('')

const FIGMA_REGEX = /figma\.com\/(file|design|proto|board|community)\//

const isValidFigmaUrl = computed(() => {
  if (!newUrl.value) return false
  try {
    new URL(newUrl.value)
    return FIGMA_REGEX.test(newUrl.value)
  } catch {
    return false
  }
})

function truncateUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.split('/').filter(Boolean)
    if (path.length >= 3) return `figma.com/${path[0]}/${path[1]}/${path[2]!.slice(0, 20)}...`
    return u.host + u.pathname.slice(0, 40)
  } catch {
    return url.slice(0, 50)
  }
}

function addLink() {
  if (!isValidFigmaUrl.value) return
  const updated = [...props.modelValue, { url: newUrl.value }]
  emit('update:modelValue', updated)
  newUrl.value = ''
}

function removeLink(index: number) {
  const updated = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}
</script>
