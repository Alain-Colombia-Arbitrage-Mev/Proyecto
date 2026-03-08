<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const workspaceStore = useWorkspaceStore()
const { labels, language } = useLanguage()

const workspaceId = computed(() => workspaceStore.workspace?.id || '')
const loading = ref(true)

// Data
const projects = ref<any[]>([])
const tasks = ref<any[]>([])
const relationships = ref<any[]>([])
const milestones = ref<any[]>([])

// UI state
const zoomLevel = ref<'week' | 'month' | 'quarter'>('month')
const expandedProjects = ref<Set<string>>(new Set())
const sidebarRef = ref<HTMLElement | null>(null)
const timelineRef = ref<HTMLElement | null>(null)

// Context menu
const contextMenu = ref<{ show: boolean; x: number; y: number; task: any }>({ show: false, x: 0, y: 0, task: null })

// Inline date editor
const editingTask = ref<any>(null)
const editDueDate = ref('')

// Drag state
const drag = ref<{
  active: boolean
  taskId: string
  mode: 'move' | 'resize-end'
  startX: number
  origStart: string | null
  origEnd: string | null
} | null>(null)

const colWidths = { week: 120, month: 180, quarter: 240 } as const
const colWidth = computed(() => colWidths[zoomLevel.value])

async function fetchRoadmap() {
  if (!workspaceId.value) return
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/workspaces/${workspaceId.value}/roadmap-tasks`)
    projects.value = data.projects || []
    tasks.value = data.tasks || []
    relationships.value = data.relationships || []
    milestones.value = data.milestones || []
    expandedProjects.value = new Set(projects.value.map((p: any) => p.id))
  } catch (err) {
    console.error('[Roadmap] fetch error:', err)
  } finally {
    loading.value = false
  }
}

watch(workspaceId, () => { if (workspaceId.value) fetchRoadmap() }, { immediate: true })

// Tasks grouped by project
const tasksByProject = computed(() => {
  const map = new Map<string, any[]>()
  for (const t of tasks.value) {
    if (!map.has(t.project_id)) map.set(t.project_id, [])
    map.get(t.project_id)!.push(t)
  }
  return map
})

// Milestones grouped by project
const milestonesByProject = computed(() => {
  const map = new Map<string, any[]>()
  for (const m of milestones.value) {
    if (!map.has(m.project_id)) map.set(m.project_id, [])
    map.get(m.project_id)!.push(m)
  }
  return map
})

// Timeline range
const timelineStart = computed(() => {
  const dates: number[] = []
  for (const p of projects.value) {
    if (p.start_date) dates.push(new Date(p.start_date).getTime())
    if (p.created_at) dates.push(new Date(p.created_at).getTime())
  }
  for (const t of tasks.value) {
    if (t.created_at) dates.push(new Date(t.created_at).getTime())
  }
  if (dates.length === 0) return new Date()
  const earliest = new Date(Math.min(...dates))
  return new Date(earliest.getFullYear(), earliest.getMonth() - 1, 1)
})

const timelineEnd = computed(() => {
  const dates: number[] = []
  dates.push(Date.now() + 90 * 86400000)
  for (const p of projects.value) {
    if (p.end_date) dates.push(new Date(p.end_date).getTime())
  }
  for (const t of tasks.value) {
    if (t.due_date) dates.push(new Date(t.due_date).getTime())
  }
  for (const m of milestones.value) {
    if (m.target_date) dates.push(new Date(m.target_date).getTime())
  }
  const latest = new Date(Math.max(...dates))
  return new Date(latest.getFullYear(), latest.getMonth() + 2, 0)
})

// Time slots based on zoom
const timeSlots = computed(() => {
  const slots: { label: string; start: Date; end: Date }[] = []
  const s = new Date(timelineStart.value)
  const e = timelineEnd.value

  if (zoomLevel.value === 'week') {
    const d = new Date(s)
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    while (d < e) {
      const weekEnd = new Date(d)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const lbl = `${d.getDate()} ${d.toLocaleDateString(language.value === 'en' ? 'en-US' : 'es-ES', { month: 'short' })}`
      slots.push({ label: lbl, start: new Date(d), end: weekEnd })
      d.setDate(d.getDate() + 7)
    }
  } else if (zoomLevel.value === 'month') {
    const d = new Date(s.getFullYear(), s.getMonth(), 1)
    while (d < e) {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const lbl = d.toLocaleDateString(language.value === 'en' ? 'en-US' : 'es-ES', { month: 'short', year: '2-digit' })
      slots.push({ label: lbl, start: new Date(d), end: monthEnd })
      d.setMonth(d.getMonth() + 1)
    }
  } else {
    const d = new Date(s.getFullYear(), Math.floor(s.getMonth() / 3) * 3, 1)
    while (d < e) {
      const qEnd = new Date(d.getFullYear(), d.getMonth() + 3, 0)
      const q = Math.floor(d.getMonth() / 3) + 1
      slots.push({ label: `Q${q} ${d.getFullYear()}`, start: new Date(d), end: qEnd })
      d.setMonth(d.getMonth() + 3)
    }
  }
  return slots
})

const timelineWidth = computed(() => timeSlots.value.length * colWidth.value)
const totalRange = computed(() => timelineEnd.value.getTime() - timelineStart.value.getTime())

function getBarStyle(startDate: string | null, endDate: string | null, fallbackCreated?: string) {
  const tStart = timelineStart.value.getTime()
  const range = totalRange.value
  if (range <= 0) return { left: '0px', width: '40px' }

  const barStart = startDate ? new Date(startDate).getTime() : (fallbackCreated ? new Date(fallbackCreated).getTime() : tStart)
  let barEnd = endDate ? new Date(endDate).getTime() : barStart + 14 * 86400000

  if (barEnd <= barStart) barEnd = barStart + 7 * 86400000

  const left = Math.max(0, ((barStart - tStart) / range) * timelineWidth.value)
  const width = Math.max(24, ((barEnd - barStart) / range) * timelineWidth.value)

  return { left: `${left}px`, width: `${width}px` }
}

// Today marker position
const todayLeft = computed(() => {
  const now = Date.now()
  const tStart = timelineStart.value.getTime()
  const range = totalRange.value
  if (range <= 0) return '0px'
  return `${((now - tStart) / range) * timelineWidth.value}px`
})

// Row items
const rowItems = computed(() => {
  const items: { type: 'project' | 'task' | 'milestone'; id: string; projectId: string }[] = []
  for (const p of projects.value) {
    items.push({ type: 'project', id: p.id, projectId: p.id })
    if (expandedProjects.value.has(p.id)) {
      const pTasks = tasksByProject.value.get(p.id) || []
      for (const t of pTasks) {
        items.push({ type: 'task', id: t.id, projectId: p.id })
      }
      const pMilestones = milestonesByProject.value.get(p.id) || []
      for (const m of pMilestones) {
        items.push({ type: 'milestone', id: m.id, projectId: p.id })
      }
    }
  }
  return items
})

const taskRowIndex = computed(() => {
  const map = new Map<string, number>()
  rowItems.value.forEach((item, i) => map.set(item.id, i))
  return map
})

const ROW_HEIGHT = 44

// Dependency SVG paths
const dependencyPaths = computed(() => {
  return relationships.value.map(rel => {
    const sourceIdx = taskRowIndex.value.get(rel.source_task_id)
    const targetIdx = taskRowIndex.value.get(rel.target_task_id)
    if (sourceIdx === undefined || targetIdx === undefined) return null

    const sourceTask = tasks.value.find(t => t.id === rel.source_task_id)
    const targetTask = tasks.value.find(t => t.id === rel.target_task_id)
    if (!sourceTask || !targetTask) return null

    const sourceBar = getBarStyle(sourceTask.created_at, sourceTask.due_date)
    const targetBar = getBarStyle(targetTask.created_at, targetTask.due_date)

    const x1 = parseFloat(sourceBar.left) + parseFloat(sourceBar.width)
    const y1 = sourceIdx * ROW_HEIGHT + ROW_HEIGHT / 2
    const x2 = parseFloat(targetBar.left)
    const y2 = targetIdx * ROW_HEIGHT + ROW_HEIGHT / 2

    const midX = (x1 + x2) / 2
    return { path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`, id: rel.id }
  }).filter(Boolean)
})

function toggleProject(projectId: string) {
  if (expandedProjects.value.has(projectId)) expandedProjects.value.delete(projectId)
  else expandedProjects.value.add(projectId)
}

function toggleAll() {
  if (expandedProjects.value.size === projects.value.length) expandedProjects.value.clear()
  else expandedProjects.value = new Set(projects.value.map(p => p.id))
}

function priorityBarColor(priority: string) {
  return ({ critical: 'bg-rose-400', high: 'bg-amber-300', medium: 'bg-focusflow-400', low: 'bg-sky-300' }[priority] || 'bg-focusflow-400')
}

function priorityDotColor(priority: string) {
  return ({ critical: 'bg-rose-500', high: 'bg-amber-500', medium: 'bg-focusflow-500', low: 'bg-sky-400' }[priority] || 'bg-focusflow-500')
}

function getInitials(str: string) {
  if (!str) return '?'
  if (str.includes('@')) return str.split('@')[0]!.slice(0, 2).toUpperCase()
  return str.slice(0, 2).toUpperCase()
}

// ── Pixel ↔ Date conversion ──
function pxToDate(px: number): Date {
  const tStart = timelineStart.value.getTime()
  const range = totalRange.value
  const tw = timelineWidth.value
  if (tw <= 0) return new Date()
  const ms = tStart + (px / tw) * range
  return new Date(ms)
}

function dateToIso(d: Date): string {
  return d.toISOString().split('T')[0]!
}

// ── Drag to resize/move task bars ──
function onBarMouseDown(e: MouseEvent, task: any, mode: 'move' | 'resize-end') {
  e.preventDefault()
  e.stopPropagation()
  drag.value = {
    active: true,
    taskId: task.id,
    mode,
    startX: e.clientX,
    origStart: task.created_at,
    origEnd: task.due_date,
  }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!drag.value?.active) return
  const task = tasks.value.find(t => t.id === drag.value!.taskId)
  if (!task) return

  const deltaX = e.clientX - drag.value.startX
  const tw = timelineWidth.value
  const range = totalRange.value
  const deltaMs = (deltaX / tw) * range

  if (drag.value.mode === 'resize-end') {
    // Resize: change due_date
    const origEnd = drag.value.origEnd ? new Date(drag.value.origEnd).getTime() : new Date(drag.value.origStart!).getTime() + 14 * 86400000
    const newEnd = new Date(origEnd + deltaMs)
    task.due_date = dateToIso(newEnd)
  } else {
    // Move: shift both created_at and due_date
    const origStart = new Date(drag.value.origStart!).getTime()
    const origEnd = drag.value.origEnd ? new Date(drag.value.origEnd).getTime() : origStart + 14 * 86400000
    task.created_at = new Date(origStart + deltaMs).toISOString()
    task.due_date = dateToIso(new Date(origEnd + deltaMs))
  }
}

async function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)

  if (!drag.value?.active) return
  const task = tasks.value.find(t => t.id === drag.value!.taskId)
  drag.value = null
  if (!task) return

  // Persist changes
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, {
      method: 'PATCH',
      body: { due_date: task.due_date },
    })
  } catch (err) {
    console.error('[Roadmap] Error updating task date:', err)
    fetchRoadmap() // Revert on error
  }
}

// ── Context menu ──
function onTaskContextMenu(e: MouseEvent, task: any) {
  e.preventDefault()
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, task }
}

function closeContextMenu() {
  contextMenu.value = { show: false, x: 0, y: 0, task: null }
}

function openEditDate(task: any) {
  editingTask.value = task
  editDueDate.value = task.due_date || ''
  closeContextMenu()
}

async function saveEditDate() {
  if (!editingTask.value) return
  const task = editingTask.value
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, {
      method: 'PATCH',
      body: { due_date: editDueDate.value || null },
    })
    task.due_date = editDueDate.value || null
  } catch (err) {
    console.error('[Roadmap] Error saving date:', err)
  }
  editingTask.value = null
}

function cancelEditDate() {
  editingTask.value = null
}

async function deleteTask(task: any) {
  const msg = language.value === 'en' ? `Delete "${task.title}"?` : `¿Eliminar "${task.title}"?`
  if (!confirm(msg)) return
  closeContextMenu()
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, { method: 'DELETE' })
    tasks.value = tasks.value.filter(t => t.id !== task.id)
  } catch (err) {
    console.error('[Roadmap] Error deleting task:', err)
  }
}

function navigateToTask(task: any) {
  closeContextMenu()
  navigateTo(`/${workspaceStore.slug}/projects/${task.project_id}/kanban`)
}

// Close context menu on click outside
function onDocClick() {
  if (contextMenu.value.show) closeContextMenu()
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// Synchronized scrolling
function onTimelineScroll() {
  if (sidebarRef.value && timelineRef.value) sidebarRef.value.scrollTop = timelineRef.value.scrollTop
}
function onSidebarScroll() {
  if (sidebarRef.value && timelineRef.value) timelineRef.value.scrollTop = sidebarRef.value.scrollTop
}
</script>

<template>
  <div class="max-w-full mx-auto animate-fade-up">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ labels.roadmap }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ labels.timeline }}
          <span class="text-[10px] text-gray-400 ml-2">{{ language === 'en' ? 'Drag bars to change dates · Right-click for options' : 'Arrastra barras para cambiar fechas · Clic derecho para opciones' }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Zoom controls -->
        <div class="flex items-center bg-white dark:bg-[#1b1b1b] rounded-lg border border-gray-200 dark:border-white/10 p-0.5">
          <button
            v-for="level in (['week', 'month', 'quarter'] as const)"
            :key="level"
            class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer"
            :class="zoomLevel === level
              ? 'bg-focusflow-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="zoomLevel = level"
          >
            {{ level === 'week' ? labels.thisWeek?.replace(/esta /i, '') || 'Week' : level === 'month' ? labels.thisMonth?.replace(/este /i, '') || 'Month' : labels.quarter }}
          </button>
        </div>
        <button
          class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-white dark:bg-[#1b1b1b] rounded-lg border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
          @click="toggleAll"
        >
          {{ expandedProjects.size === projects.length ? labels.collapseAll : labels.expandAll }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400 dark:text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ labels.loading }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="text-center py-16">
      <div class="w-16 h-16 rounded-2xl bg-focusflow-50 dark:bg-focusflow-500/10 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-map" class="w-8 h-8 text-focusflow-400" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ labels.noProjects }}</h3>
    </div>

    <!-- Gantt chart -->
    <div v-else class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-card flex" style="height: calc(100vh - 220px);">
      <!-- Left sidebar -->
      <div class="w-[280px] shrink-0 border-r border-gray-200 dark:border-white/10 flex flex-col">
        <div class="h-10 flex items-center px-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {{ labels.projectsAndTasks }}
          </span>
        </div>
        <div ref="sidebarRef" class="flex-1 overflow-y-auto overflow-x-hidden" @scroll="onSidebarScroll">
          <template v-for="project in projects" :key="project.id">
            <!-- Project row -->
            <div
              class="h-10 flex items-center gap-2 px-3 border-b border-gray-100 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
              @click="toggleProject(project.id)"
            >
              <UIcon
                :name="expandedProjects.has(project.id) ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
                class="w-3.5 h-3.5 text-gray-400 shrink-0"
              />
              <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: project.color || '#14b8a6' }" />
              <span class="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate">{{ project.name }}</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 ml-auto shrink-0">{{ (tasksByProject.get(project.id) || []).length }}</span>
            </div>

            <!-- Task rows -->
            <template v-if="expandedProjects.has(project.id)">
              <div
                v-for="task in (tasksByProject.get(project.id) || [])"
                :key="task.id"
                class="h-10 flex items-center gap-2 pl-8 pr-3 border-b border-gray-50 dark:border-white/[0.04] hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group/task"
              >
                <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="priorityDotColor(task.priority || 'medium')" />
                <span class="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{{ task.title }}</span>
                <!-- Quick action buttons (visible on hover) -->
                <div class="flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
                  <button class="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-focusflow-500 cursor-pointer" @click.stop="openEditDate(task)" :title="labels.dueDate">
                    <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
                  </button>
                  <button class="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 cursor-pointer" @click.stop="deleteTask(task)" :title="labels.delete">
                    <UIcon name="i-heroicons-trash" class="w-3 h-3" />
                  </button>
                </div>
                <div v-if="task.assignees?.length" class="flex -space-x-1">
                  <div
                    v-for="(a, i) in task.assignees.slice(0, 2)"
                    :key="i"
                    class="w-5 h-5 rounded-full bg-focusflow-100 dark:bg-focusflow-500/15 text-focusflow-700 dark:text-focusflow-400 flex items-center justify-center text-[8px] font-bold border border-white dark:border-[#1b1b1b]"
                  >
                    {{ getInitials(a) }}
                  </div>
                </div>
              </div>

              <!-- Milestones -->
              <div
                v-for="ms in (milestonesByProject.get(project.id) || [])"
                :key="ms.id"
                class="h-10 flex items-center gap-2 pl-8 pr-3 border-b border-gray-50 dark:border-white/[0.04]"
              >
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 12 12">
                  <path d="M6 0 L12 6 L6 12 L0 6 Z" :fill="ms.completed ? '#14b8a6' : '#fbbf24'" />
                </svg>
                <span class="text-[11px] font-medium truncate" :class="ms.completed ? 'text-focusflow-600 dark:text-focusflow-400' : 'text-amber-600 dark:text-amber-400'">
                  {{ ms.title }}
                </span>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- Right timeline -->
      <div ref="timelineRef" class="flex-1 overflow-auto" @scroll="onTimelineScroll">
        <!-- Timeline header -->
        <div class="sticky top-0 z-10 flex h-10 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-white/10" :style="{ width: timelineWidth + 'px' }">
          <div
            v-for="slot in timeSlots"
            :key="slot.label"
            class="shrink-0 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-white/[0.06]"
            :style="{ width: colWidth + 'px' }"
          >
            {{ slot.label }}
          </div>
        </div>

        <!-- Gantt body -->
        <div class="relative" :style="{ width: timelineWidth + 'px', minHeight: rowItems.length * ROW_HEIGHT + 'px' }">
          <!-- Grid lines -->
          <div class="absolute inset-0 flex pointer-events-none">
            <div v-for="(_, i) in timeSlots" :key="i" class="shrink-0 border-r border-gray-50 dark:border-white/[0.04] h-full" :style="{ width: colWidth + 'px' }" />
          </div>

          <!-- Today marker -->
          <div class="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-focusflow-400 z-20 pointer-events-none" :style="{ left: todayLeft }">
            <div class="absolute -top-0.5 -left-[11px] text-[8px] font-bold text-focusflow-500 bg-focusflow-50 dark:bg-focusflow-500/10 px-1 rounded">
              {{ labels.today }}
            </div>
          </div>

          <!-- Dependency arrows -->
          <svg v-if="dependencyPaths.length > 0" class="absolute inset-0 z-10 pointer-events-none" :width="timelineWidth" :height="rowItems.length * ROW_HEIGHT">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
              </marker>
            </defs>
            <path v-for="dep in dependencyPaths" :key="dep!.id" :d="dep!.path" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 2" marker-end="url(#arrowhead)" opacity="0.6" />
          </svg>

          <!-- Rows -->
          <template v-for="(item, idx) in rowItems" :key="item.id">
            <div class="absolute left-0 right-0 flex items-center border-b border-gray-50 dark:border-white/[0.04]" :style="{ top: idx * ROW_HEIGHT + 'px', height: ROW_HEIGHT + 'px' }">

              <!-- Project bar -->
              <template v-if="item.type === 'project'">
                <div
                  v-if="projects.find(p => p.id === item.id)"
                  class="absolute h-7 rounded-lg opacity-30 gantt-bar"
                  :style="{
                    ...getBarStyle(projects.find(p => p.id === item.id)!.start_date, projects.find(p => p.id === item.id)!.end_date, projects.find(p => p.id === item.id)!.created_at),
                    backgroundColor: projects.find(p => p.id === item.id)!.color || '#14b8a6',
                  }"
                />
              </template>

              <!-- Task bar (draggable) -->
              <template v-if="item.type === 'task'">
                <div
                  v-if="tasks.find(t => t.id === item.id)"
                  class="absolute h-6 rounded-md gantt-bar group/bar select-none"
                  :class="[
                    priorityBarColor(tasks.find(t => t.id === item.id)!.priority || 'medium'),
                    drag?.active && drag.taskId === item.id ? 'opacity-90 shadow-lg z-30' : 'z-[15]',
                  ]"
                  :style="getBarStyle(tasks.find(t => t.id === item.id)!.created_at, tasks.find(t => t.id === item.id)!.due_date)"
                  :title="tasks.find(t => t.id === item.id)!.title"
                  @contextmenu="onTaskContextMenu($event, tasks.find(t => t.id === item.id)!)"
                  @mousedown="onBarMouseDown($event, tasks.find(t => t.id === item.id)!, 'move')"
                >
                  <!-- Bar content -->
                  <span class="text-[11px] font-medium text-white px-2 truncate block leading-6 pointer-events-none">
                    {{ tasks.find(t => t.id === item.id)!.title }}
                  </span>
                  <!-- Right resize handle -->
                  <div
                    class="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-r-md"
                    style="background: rgba(255,255,255,0.3);"
                    @mousedown.stop="onBarMouseDown($event, tasks.find(t => t.id === item.id)!, 'resize-end')"
                  >
                    <div class="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/60 rounded-full" />
                  </div>
                </div>
              </template>

              <!-- Milestone diamond -->
              <template v-if="item.type === 'milestone'">
                <div
                  v-if="milestones.find(m => m.id === item.id)"
                  class="absolute flex items-center justify-center"
                  :style="{ left: getBarStyle(milestones.find(m => m.id === item.id)!.target_date, milestones.find(m => m.id === item.id)!.target_date).left }"
                >
                  <svg class="w-4 h-4" viewBox="0 0 16 16">
                    <path d="M8 1 L15 8 L8 15 L1 8 Z" :fill="milestones.find(m => m.id === item.id)!.completed ? '#14b8a6' : '#fbbf24'" />
                  </svg>
                  <span class="ml-1 text-[9px] font-medium whitespace-nowrap" :class="milestones.find(m => m.id === item.id)!.completed ? 'text-focusflow-600 dark:text-focusflow-400' : 'text-amber-600 dark:text-amber-400'">
                    {{ milestones.find(m => m.id === item.id)!.title }}
                  </span>
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="fixed z-50 bg-white dark:bg-[#1b1b1b] rounded-xl shadow-lg border border-gray-200 dark:border-white/10 py-1 min-w-[180px] animate-fade-up"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" @click="openEditDate(contextMenu.task)">
          <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
          {{ language === 'en' ? 'Edit due date' : 'Editar fecha límite' }}
        </button>
        <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer" @click="navigateToTask(contextMenu.task)">
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 text-gray-400" />
          {{ language === 'en' ? 'Open in board' : 'Abrir en tablero' }}
        </button>
        <div class="border-t border-gray-200/80 dark:border-white/10 my-1" />
        <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer" @click="deleteTask(contextMenu.task)">
          <UIcon name="i-heroicons-trash" class="w-4 h-4" />
          {{ labels.deleteTask }}
        </button>
      </div>
    </Teleport>

    <!-- Inline date editor modal -->
    <UModal v-model:open="editingTask" v-if="editingTask">
      <template #content>
        <div class="p-5 dark:bg-[#1b1b1b]">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-1">{{ language === 'en' ? 'Edit due date' : 'Editar fecha límite' }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">{{ editingTask?.title }}</p>
          <input
            v-model="editDueDate"
            type="date"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-focusflow-500 outline-none"
          />
          <div class="flex justify-end gap-2 mt-4">
            <UButton variant="ghost" size="sm" @click="cancelEditDate">{{ labels.cancel }}</UButton>
            <UButton color="primary" size="sm" @click="saveEditDate" class="font-semibold">{{ labels.save }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
