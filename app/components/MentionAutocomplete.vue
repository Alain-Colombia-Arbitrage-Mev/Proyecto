<script setup lang="ts">
/**
 * @mention autocomplete dropdown.
 * Listens for @ in textarea, shows member suggestions.
 */
const props = defineProps<{
  members: { id: string; email?: string; display_name?: string }[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'mention': [userId: string]
}>()

const showDropdown = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const textareaRef = ref<HTMLTextAreaElement>()
const mentionStartPos = ref(-1)

const filteredMembers = computed(() => {
  if (!searchQuery.value) return props.members.slice(0, 5)
  const q = searchQuery.value.toLowerCase()
  return props.members
    .filter(m => {
      const name = m.display_name || m.email || ''
      return name.toLowerCase().includes(q)
    })
    .slice(0, 5)
})

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  const value = target.value
  emit('update:modelValue', value)

  const cursorPos = target.selectionStart || 0
  const textBeforeCursor = value.slice(0, cursorPos)
  const atIndex = textBeforeCursor.lastIndexOf('@')

  if (atIndex >= 0) {
    const charBefore = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' '
    if (charBefore === ' ' || charBefore === '\n' || atIndex === 0) {
      const query = textBeforeCursor.slice(atIndex + 1)
      if (!query.includes(' ') && query.length < 30) {
        searchQuery.value = query
        mentionStartPos.value = atIndex
        showDropdown.value = true
        selectedIndex.value = 0
        return
      }
    }
  }

  showDropdown.value = false
}

function selectMember(member: { id: string; email?: string; display_name?: string }) {
  const name = member.display_name || member.email?.split('@')[0] || 'user'
  const before = props.modelValue.slice(0, mentionStartPos.value)
  const cursorPos = textareaRef.value?.selectionStart || props.modelValue.length
  const after = props.modelValue.slice(cursorPos)

  const newValue = `${before}@[${member.id}] ${after}`
  emit('update:modelValue', newValue)
  emit('mention', member.id)
  showDropdown.value = false

  nextTick(() => {
    if (textareaRef.value) {
      const pos = before.length + member.id.length + 4
      textareaRef.value.selectionStart = pos
      textareaRef.value.selectionEnd = pos
      textareaRef.value.focus()
    }
  })
}

function onKeydown(e: KeyboardEvent) {
  if (!showDropdown.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredMembers.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && filteredMembers.value.length > 0) {
    e.preventDefault()
    selectMember(filteredMembers.value[selectedIndex.value])
  } else if (e.key === 'Escape') {
    showDropdown.value = false
  }
}
</script>

<template>
  <div class="relative">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="onInput"
      @keydown="onKeydown"
      @blur="() => setTimeout(() => showDropdown = false, 200)"
      class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focusflow-500 resize-none"
      rows="3"
      :placeholder="$attrs.placeholder as string || ''"
    />

    <div
      v-if="showDropdown && filteredMembers.length > 0"
      class="absolute z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        v-for="(member, idx) in filteredMembers"
        :key="member.id"
        @mousedown.prevent="selectMember(member)"
        class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        :class="{ 'bg-gray-50 dark:bg-gray-700': idx === selectedIndex }"
      >
        <span class="w-6 h-6 rounded-full bg-focusflow-500 text-white flex items-center justify-center text-xs font-medium shrink-0">
          {{ (member.display_name || member.email || '?')[0].toUpperCase() }}
        </span>
        <span class="truncate">{{ member.display_name || member.email }}</span>
      </button>
    </div>
  </div>
</template>
