<template>
  <Teleport to="body">
    <Transition name="quiz-overlay">
      <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">

          <!-- Progress bar -->
          <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-focusflow-500 to-emerald-400 transition-all duration-500 ease-out"
              :style="{ width: `${progress}%` }"
            />
          </div>

          <div class="p-6 sm:p-8">

            <!-- Intro step -->
            <div v-if="step === 0" class="text-center space-y-4 animate-fade-up">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-focusflow-500 to-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100" style="font-family: 'Space Grotesk', sans-serif;">
                {{ t.quizTitle }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                {{ t.quizDescription }}
              </p>
              <UButton color="primary" size="lg" class="font-semibold mt-4" @click="step = 1">
                {{ t.quizStart }}
              </UButton>
              <button class="block mx-auto text-xs text-gray-400 hover:text-gray-500 mt-2" @click="skip">
                {{ t.quizSkip }}
              </button>
            </div>

            <!-- Question steps -->
            <div v-else-if="step <= questions.length" class="animate-fade-up" :key="step">
              <div class="flex items-center justify-between mb-6">
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {{ step }}/{{ questions.length }}
                </span>
                <button class="text-xs text-gray-400 hover:text-gray-500" @click="skip">{{ t.quizSkip }}</button>
              </div>

              <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 leading-snug">
                {{ currentQuestion.text }}
              </h3>

              <!-- Scale question (1-5) -->
              <div v-if="currentQuestion.type === 'scale'" class="space-y-3">
                <button
                  v-for="opt in scaleOptionsForQuestion"
                  :key="opt.value"
                  class="w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                  :class="answers[step - 1]?.value === opt.value
                    ? 'border-focusflow-500 bg-focusflow-50 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300'
                    : 'border-gray-100 dark:border-gray-700 hover:border-focusflow-200 dark:hover:border-focusflow-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                  @click="selectAnswer(opt.value, opt.label)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      :class="answers[step - 1]?.value === opt.value
                        ? 'bg-focusflow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                    >{{ opt.value }}</div>
                    {{ opt.label }}
                  </div>
                </button>
              </div>

              <!-- Multiple choice question -->
              <div v-else class="space-y-3">
                <button
                  v-for="(opt, oi) in currentQuestion.options"
                  :key="oi"
                  class="w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium"
                  :class="answers[step - 1]?.value === oi + 1
                    ? 'border-focusflow-500 bg-focusflow-50 dark:bg-focusflow-950 text-focusflow-700 dark:text-focusflow-300'
                    : 'border-gray-100 dark:border-gray-700 hover:border-focusflow-200 dark:hover:border-focusflow-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                  @click="selectAnswer(oi + 1, opt)"
                >
                  {{ opt }}
                </button>
              </div>

              <!-- Navigation -->
              <div class="flex justify-between mt-8">
                <UButton variant="ghost" size="sm" @click="step > 1 ? step-- : step = 0">
                  {{ t.back }}
                </UButton>
                <UButton
                  color="primary"
                  size="sm"
                  :disabled="!answers[step - 1]"
                  @click="nextStep"
                >
                  {{ step === questions.length ? t.quizFinish : t.continueBtn }}
                </UButton>
              </div>
            </div>

            <!-- Results step -->
            <div v-else class="text-center space-y-5 animate-fade-up">
              <div v-if="submitting" class="py-8">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-focusflow-500 animate-spin mx-auto mb-3" />
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.analyzing }}</p>
              </div>

              <template v-else>
                <!-- Score circle -->
                <div class="relative w-32 h-32 mx-auto">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke-width="8" class="stroke-gray-100 dark:stroke-gray-800" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" stroke-width="8"
                      stroke-linecap="round"
                      :stroke="scoreColor"
                      :stroke-dasharray="`${(result.score / 100) * 314} 314`"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-3xl font-bold" :style="{ color: scoreColor }" style="font-family: 'Space Grotesk', sans-serif;">
                      {{ result.score }}
                    </span>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">/100</span>
                  </div>
                </div>

                <div class="px-2 py-2 rounded-xl text-xs font-bold uppercase tracking-wider inline-block"
                  :class="scoreBadgeClass">
                  {{ scoreLabel }}
                </div>

                <p v-if="result.analysis" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                  {{ result.analysis }}
                </p>

                <UButton color="primary" class="font-semibold" @click="close">
                  {{ t.quizGoToDashboard }}
                </UButton>
              </template>
            </div>

          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ workspaceId: string }>()
const emit = defineEmits<{ close: []; done: [score: number] }>()

const { labels: tRef } = useLanguage()
const t = tRef
const lang = useLanguage()

const visible = ref(true)
const step = ref(0)
const submitting = ref(false)
const result = reactive({ score: 0, analysis: '' })

const questions = computed(() => {
  const en = lang.language.value === 'en'
  return [
    {
      text: en ? 'How often do you postpone important tasks?' : '¿Con qué frecuencia pospones tareas importantes?',
      type: 'scale' as const,
      scaleType: 'frequency' as const,
    },
    {
      text: en ? 'When facing a difficult task, what do you do first?' : 'Cuando enfrentas una tarea difícil, ¿qué haces primero?',
      type: 'choice' as const,
      options: en
        ? ['Start right away', 'Plan it carefully', 'Check social media first', 'Wait until the last minute']
        : ['Empiezo de inmediato', 'La planifico cuidadosamente', 'Reviso redes sociales primero', 'Espero hasta el último momento'],
    },
    {
      text: en ? 'How easily do you get distracted by notifications?' : '¿Qué tan fácil te distraen las notificaciones?',
      type: 'scale' as const,
      scaleType: 'frequency' as const,
    },
    {
      text: en ? 'How often do you complete tasks before their deadline?' : '¿Con qué frecuencia completas tareas antes de su fecha límite?',
      type: 'scale' as const,
      scaleType: 'frequency_inverted' as const,
    },
    {
      text: en ? 'What best describes your work environment?' : '¿Qué describe mejor tu ambiente de trabajo?',
      type: 'choice' as const,
      options: en
        ? ['Organized and quiet', 'Somewhat organized', 'Often messy', 'Very chaotic']
        : ['Organizado y tranquilo', 'Algo organizado', 'A menudo desordenado', 'Muy caótico'],
    },
    {
      text: en ? 'How do you handle large projects?' : '¿Cómo manejas proyectos grandes?',
      type: 'choice' as const,
      options: en
        ? ['Break into small tasks', 'Create a schedule', 'Work in bursts', 'Feel overwhelmed and delay']
        : ['Los divido en tareas pequeñas', 'Creo un cronograma', 'Trabajo en ráfagas', 'Me siento abrumado y postergo'],
    },
    {
      text: en ? 'How often do you feel you wasted your day?' : '¿Con qué frecuencia sientes que desperdiciaste el día?',
      type: 'scale' as const,
      scaleType: 'frequency' as const,
    },
    {
      text: en ? 'How motivated do you feel about your current projects?' : '¿Qué tan motivado te sientes con tus proyectos actuales?',
      type: 'scale' as const,
      scaleType: 'motivation' as const,
    },
  ]
})

const frequencyScale = computed(() => {
  const en = lang.language.value === 'en'
  return [
    { value: 1, label: en ? 'Never / Not at all' : 'Nunca / Para nada' },
    { value: 2, label: en ? 'Rarely' : 'Rara vez' },
    { value: 3, label: en ? 'Sometimes' : 'A veces' },
    { value: 4, label: en ? 'Often' : 'Frecuentemente' },
    { value: 5, label: en ? 'Always / Completely' : 'Siempre / Totalmente' },
  ]
})

const motivationScale = computed(() => {
  const en = lang.language.value === 'en'
  return [
    { value: 1, label: en ? 'Not motivated at all' : 'Nada motivado' },
    { value: 2, label: en ? 'Slightly motivated' : 'Poco motivado' },
    { value: 3, label: en ? 'Somewhat motivated' : 'Algo motivado' },
    { value: 4, label: en ? 'Quite motivated' : 'Bastante motivado' },
    { value: 5, label: en ? 'Very motivated' : 'Muy motivado' },
  ]
})

const scaleOptionsForQuestion = computed(() => {
  const q = currentQuestion.value
  if (!q || q.type !== 'scale') return frequencyScale.value
  if (q.scaleType === 'motivation') return motivationScale.value
  return frequencyScale.value
})

const answers = reactive<Array<{ question: string; answer: string; value: number; riskValue: number } | undefined>>([])

const currentQuestion = computed(() => questions.value[step.value - 1]!)

const progress = computed(() => {
  if (step.value === 0) return 0
  if (step.value > questions.value.length) return 100
  return Math.round((step.value / (questions.value.length + 1)) * 100)
})

function selectAnswer(value: number, label: string) {
  const q = currentQuestion.value
  // For inverted scales (motivation, completing before deadline), flip the risk score:
  // high value (5 = very motivated) → low procrastination risk (1)
  const isInverted = q.type === 'scale' && (q.scaleType === 'motivation' || q.scaleType === 'frequency_inverted')
  answers[step.value - 1] = {
    question: q.text,
    answer: label,
    value,
    riskValue: isInverted ? (6 - value) : value,
  }
}

function nextStep() {
  if (step.value === questions.value.length) {
    submit()
  } else {
    step.value++
  }
}

async function submit() {
  step.value = questions.value.length + 1
  submitting.value = true
  try {
    const data = await $fetch<any>(`/api/workspaces/${props.workspaceId}/assessment`, {
      method: 'POST',
      body: { answers: answers.filter(Boolean) },
    })
    result.score = data.score
    result.analysis = data.ai_analysis || ''
    emit('done', data.score)
  } catch {
    // Fallback score — use riskValue (already inverted for positive questions)
    const vals = answers.filter(Boolean).map(a => a!.riskValue)
    result.score = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length / 5) * 100) : 50
    emit('done', result.score)
  } finally {
    submitting.value = false
  }
}

const scoreColor = computed(() => {
  if (result.score <= 30) return '#10b981'
  if (result.score <= 60) return '#f59e0b'
  return '#ef4444'
})

const scoreBadgeClass = computed(() => {
  if (result.score <= 30) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (result.score <= 60) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
})

const scoreLabel = computed(() => {
  const en = lang.language.value === 'en'
  if (result.score <= 30) return en ? 'Low Risk' : 'Riesgo Bajo'
  if (result.score <= 60) return en ? 'Moderate Risk' : 'Riesgo Moderado'
  return en ? 'High Risk' : 'Riesgo Alto'
})

function skip() {
  visible.value = false
  emit('close')
}

function close() {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.quiz-overlay-enter-active,
.quiz-overlay-leave-active {
  transition: all 0.3s ease;
}
.quiz-overlay-enter-from,
.quiz-overlay-leave-to {
  opacity: 0;
}
.quiz-overlay-enter-from > div,
.quiz-overlay-leave-to > div {
  transform: scale(0.95) translateY(10px);
}
</style>
