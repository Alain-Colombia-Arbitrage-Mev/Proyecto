<script setup lang="ts">
import type { Goal } from '~/types'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { labels } = useLanguage()
const { canManageGoals, canViewGoals } = usePermissions()

const workspaceId = computed(() => workspaceStore.workspace?.id || '')
const projects = computed(() => workspaceStore.projects || [])
const goals = ref<Goal[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const filterStatus = ref<string>('')
const filterType = ref<string>('')
const filterProject = ref<string>('')

async function fetchGoals() {
  if (!workspaceId.value) return
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterType.value) params.goal_type = filterType.value

    goals.value = await $fetch<Goal[]>(`/api/workspaces/${workspaceId.value}/goals`, { params })
  } catch (err) {
    console.error('[Goals] fetch error:', err)
  } finally {
    loading.value = false
  }
}

function onGoalCreated(goal: Goal) {
  goals.value.unshift(goal)
  showCreateModal.value = false
}

function getGoalProjectId(goal: Goal): string | null {
  const link = goal.goal_links?.find(l => l.entity_type === 'project')
  return link?.entity_id || null
}

const filteredGoals = computed(() => {
  if (!filterProject.value) return goals.value
  return goals.value.filter(g => getGoalProjectId(g) === filterProject.value)
})

const topLevelGoals = computed(() => filteredGoals.value.filter(g => !g.parent_goal_id))
const childGoals = (parentId: string) => filteredGoals.value.filter(g => g.parent_goal_id === parentId)

// Group goals by project
const groupedGoals = computed(() => {
  const groups: { projectId: string | null; projectName: string; projectColor: string; goals: Goal[] }[] = []
  const projectMap = new Map<string | null, Goal[]>()

  for (const goal of topLevelGoals.value) {
    const pid = getGoalProjectId(goal)
    if (!projectMap.has(pid)) projectMap.set(pid, [])
    projectMap.get(pid)!.push(goal)
  }

  // Project groups first
  for (const p of projects.value) {
    const goalsInProject = projectMap.get(p.id)
    if (goalsInProject) {
      groups.push({ projectId: p.id, projectName: p.name, projectColor: p.color, goals: goalsInProject })
    }
  }

  // General (no project) last
  const generalGoals = projectMap.get(null)
  if (generalGoals) {
    groups.push({ projectId: null, projectName: labels.value.generalGoals, projectColor: '#9ca3af', goals: generalGoals })
  }

  return groups
})

watch(workspaceId, () => { if (workspaceId.value) fetchGoals() }, { immediate: true })
watch([filterStatus, filterType], fetchGoals)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ labels.goals }}</h1>
      </div>

      <div class="flex items-center gap-3">
        <select v-model="filterProject" class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
          <option value="">{{ labels.allProjects }}</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>

        <select v-model="filterStatus" class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
          <option value="">{{ labels.all }}</option>
          <option value="active">{{ labels.goalActive }}</option>
          <option value="completed">{{ labels.goalCompleted }}</option>
          <option value="cancelled">{{ labels.goalCancelled }}</option>
        </select>

        <select v-model="filterType" class="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5">
          <option value="">{{ labels.all }}</option>
          <option value="goal">{{ labels.goal }}</option>
          <option value="objective">{{ labels.objective }}</option>
          <option value="key_result">{{ labels.keyResult }}</option>
        </select>

        <button
          v-if="canManageGoals"
          @click="showCreateModal = true"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-focusflow-500 text-white hover:bg-focusflow-600"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          {{ labels.createGoal }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-400">{{ labels.loading }}</div>

    <div v-else-if="filteredGoals.length === 0" class="text-center py-16">
      <UIcon name="i-heroicons-flag" class="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
      <p class="text-gray-500 dark:text-gray-400">{{ labels.noGoals }}</p>
    </div>

    <div v-else class="space-y-8">
      <div v-for="group in groupedGoals" :key="group.projectId ?? 'general'">
        <!-- Group header -->
        <div class="flex items-center gap-2 mb-3">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: group.projectColor }" />
          <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ group.projectName }}</h2>
          <span class="text-xs text-gray-400">({{ group.goals.length }})</span>
        </div>

        <div class="space-y-4">
          <div v-for="goal in group.goals" :key="goal.id">
            <GoalCard :goal="goal" :projects="projects" @click="() => {}" />

            <!-- Child goals (objectives / key results) -->
            <div v-if="childGoals(goal.id).length > 0" class="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-800 pl-4">
              <GoalCard
                v-for="child in childGoals(goal.id)"
                :key="child.id"
                :goal="child"
                :projects="projects"
                @click="() => {}"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <GoalCreateModal
      v-if="showCreateModal"
      :workspace-id="workspaceId"
      :projects="projects"
      @created="onGoalCreated"
      @close="showCreateModal = false"
    />
  </div>
</template>
