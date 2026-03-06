<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 bg-white dark:bg-[#1b1b1b]">
        <!-- Header -->
        <div class="flex items-center gap-2.5 mb-6">
          <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-calendar" class="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ t.reserveTime }}</h2>
            <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ isEn ? 'Block time on the team calendar' : 'Bloquea tiempo en el calendario del equipo' }}</p>
          </div>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <!-- Title -->
          <UFormField :label="t.title">
            <UInput v-model="form.title" :placeholder="isEn ? 'e.g. Doctor appointment, Vacation...' : 'Ej: Cita médica, Vacaciones...'" required class="w-full" size="lg" autofocus />
          </UFormField>

          <!-- Type selector as visual pills -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ isEn ? 'Type' : 'Tipo' }}</label>
            <div class="flex gap-2">
              <button
                v-for="opt in typeOptions"
                :key="opt.value"
                type="button"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border"
                :class="form.type === opt.value ? opt.activeClass : 'bg-white dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/[0.08] hover:border-gray-200 dark:hover:border-white/[0.12]'"
                @click="form.type = opt.value"
              >
                <UIcon :name="opt.icon" class="w-3.5 h-3.5" />
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- Start date/time -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.startTime }}</label>
            <div class="grid grid-cols-3 gap-2">
              <input
                v-model="form.startDate"
                type="date"
                required
                class="col-span-1 text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40"
              />
              <select
                v-model="form.startHour"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40 cursor-pointer"
              >
                <option v-for="h in hours" :key="h" :value="h">{{ h }}h</option>
              </select>
              <select
                v-model="form.startMin"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40 cursor-pointer"
              >
                <option v-for="m in minutes" :key="m" :value="m">{{ m }} min</option>
              </select>
            </div>
          </div>

          <!-- End date/time -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.endTime }}</label>
            <div class="grid grid-cols-3 gap-2">
              <input
                v-model="form.endDate"
                type="date"
                required
                class="col-span-1 text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40"
              />
              <select
                v-model="form.endHour"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40 cursor-pointer"
              >
                <option v-for="h in hours" :key="h" :value="h">{{ h }}h</option>
              </select>
              <select
                v-model="form.endMin"
                class="text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-500/40 cursor-pointer"
              >
                <option v-for="m in minutes" :key="m" :value="m">{{ m }} min</option>
              </select>
            </div>
          </div>

          <!-- Quick duration shortcuts -->
          <div>
            <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ isEn ? 'Quick duration' : 'Duración rápida' }}</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="q in quickDurations"
                :key="q.minutes"
                type="button"
                class="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:border-gray-200 dark:hover:border-white/[0.12]"
                @click="applyQuickDuration(q.minutes)"
              >
                {{ q.label }}
              </button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-3 py-2">{{ error }}</p>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-1">
            <UButton variant="ghost" @click="isOpen = false">{{ t.cancel }}</UButton>
            <UButton type="submit" color="primary" :loading="saving" class="font-semibold">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 mr-1" />
              {{ t.save }}
            </UButton>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  workspaceId: string
}>()

const emit = defineEmits<{
  created: [data: any]
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const lang = useLanguage()
const t = lang.labels
const isEn = computed(() => lang.language.value === 'en')

const pad = (n: number) => String(n).padStart(2, '0')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const form = reactive({
  title: '',
  type: 'busy',
  startDate: todayStr(),
  startHour: '09',
  startMin: '00',
  endDate: todayStr(),
  endHour: '10',
  endMin: '00',
})

const error = ref('')
const saving = ref(false)

const hours = Array.from({ length: 24 }, (_, i) => pad(i))
const minutes = ['00', '15', '30', '45']

const typeOptions = [
  { label: 'Ocupado', value: 'busy', icon: 'i-heroicons-no-symbol', activeClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' },
  { label: 'Vacaciones', value: 'vacation', icon: 'i-heroicons-sun', activeClass: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' },
  { label: 'Personal', value: 'personal', icon: 'i-heroicons-user', activeClass: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20' },
]

const quickDurations = computed(() => [
  { label: '30 min', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: isEn.value ? 'Half day' : 'Medio día', minutes: 240 },
  { label: isEn.value ? 'Full day' : 'Día completo', minutes: 480 },
  { label: isEn.value ? 'Whole week' : 'Semana', minutes: 2400 },
])

function applyQuickDuration(mins: number) {
  const start = new Date(`${form.startDate}T${form.startHour}:${form.startMin}:00`)
  const end = new Date(start.getTime() + mins * 60000)
  form.endDate = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
  form.endHour = pad(end.getHours())
  // Snap to nearest 15 min
  const snappedMin = Math.round(end.getMinutes() / 15) * 15
  form.endMin = pad(snappedMin >= 60 ? 45 : snappedMin)
}

async function handleSubmit() {
  error.value = ''
  const startAt = new Date(`${form.startDate}T${form.startHour}:${form.startMin}:00`)
  const endAt = new Date(`${form.endDate}T${form.endHour}:${form.endMin}:00`)

  if (endAt <= startAt) {
    error.value = isEn.value ? 'End time must be after start time' : 'La hora de fin debe ser posterior a la de inicio'
    return
  }

  saving.value = true
  try {
    const data = await $fetch(`/api/workspaces/${props.workspaceId}/reserved-dates`, {
      method: 'POST',
      body: {
        title: form.title,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        type: form.type,
      },
    })
    emit('created', data)
    form.title = ''
    form.type = 'busy'
    form.startDate = todayStr()
    form.startHour = '09'
    form.startMin = '00'
    form.endDate = todayStr()
    form.endHour = '10'
    form.endMin = '00'
    isOpen.value = false
  } catch (e: any) {
    error.value = e.data?.message || t.value.errorCreatingReservedDate
  } finally {
    saving.value = false
  }
}

// Pre-fill date on open
watch(isOpen, (v) => {
  if (v) {
    form.startDate = todayStr()
    form.endDate = todayStr()
    error.value = ''
  }
})
</script>
