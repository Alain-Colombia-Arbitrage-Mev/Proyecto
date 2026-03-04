<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6 bg-white dark:bg-[#1b1b1b]">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">{{ t.reserveTime }}</h2>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormField :label="t.title">
            <UInput v-model="form.title" :placeholder="lang.language.value === 'en' ? 'e.g. Doctor appointment, Vacation...' : 'Ej: Cita médica, Vacaciones...'" required class="w-full" size="lg" autofocus />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField :label="t.startTime">
              <UInput v-model="form.start_at" type="datetime-local" required class="w-full" size="lg" />
            </UFormField>
            <UFormField :label="t.endTime">
              <UInput v-model="form.end_at" type="datetime-local" required class="w-full" size="lg" />
            </UFormField>
          </div>

          <UFormField :label="lang.language.value === 'en' ? 'Type' : 'Tipo'">
            <USelectMenu v-model="form.type" :items="typeOptions" value-key="value" class="w-full" />
          </UFormField>

          <p v-if="error" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">{{ error }}</p>

          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="isOpen = false">{{ t.cancel }}</UButton>
            <UButton type="submit" color="primary" :loading="saving" class="font-semibold">{{ t.save }}</UButton>
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

const form = reactive({
  title: '',
  start_at: '',
  end_at: '',
  type: 'busy',
})

const error = ref('')
const saving = ref(false)

const typeOptions = computed(() => [
  { label: t.value.busy, value: 'busy' },
  { label: t.value.vacation, value: 'vacation' },
  { label: t.value.personal, value: 'personal' },
])

async function handleSubmit() {
  error.value = ''
  saving.value = true
  try {
    const data = await $fetch(`/api/workspaces/${props.workspaceId}/reserved-dates`, {
      method: 'POST',
      body: {
        title: form.title,
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        type: form.type,
      },
    })
    emit('created', data)
    form.title = ''
    form.start_at = ''
    form.end_at = ''
    form.type = 'busy'
    isOpen.value = false
  } catch (e: any) {
    error.value = e.data?.message || t.value.errorCreatingReservedDate
  } finally {
    saving.value = false
  }
}
</script>
