<template>
  <UModal :open="open" @update:open="(v: boolean) => emit('update:open', v)" class="sm:max-w-lg w-full">
    <template #content>
      <div class="flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <UIcon name="i-heroicons-video-camera" class="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ t.scheduleMeetingTitle }}</h2>
              <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ isEn ? 'Create a Google Meet link and notify attendees' : 'Crea un enlace de Google Meet y notifica a los asistentes' }}</p>
            </div>
          </div>
          <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="closeModal" />
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <!-- Title -->
          <UFormField :label="t.meetingTitle">
            <UInput v-model="form.title" :placeholder="t.meetingTitlePlaceholder" required class="w-full" size="lg" autofocus />
          </UFormField>

          <!-- Description -->
          <UFormField :label="t.descriptionOptional">
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40"
              :placeholder="t.meetingAgenda"
            />
          </UFormField>

          <!-- Date + Time -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.dateTime }}</label>
            <div class="grid grid-cols-3 gap-2">
              <input
                v-model="form.date"
                type="date"
                required
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40"
              />
              <select
                v-model="form.hour"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40 cursor-pointer"
              >
                <option v-for="h in hours" :key="h" :value="h">{{ h }}h</option>
              </select>
              <select
                v-model="form.minute"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40 cursor-pointer"
              >
                <option v-for="m in minuteOptions" :key="m" :value="m">{{ m }} min</option>
              </select>
            </div>
          </div>

          <!-- Duration as visual pills -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.duration }}</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="opt in durationOptions"
                :key="opt.value"
                type="button"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border"
                :class="form.duration_minutes === opt.value
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                  : 'bg-white dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/[0.08] hover:border-gray-200 dark:hover:border-white/[0.12]'"
                @click="form.duration_minutes = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Project selector (optional) -->
          <UFormField v-if="projects.length > 0" :label="t.projectOptional">
            <select
              v-model="form.project_id"
              class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40 cursor-pointer"
            >
              <option value="">{{ t.noProjectOption }}</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </UFormField>

          <!-- Attendees -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.attendees }}</label>
            <!-- Search filter -->
            <input
              v-model="memberSearch"
              type="text"
              class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500/40"
              :placeholder="isEn ? 'Search members or type external email...' : 'Buscar miembros o escribir email externo...'"
              @keydown.enter.prevent="addExternalEmail"
            />
            <div class="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
              <button
                v-for="m in filteredMembers"
                :key="m.user_id"
                type="button"
                class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border"
                :class="form.attendees.includes(m.user_id)
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 shadow-sm'
                  : 'bg-white dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/[0.08] hover:border-gray-200 dark:hover:border-white/[0.12]'"
                @click="toggleAttendee(m.user_id)"
              >
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  :class="form.attendees.includes(m.user_id)
                    ? 'bg-blue-200 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'"
                >
                  {{ getInitials(m.email || m.user_id) }}
                </div>
                {{ (m.email || m.user_id || '??').split('@')[0] }}
                <UIcon
                  v-if="form.attendees.includes(m.user_id)"
                  name="i-heroicons-check"
                  class="w-3 h-3 text-blue-500"
                />
              </button>
            </div>
            <!-- External emails -->
            <div v-if="form.externalEmails.length > 0" class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="(email, idx) in form.externalEmails"
                :key="email"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20"
              >
                <UIcon name="i-heroicons-envelope" class="w-3 h-3" />
                {{ email }}
                <button type="button" class="ml-0.5 hover:text-red-500 transition-colors cursor-pointer" @click="form.externalEmails.splice(idx, 1)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </span>
            </div>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
              {{ form.attendees.length + form.externalEmails.length }} {{ t.attendeesSelected }}
              <span v-if="form.externalEmails.length > 0"> ({{ form.externalEmails.length }} {{ isEn ? 'external' : 'externos' }})</span>
            </p>
          </div>

          <!-- Google Meet badge -->
          <div class="flex items-center gap-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl px-4 py-3">
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#00897B"/>
              <path d="M15.5 8.5l-1.5 1.5v-2h-5v8h5v-2l1.5 1.5V8.5z" fill="white"/>
            </svg>
            <div>
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Google Meet</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ t.meetAutoGenerate }}</p>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-3 py-2">{{ error }}</p>

          <!-- Success -->
          <div v-if="createdMeeting" class="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-4 py-3">
            <p class="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{{ t.meetingScheduled }}</p>
            <a :href="createdMeeting.meeting_url" target="_blank" class="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">
              {{ createdMeeting.meeting_url }}
            </a>
            <p class="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">{{ t.invitationsSent }} {{ form.attendees.length + form.externalEmails.length }} {{ t.attendees.toLowerCase() }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06]">
          <UButton variant="ghost" @click="closeModal" class="w-full sm:w-auto">{{ createdMeeting ? t.close : t.cancel }}</UButton>
          <UButton
            v-if="!createdMeeting"
            color="primary"
            :loading="creating"
            :disabled="!form.title.trim() || !form.date"
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
const isEn = computed(() => lang.language.value === 'en')

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

const pad = (n: number) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const nextHour = () => pad(Math.min(new Date().getHours() + 1, 23))

const form = reactive({
  title: '',
  description: '',
  date: todayStr(),
  hour: nextHour(),
  minute: '00',
  duration_minutes: 30,
  project_id: '',
  attendees: [] as string[],
  externalEmails: [] as string[],
})

const memberSearch = ref('')

const filteredMembers = computed(() => {
  const q = memberSearch.value.toLowerCase().trim()
  if (!q) return props.members
  return props.members.filter(m =>
    (m.email || '').toLowerCase().includes(q) ||
    m.user_id.toLowerCase().includes(q) ||
    (m.role || '').toLowerCase().includes(q)
  )
})

function addExternalEmail() {
  const input = memberSearch.value.trim()
  if (!input || !input.includes('@') || !input.includes('.')) return
  const email = input.toLowerCase()
  // Don't add if already a member
  if (props.members.some(m => (m.email || '').toLowerCase() === email)) return
  // Don't add duplicates
  if (form.externalEmails.includes(email)) return
  form.externalEmails.push(email)
  memberSearch.value = ''
}

const hours = Array.from({ length: 24 }, (_, i) => pad(i))
const minuteOptions = ['00', '15', '30', '45']

const durationOptions = computed(() => [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: isEn.value ? '1 hour' : '1 hora', value: 60 },
  { label: isEn.value ? '1.5 hours' : '1.5 horas', value: 90 },
  { label: isEn.value ? '2 hours' : '2 horas', value: 120 },
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
  if (!form.title.trim() || !form.date) return
  creating.value = true
  error.value = ''

  try {
    const scheduledAt = new Date(`${form.date}T${form.hour}:${form.minute}:00`)

    // Get Google OAuth provider token if available (for real Meet creation)
    const { data: sessionData } = await supabase.auth.getSession()
    const providerToken = sessionData?.session?.provider_token || null

    const meeting = await $fetch<Meeting>(`/api/workspaces/${props.workspaceId}/meetings`, {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: form.duration_minutes,
        project_id: form.project_id || null,
        attendees: form.attendees,
        external_emails: form.externalEmails.length > 0 ? form.externalEmails : undefined,
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
      date: todayStr(),
      hour: nextHour(),
      minute: '00',
      duration_minutes: 30,
      project_id: '',
      attendees: [],
      externalEmails: [],
    })
    memberSearch.value = ''
    error.value = ''
    createdMeeting.value = null
  }
})
</script>
