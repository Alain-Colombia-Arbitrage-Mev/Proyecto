<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 max-h-[85vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-gray-900 mb-1">Nueva tarea</h2>
        <p class="text-sm text-gray-500 mb-5">Agrega una tarea al tablero</p>

        <form class="space-y-4" @submit.prevent="handleCreate">
          <UFormField label="Título">
            <UInput v-model="form.title" placeholder="¿Qué hay que hacer?" required class="w-full" size="lg" autofocus />
          </UFormField>

          <UFormField label="Descripción">
            <LazyTaskEditor
              v-model="form.description"
              :workspace-id="workspaceId"
              placeholder="Describe la tarea..."
              min-height="100px"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Prioridad">
              <USelectMenu v-model="form.priority" :items="priorityOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Fecha límite">
              <UInput v-model="form.due_date" type="date" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Columna">
              <USelectMenu v-model="form.column_id" :items="columnOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Estimación (horas)">
              <UInput v-model="form.estimated_hours" type="number" step="0.5" placeholder="Opcional" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Asignados">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in workspaceMembers"
                :key="m.user_id"
                type="button"
                class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                :class="form.assignees.includes(m.user_id)
                  ? 'bg-focusflow-50 text-focusflow-700 border-focusflow-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'"
                @click="toggleAssignee(m.user_id)"
              >
                <div class="w-4 h-4 rounded-full bg-focusflow-100 text-focusflow-700 flex items-center justify-center text-[7px] font-bold">
                  {{ getInitials(m.email) }}
                </div>
                {{ m.email.split('@')[0] }}
              </button>
            </div>
          </UFormField>

          <!-- Figma Links -->
          <TaskFigmaLinks v-model="form.figma_links" />

          <UFormField label="Etiquetas (separadas por coma)">
            <UInput v-model="form.tagsStr" placeholder="bug, frontend, urgente..." class="w-full" />
          </UFormField>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <UButton variant="ghost" @click="isOpen = false">Cancelar</UButton>
            <UButton type="submit" color="primary" :loading="creating" class="font-semibold">Crear tarea</UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { FigmaLink } from '~/types'

const props = defineProps<{
  open: boolean
  workspaceId: string
  projectId: string
  columnId: string
  workspaceMembers: { user_id: string; email: string; role: string }[]
  columns: { id: string; title: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const creating = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  due_date: '',
  column_id: '',
  estimated_hours: '',
  assignees: [] as string[],
  figma_links: [] as FigmaLink[],
  tagsStr: '',
})

const priorityOptions = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' },
  { label: 'Crítica', value: 'critical' },
]

const columnOptions = computed(() =>
  props.columns.map(c => ({ label: c.title, value: c.id }))
)

watch(() => props.open, (val) => {
  if (val) {
    Object.assign(form, {
      title: '', description: '', priority: 'medium', due_date: '',
      column_id: props.columnId, estimated_hours: '', assignees: [],
      figma_links: [], tagsStr: '',
    })
    error.value = ''
  }
})

function toggleAssignee(userId: string) {
  const idx = form.assignees.indexOf(userId)
  if (idx !== -1) form.assignees.splice(idx, 1)
  else form.assignees.push(userId)
}

function getInitials(email: string) {
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

async function handleCreate() {
  if (!form.title.trim()) return
  error.value = ''
  creating.value = true
  try {
    const tags = form.tagsStr ? form.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []
    await $fetch(`/api/workspaces/${props.workspaceId}/tasks`, {
      method: 'POST',
      body: {
        project_id: props.projectId,
        column_id: form.column_id || null,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        tags,
        assignees: form.assignees,
        figma_links: form.figma_links,
      },
    })
    isOpen.value = false
    emit('created')
  } catch (e: any) {
    error.value = e.data?.message || 'Error al crear tarea'
  } finally {
    creating.value = false
  }
}
</script>
