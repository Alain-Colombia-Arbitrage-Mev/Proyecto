<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Proyectos</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ store.projects.length }} proyecto{{ store.projects.length !== 1 ? 's' : '' }}</p>
      </div>
      <UButton icon="i-heroicons-plus" color="primary" size="md" class="font-semibold" @click="showCreate = true">
        Nuevo proyecto
      </UButton>
    </div>

    <!-- Stat Cards Row -->
    <div v-if="store.projects.length > 0" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up">
      <!-- Proyectos Totales -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Proyectos Totales</p>
        <div class="flex items-end justify-between">
          <span class="text-4xl font-bold text-gray-900 tabular-nums">{{ store.projects.length }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'p'+i" class="flex-1 rounded-sm bg-emerald-200" :style="{ height: `${barHeights.projects[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Tareas Totales -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tareas Totales</p>
        <div class="flex items-end justify-between">
          <span class="text-4xl font-bold text-gray-900 tabular-nums">{{ totalTasks }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'t'+i" class="flex-1 rounded-sm bg-emerald-300" :style="{ height: `${barHeights.tasks[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Vencen Hoy -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vencen Hoy</p>
        <div class="flex items-end justify-between">
          <span class="text-4xl font-bold text-gray-900 tabular-nums">{{ dueTodayCount }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'d'+i" class="flex-1 rounded-sm bg-emerald-200" :style="{ height: `${barHeights.dueToday[i - 1]}%` }" />
          </div>
        </div>
      </div>
      <!-- Completadas -->
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Completadas</p>
        <div class="flex items-end justify-between">
          <span class="text-4xl font-bold text-gray-900 tabular-nums">{{ completedTaskCount }}</span>
          <div class="flex items-end gap-0.5 h-10 w-20">
            <div v-for="i in 7" :key="'c'+i" class="flex-1 rounded-sm bg-emerald-300" :style="{ height: `${barHeights.completed[i - 1]}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div v-if="store.projects.length > 0" class="flex items-center justify-between mb-6 animate-fade-up">
      <p class="text-sm font-semibold text-gray-700">Tablero &mdash; Tareas del Sprint</p>
      <div class="flex items-center gap-2">
        <UButton variant="outline" size="sm" icon="i-heroicons-funnel" class="text-gray-600">
          Filtros
        </UButton>
        <UButton color="primary" size="sm" icon="i-heroicons-plus" class="font-semibold" @click="showCreate = true">
          Crear tarea
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando proyectos...</span>
      </div>
    </div>

    <!-- No workspace -->
    <div v-else-if="!store.workspace" class="text-center py-20 animate-fade-up">
      <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-building-office" class="w-8 h-8 text-gray-400" />
      </div>
      <h2 class="text-lg font-bold text-gray-900">Workspace no encontrado</h2>
      <p class="text-sm text-gray-500 mt-2 mb-6">Necesitas crear un workspace primero</p>
      <UButton color="primary" size="lg" class="font-semibold" @click="router.push('/onboarding')">Crear workspace</UButton>
    </div>

    <!-- Empty state -->
    <div v-else-if="store.projects.length === 0" class="text-center py-20 animate-fade-up">
      <div class="w-20 h-20 rounded-2xl bg-focusflow-50 flex items-center justify-center mx-auto mb-5">
        <UIcon name="i-heroicons-folder-plus" class="w-10 h-10 text-focusflow-500" />
      </div>
      <h2 class="text-xl font-bold text-gray-900">Sin proyectos aún</h2>
      <p class="text-sm text-gray-500 mt-2 mb-8 max-w-xs mx-auto">Crea tu primer proyecto para organizar tareas en un tablero Kanban</p>
      <UButton icon="i-heroicons-plus" color="primary" size="lg" class="font-semibold" @click="showCreate = true">Crear primer proyecto</UButton>
    </div>

    <!-- Project grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up delay-100">
      <NuxtLink
        v-for="project in store.projects"
        :key="project.id"
        :to="`/${store.slug}/projects/${project.id}/kanban`"
      >
        <div class="bg-white rounded-2xl p-5 border border-gray-100 hover:border-focusflow-300 transition-all duration-200 cursor-pointer group h-full shadow-sm hover:shadow-md">
          <div class="flex items-start gap-3">
            <div class="w-4 h-4 rounded-full mt-0.5 shrink-0" :style="{ backgroundColor: project.color }" />
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-gray-900 truncate group-hover:text-focusflow-600 transition-colors">{{ project.name }}</h3>
              <p v-if="project.description" class="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{{ project.description }}</p>
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider" :class="statusClasses(project.status)">
                  {{ statusLabel(project.status) }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider" :class="priorityClasses(project.priority)">
                  {{ priorityLabel(project.priority) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Create project modal -->
    <UModal v-model:open="showCreate">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-1">Nuevo proyecto</h2>
          <p class="text-sm text-gray-500 mb-6">Configura los detalles de tu proyecto</p>

          <form class="space-y-5" @submit.prevent="handleCreateProject">
            <UFormField label="Nombre del proyecto">
              <UInput v-model="newProject.name" placeholder="Ej: App Mobile, API v2..." required class="w-full" size="lg" autofocus />
            </UFormField>
            <UFormField label="Descripción (opcional)">
              <UTextarea v-model="newProject.description" placeholder="¿De qué trata este proyecto?" class="w-full" :rows="2" />
            </UFormField>
            <UFormField label="Prioridad">
              <USelectMenu v-model="newProject.priority" :items="priorityOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Plantilla Kanban">
              <div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                <button
                  v-for="tpl in templateConfigs"
                  :key="tpl.value"
                  type="button"
                  class="w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer"
                  :class="newProject.template === tpl.value
                    ? 'border-focusflow-400 bg-focusflow-50/60 shadow-sm'
                    : 'border-gray-100 hover:border-focusflow-200 hover:bg-gray-50'"
                  @click="newProject.template = tpl.value"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-gray-900">{{ tpl.label }}</span>
                    <span class="text-[9px] font-semibold text-gray-400">{{ tpl.cols }} columnas</span>
                  </div>
                  <div class="flex gap-1 flex-wrap">
                    <span
                      v-for="col in tpl.columns"
                      :key="col.title"
                      class="text-[8px] font-semibold px-1.5 py-0.5 rounded"
                      :style="{ backgroundColor: col.color + '18', color: col.color }"
                    >{{ col.title }}</span>
                  </div>
                </button>
              </div>
            </UFormField>
            <p v-if="createError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ createError }}</p>
            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showCreate = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="creating" class="font-semibold">Crear proyecto</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const router = useRouter()
const store = useWorkspaceStore()

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const newProject = reactive({ name: '', description: '', priority: 'medium', template: 'simple' })

// Task stats
const totalTasks = ref(0)
const completedTaskCount = ref(0)
const dueTodayCount = ref(0)

// Generate stable random bar heights (decorative mini charts)
function generateBarHeights() {
  return Array.from({ length: 7 }, () => Math.round(20 + Math.random() * 80))
}
const barHeights = reactive({
  projects: generateBarHeights(),
  tasks: generateBarHeights(),
  dueToday: generateBarHeights(),
  completed: generateBarHeights(),
})

// Load stats when workspace is available
watch(() => store.workspace?.id, async (wsId) => {
  if (!wsId || store.projects.length === 0) return
  try {
    const supabase = useSupabaseClient()
    const projectIds = store.projects.map((p: any) => p.id)

    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
    totalTasks.value = total || 0

    // Completed tasks (last column per project)
    const { data: cols } = await supabase
      .from('kanban_columns')
      .select('id, project_id, position')
      .in('project_id', projectIds)
      .order('position', { ascending: false })

    if (cols && cols.length > 0) {
      const lastCols = new Map<string, string>()
      for (const col of cols as any[]) {
        if (!lastCols.has(col.project_id)) lastCols.set(col.project_id, col.id)
      }
      const { count: done } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('column_id', Array.from(lastCols.values()))
      completedTaskCount.value = done || 0
    }

    // Due today
    const today = new Date().toISOString().slice(0, 10)
    const { count: dueToday } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('due_date', today)
    dueTodayCount.value = dueToday || 0
  } catch { /* silent */ }
}, { immediate: true })

const priorityOptions = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' },
  { label: 'Crítica', value: 'critical' },
]
const templateConfigs = [
  {
    label: 'Simple', value: 'simple', cols: 3,
    columns: [
      { title: 'Pendiente', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Kanban Clásico', value: 'kanban', cols: 5,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'To Do', color: '#3B82F6' },
      { title: 'En Progreso', color: '#F59E0B' },
      { title: 'Revisión', color: '#8B5CF6' },
      { title: 'Hecho', color: '#10B981' },
    ],
  },
  {
    label: 'Desarrollo IT', value: 'dev', cols: 6,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Análisis', color: '#8B5CF6' },
      { title: 'Dev', color: '#3B82F6' },
      { title: 'Code Review', color: '#F59E0B' },
      { title: 'QA', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
    ],
  },
  {
    label: 'DevOps', value: 'devops', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Diseño', color: '#8B5CF6' },
      { title: 'Desarrollo', color: '#3B82F6' },
      { title: 'Code Review', color: '#6366F1' },
      { title: 'CI/CD', color: '#F59E0B' },
      { title: 'Staging', color: '#F97316' },
      { title: 'Producción', color: '#10B981' },
      { title: 'Monitoreo', color: '#14B8A6' },
    ],
  },
  {
    label: 'Soporte', value: 'support', cols: 6,
    columns: [
      { title: 'Nuevo', color: '#3B82F6' },
      { title: 'Triaje', color: '#6366F1' },
      { title: 'Asignado', color: '#8B5CF6' },
      { title: 'En Proceso', color: '#F59E0B' },
      { title: 'Esperando', color: '#F97316' },
      { title: 'Cerrado', color: '#10B981' },
    ],
  },
  {
    label: 'Scrum', value: 'scrum', cols: 6,
    columns: [
      { title: 'Product Backlog', color: '#6B7280' },
      { title: 'Sprint Backlog', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'En Review', color: '#F59E0B' },
      { title: 'QA', color: '#8B5CF6' },
      { title: 'Done', color: '#10B981' },
    ],
  },
  {
    label: 'Scrumban', value: 'scrumban', cols: 8,
    columns: [
      { title: 'Backlog', color: '#6B7280' },
      { title: 'Listo para Pull', color: '#6366F1' },
      { title: 'En Progreso', color: '#3B82F6' },
      { title: 'Review', color: '#F59E0B' },
      { title: 'Testing', color: '#8B5CF6' },
      { title: 'Deploy', color: '#F97316' },
      { title: 'Done', color: '#10B981' },
      { title: 'Archivado', color: '#9CA3AF' },
    ],
  },
]

async function handleCreateProject() {
  createError.value = ''
  creating.value = true
  try {
    await store.createProject({
      name: newProject.name,
      description: newProject.description,
      priority: newProject.priority,
      kanban_template: newProject.template,
    })
    showCreate.value = false
    Object.assign(newProject, { name: '', description: '', priority: 'medium', template: 'simple' })
  } catch (e: any) {
    createError.value = e.data?.message || e.message || 'Error al crear el proyecto'
  } finally {
    creating.value = false
  }
}

function statusClasses(s: string) {
  return ({ active: 'bg-emerald-50 text-emerald-700', planning: 'bg-sky-50 text-sky-700', review: 'bg-amber-50 text-amber-700', completed: 'bg-gray-100 text-gray-500', paused: 'bg-red-50 text-red-700' }[s] || 'bg-gray-100 text-gray-500')
}
function statusLabel(s: string) {
  return { active: 'Activo', planning: 'Planificación', review: 'Revisión', completed: 'Completado', paused: 'Pausado' }[s] || s
}
function priorityClasses(p: string) {
  return ({ critical: 'bg-red-50 text-red-700', high: 'bg-amber-50 text-amber-700', medium: 'bg-sky-50 text-sky-700', low: 'bg-gray-100 text-gray-500' }[p] || 'bg-gray-100 text-gray-500')
}
function priorityLabel(p: string) {
  return { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' }[p] || p
}
</script>
