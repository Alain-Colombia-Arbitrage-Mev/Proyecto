<template>
  <UModal v-model:open="isOpen" class="sm:max-w-lg w-full">
    <template #content>
      <div class="flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UIcon name="i-heroicons-video-camera" class="w-4 h-4 text-blue-600" />
            </div>
            <h2 class="text-lg font-bold text-gray-900">Programar reunión</h2>
          </div>
          <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-4">
          <UFormField label="Título de la reunión">
            <UInput v-model="form.title" placeholder="Ej: Sprint Review, Daily Standup..." required class="w-full" size="lg" autofocus />
          </UFormField>

          <UFormField label="Descripción (opcional)">
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Agenda de la reunión..."
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Fecha y hora">
              <UInput v-model="form.scheduled_at" type="datetime-local" class="w-full" required />
            </UFormField>
            <UFormField label="Duración">
              <USelectMenu v-model="form.duration_minutes" :items="durationOptions" value-key="value" class="w-full" />
            </UFormField>
          </div>

          <!-- Project selector (optional) -->
          <UFormField v-if="projects.length > 0" label="Proyecto (opcional)">
            <USelectMenu v-model="form.project_id" :items="projectOptions" value-key="value" class="w-full" placeholder="Sin proyecto" />
          </UFormField>

          <!-- Attendees -->
          <div>
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Participantes</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in members"
                :key="m.user_id"
                type="button"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border"
                :class="form.attendees.includes(m.user_id)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'"
                @click="toggleAttendee(m.user_id)"
              >
                <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                  {{ getInitials(m.email) }}
                </div>
                {{ m.email.split('@')[0] }}
              </button>
            </div>
            <p v-if="form.attendees.length > 0" class="text-[10px] text-gray-400 mt-1">{{ form.attendees.length }} participante(s) seleccionado(s) — recibirán email con enlace de Google Meet</p>
          </div>

          <!-- Google Meet badge -->
          <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#00897B"/>
              <path d="M15.5 8.5l-1.5 1.5v-2h-5v8h5v-2l1.5 1.5V8.5z" fill="white"/>
            </svg>
            <div>
              <p class="text-xs font-semibold text-gray-700">Google Meet</p>
              <p class="text-[10px] text-gray-400">Se generará automáticamente un enlace de Meet</p>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="createdMeeting" class="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
            <p class="text-sm font-semibold text-emerald-700">Reunión programada</p>
            <a :href="createdMeeting.meeting_url" target="_blank" class="text-xs text-blue-600 hover:underline break-all">
              {{ createdMeeting.meeting_url }}
            </a>
            <p class="text-[10px] text-emerald-600 mt-1">Se enviaron invitaciones por email a {{ form.attendees.length }} participante(s)</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-100">
          <UButton variant="ghost" @click="isOpen = false">{{ createdMeeting ? 'Cerrar' : 'Cancelar' }}</UButton>
          <UButton
            v-if="!createdMeeting"
            color="primary"
            :loading="creating"
            :disabled="!form.title.trim() || !form.scheduled_at"
            class="font-semibold"
            @click="handleCreate"
          >
            <UIcon name="i-heroicons-video-camera" class="w-4 h-4 mr-1" />
            Programar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Meeting } from '~/types'

const props = defineProps<{
  open: boolean
  workspaceId: string
  members: { user_id: string; email: string; role: string }[]
  projects: { id: string; name: string }[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [meeting: Meeting]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const creating = ref(false)
const error = ref('')
const createdMeeting = ref<Meeting | null>(null)

const form = reactive({
  title: '',
  description: '',
  scheduled_at: '',
  duration_minutes: '30',
  project_id: '',
  attendees: [] as string[],
})

const durationOptions = [
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: '1 hora', value: '60' },
  { label: '1.5 horas', value: '90' },
  { label: '2 horas', value: '120' },
]

const projectOptions = computed(() => [
  { label: 'Sin proyecto', value: '' },
  ...props.projects.map(p => ({ label: p.name, value: p.id })),
])

function toggleAttendee(userId: string) {
  const idx = form.attendees.indexOf(userId)
  if (idx !== -1) form.attendees.splice(idx, 1)
  else form.attendees.push(userId)
}

function getInitials(email: string) {
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

async function handleCreate() {
  if (!form.title.trim() || !form.scheduled_at) return
  creating.value = true
  error.value = ''

  try {
    const meeting = await $fetch<Meeting>(`/api/workspaces/${props.workspaceId}/meetings`, {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes),
        project_id: form.project_id || null,
        attendees: form.attendees,
      },
    })
    createdMeeting.value = meeting
    emit('created', meeting)
  } catch (e: any) {
    error.value = e.data?.message || 'Error al programar reunión'
  } finally {
    creating.value = false
  }
}

// Reset on open
watch(isOpen, (v) => {
  if (v) {
    Object.assign(form, {
      title: '',
      description: '',
      scheduled_at: '',
      duration_minutes: '30',
      project_id: '',
      attendees: [],
    })
    error.value = ''
    createdMeeting.value = null
  }
})
</script>
