<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)" class="sm:max-w-lg w-full">
    <template #content>
      <div class="flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <UIcon name="i-heroicons-video-camera" class="w-4 h-4 text-blue-600" />
            </div>
            <h2 class="text-lg font-bold text-gray-900">{{ t.scheduleMeetingTitle }}</h2>
          </div>
          <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="closeModal" />
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-4">
          <UFormField :label="t.meetingTitle">
            <UInput v-model="form.title" :placeholder="t.meetingTitlePlaceholder" required class="w-full" size="lg" autofocus />
          </UFormField>

          <UFormField :label="t.descriptionOptional">
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              :placeholder="t.meetingAgenda"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t.dateTime">
              <UInput v-model="form.scheduled_at" type="datetime-local" class="w-full" required />
            </UFormField>
            <UFormField :label="t.duration">
              <select
                v-model="form.duration_minutes"
                class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
              >
                <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </UFormField>
          </div>

          <!-- Project selector (optional) -->
          <UFormField v-if="projects.length > 0" :label="t.projectOptional">
            <select
              v-model="form.project_id"
              class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            >
              <option value="">{{ t.noProjectOption }}</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </UFormField>

          <!-- Attendees -->
          <div>
            <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">{{ t.attendees }}</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="m in members"
                :key="m.user_id"
                type="button"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border"
                :class="form.attendees.includes(m.user_id)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'"
                @click="toggleAttendee(m.user_id)"
              >
                <div class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[8px] font-bold">
                  {{ getInitials(m.email || m.user_id) }}
                </div>
                {{ (m.email || m.user_id || '??').split('@')[0] }}
              </button>
            </div>
            <p v-if="form.attendees.length > 0" class="text-[10px] text-gray-400 mt-1">{{ form.attendees.length }} {{ t.attendeesSelected }}</p>
          </div>

          <!-- Google Meet badge -->
          <div class="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#00897B"/>
              <path d="M15.5 8.5l-1.5 1.5v-2h-5v8h5v-2l1.5 1.5V8.5z" fill="white"/>
            </svg>
            <div>
              <p class="text-xs font-semibold text-gray-700">Google Meet</p>
              <p class="text-[10px] text-gray-400">{{ t.meetAutoGenerate }}</p>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="createdMeeting" class="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
            <p class="text-sm font-semibold text-emerald-700">{{ t.meetingScheduled }}</p>
            <a :href="createdMeeting.meeting_url" target="_blank" class="text-xs text-blue-600 hover:underline break-all">
              {{ createdMeeting.meeting_url }}
            </a>
            <p class="text-[10px] text-emerald-600 mt-1">{{ t.invitationsSent }} {{ form.attendees.length }} {{ t.attendees.toLowerCase() }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-6 py-3 border-t border-gray-100">
          <UButton variant="ghost" @click="closeModal" class="w-full sm:w-auto">{{ createdMeeting ? t.close : t.cancel }}</UButton>
          <UButton
            v-if="!createdMeeting"
            color="primary"
            :loading="creating"
            :disabled="!form.title.trim() || !form.scheduled_at"
            class="font-semibold w-full sm:w-auto"
            @click="handleCreate"
          >
            <UIcon name="i-heroicons-video-camera" class="w-4 h-4 mr-1" />
            {{ t.schedule }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Meeting } from '~/types'

const supabase = useSupabaseClient()
const lang = useLanguage()
const t = lang.labels

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

function closeModal() {
  emit('update:open', false)
}

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

const durationOptions = computed(() => [
  { label: '15 min', value: '15' },
  { label: '30 min', value: '30' },
  { label: '45 min', value: '45' },
  { label: t.value.hour1, value: '60' },
  { label: t.value.hours1_5, value: '90' },
  { label: t.value.hours2, value: '120' },
])

const projectOptions = computed(() => [
  { label: t.value.noProjectOption, value: '' },
  ...props.projects.map(p => ({ label: p.name, value: p.id })),
])

function toggleAttendee(userId: string) {
  const idx = form.attendees.indexOf(userId)
  if (idx !== -1) form.attendees.splice(idx, 1)
  else form.attendees.push(userId)
}

function getInitials(email: string | null | undefined) {
  if (!email) return '??'
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

async function handleCreate() {
  if (!form.title.trim() || !form.scheduled_at) return
  creating.value = true
  error.value = ''

  try {
    // Get Google OAuth provider token if available (for real Meet creation)
    const { data: sessionData } = await supabase.auth.getSession()
    const providerToken = sessionData?.session?.provider_token || null

    const meeting = await $fetch<Meeting>(`/api/workspaces/${props.workspaceId}/meetings`, {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes),
        project_id: form.project_id || null,
        attendees: form.attendees,
        provider_token: providerToken,
      },
    })
    createdMeeting.value = meeting
    emit('created', meeting)
  } catch (e: any) {
    error.value = e.data?.message || t.value.errorScheduling
  } finally {
    creating.value = false
  }
}

// Reset on open
watch(() => props.open, (v) => {
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
