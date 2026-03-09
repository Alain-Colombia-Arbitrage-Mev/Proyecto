<script setup lang="ts">
import type { GoalLink, Project } from '~/types'

const props = defineProps<{
  workspaceId: string
  goalId: string
  projects?: Project[]
  existingLinks?: GoalLink[]
}>()

const emit = defineEmits<{
  'link-added': []
  'link-removed': [linkId: string]
}>()

const { labels } = useLanguage()
const { canManageGoals } = usePermissions()

const showAdd = ref(false)
const entityType = ref<'project' | 'task'>('project')
const selectedProjectId = ref('')

const projectLinks = computed(() => {
  if (!props.existingLinks || !props.projects) return []
  return props.existingLinks
    .filter(l => l.entity_type === 'project')
    .map(l => ({
      ...l,
      project: props.projects!.find(p => p.id === l.entity_id),
    }))
    .filter(l => l.project)
})

const availableProjects = computed(() => {
  if (!props.projects) return []
  const linkedIds = new Set(props.existingLinks?.filter(l => l.entity_type === 'project').map(l => l.entity_id) || [])
  return props.projects.filter(p => !linkedIds.has(p.id))
})

async function addLink() {
  if (!selectedProjectId.value) return
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/goals/${props.goalId}/links`, {
      method: 'POST',
      body: { entity_type: entityType.value, entity_id: selectedProjectId.value },
    })
    showAdd.value = false
    selectedProjectId.value = ''
    emit('link-added')
  } catch (err) {
    console.error('[GoalLinkPicker] add error:', err)
  }
}

async function removeLink(linkId: string) {
  try {
    await $fetch(`/api/workspaces/${props.workspaceId}/goals/${props.goalId}/links/${linkId}`, {
      method: 'DELETE',
    })
    emit('link-removed', linkId)
  } catch (err) {
    console.error('[GoalLinkPicker] remove error:', err)
  }
}
</script>

<template>
  <div>
    <!-- Existing project links as chips -->
    <div v-if="projectLinks.length" class="flex flex-wrap gap-1.5 mb-2">
      <span
        v-for="link in projectLinks"
        :key="link.id"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      >
        <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: link.project!.color }" />
        {{ link.project!.name }}
        <button
          v-if="canManageGoals"
          @click="removeLink(link.id)"
          class="ml-0.5 text-gray-500 dark:text-gray-400 hover:text-red-500"
        >×</button>
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        v-if="canManageGoals && !showAdd && availableProjects.length > 0"
        @click="showAdd = true"
        class="text-xs text-gray-500 hover:text-focusflow-600 dark:text-gray-400"
      >
        + {{ labels.linkProject }}
      </button>
    </div>

    <div v-if="showAdd" class="mt-2 space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <select v-model="selectedProjectId" class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
        <option value="" disabled>{{ labels.selectProject }}</option>
        <option v-for="p in availableProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <div class="flex gap-2">
        <button @click="addLink" :disabled="!selectedProjectId" class="px-3 py-1 text-xs font-medium rounded-lg bg-focusflow-500 text-white hover:bg-focusflow-600 disabled:opacity-50">{{ labels.save }}</button>
        <button @click="showAdd = false; selectedProjectId = ''" class="px-3 py-1 text-xs text-gray-500">{{ labels.cancel }}</button>
      </div>
    </div>
  </div>
</template>
