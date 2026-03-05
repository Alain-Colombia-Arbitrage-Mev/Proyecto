<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 animate-fade-up">{{ en ? 'Plans & Billing' : 'Planes y Facturacion' }}</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8 animate-fade-up">{{ en ? 'Manage your workspace subscription' : 'Gestiona la suscripcion de tu workspace' }}</p>

    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>

    <div v-else class="space-y-8 animate-fade-up delay-100">

      <!-- Current Plan Banner -->
      <div v-if="currentSub" class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-100 dark:border-white/10 p-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{ currentSub.planName }}</span>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                :class="currentSub.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'">
                {{ currentSub.status }}
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ${{ currentSub.amount }} USD / {{ currentSub.billingCycle === 'yearly' ? (en ? 'year' : 'anual') : (en ? 'month' : 'mes') }}
              <span class="text-gray-400 dark:text-gray-500"> &middot; {{ currentSub.memberCount }} {{ en ? 'members' : 'miembros' }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ en ? 'Renews' : 'Renueva' }}</p>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ formatDate(currentSub.currentPeriodEnd) }}</p>
          </div>
        </div>

        <!-- Usage bars -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-white/10">
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-gray-500 dark:text-gray-400">{{ en ? 'Projects' : 'Proyectos' }}</span>
              <span class="font-semibold text-gray-700 dark:text-gray-300">{{ usage.projects }}/{{ currentSub.limits.maxProjects }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full transition-all" :style="{ width: `${Math.min(100, (usage.projects / currentSub.limits.maxProjects) * 100)}%` }" />
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-gray-500 dark:text-gray-400">{{ en ? 'Members' : 'Miembros' }}</span>
              <span class="font-semibold text-gray-700 dark:text-gray-300">{{ usage.members }}/{{ currentSub.limits.maxMembers }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full transition-all" :style="{ width: `${Math.min(100, (usage.members / currentSub.limits.maxMembers) * 100)}%` }" />
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[11px] mb-1">
              <span class="text-gray-500 dark:text-gray-400">{{ en ? 'AI Tokens' : 'Tokens AI' }}</span>
              <span class="font-semibold text-gray-700 dark:text-gray-300">{{ formatTokens(currentSub.limits.tokenLimit) }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-violet-500 rounded-full transition-all" style="width: 0%" />
            </div>
          </div>
        </div>
      </div>

      <!-- No Plan -->
      <div v-else class="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-[#1b1b1b] rounded-2xl border border-violet-200/50 dark:border-violet-500/15 p-6 text-center">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-violet-500/20">
          <UIcon name="i-heroicons-rocket-launch" class="w-6 h-6 text-white" />
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ en ? 'No active plan' : 'Sin plan activo' }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ en ? 'Choose a plan to unlock all features' : 'Elige un plan para desbloquear todas las funciones' }}</p>
      </div>

      <!-- Billing Cycle Toggle -->
      <div class="flex justify-center">
        <div class="flex items-center gap-3 bg-gray-100 dark:bg-white/10 rounded-full p-1">
          <button class="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
            :class="billingCycle === 'monthly' ? 'bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'"
            @click="billingCycle = 'monthly'">
            {{ en ? 'Monthly' : 'Mensual' }}
          </button>
          <button class="px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer relative"
            :class="billingCycle === 'yearly' ? 'bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'"
            @click="billingCycle = 'yearly'">
            {{ en ? 'Yearly' : 'Anual' }}
            <span class="absolute -top-2 -right-2 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </div>

      <!-- Plan Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div v-for="plan in plans" :key="plan.id"
          class="relative bg-white dark:bg-[#1b1b1b] rounded-2xl border overflow-hidden transition-all hover:shadow-lg"
          :class="plan.id === 'pro' ? 'border-emerald-300 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'border-gray-200 dark:border-white/10'">

          <!-- Popular badge -->
          <div v-if="plan.id === 'pro'" class="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
            {{ en ? 'POPULAR' : 'POPULAR' }}
          </div>

          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
            <div class="flex items-baseline gap-1 mt-2">
              <span class="text-4xl font-black text-gray-900 dark:text-white" style="font-family: 'Space Grotesk'; letter-spacing: -2px;">
                ${{ billingCycle === 'yearly' ? (plan.price_per_member * 10 / 12).toFixed(2) : plan.price_per_member }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">/ {{ en ? 'member/mo' : 'miembro/mes' }}</span>
            </div>
            <p v-if="billingCycle === 'yearly'" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              ${{ (plan.price_per_member * 10).toFixed(0) }} USD / {{ en ? 'member/year' : 'miembro/anual' }}
            </p>

            <!-- Limits -->
            <div class="mt-5 space-y-2.5">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500 shrink-0" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ plan.max_workspaces }} workspace{{ plan.max_workspaces > 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500 shrink-0" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ plan.max_projects }} {{ en ? 'projects' : 'proyectos' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500 shrink-0" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ en ? 'Up to' : 'Hasta' }} {{ plan.max_members }} {{ en ? 'members' : 'miembros' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500 shrink-0" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ formatTokens(plan.token_limit) }} {{ en ? 'AI tokens/mo' : 'tokens AI/mes' }}</span>
              </div>

              <!-- Feature list -->
              <div v-for="(enabled, feat) in planFeaturesList(plan)" :key="String(feat)" class="flex items-center gap-2">
                <UIcon :name="enabled ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  class="w-4 h-4 shrink-0" :class="enabled ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'" />
                <span class="text-sm" :class="enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'">
                  {{ featureLabel(String(feat)) }}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <UButton
              block size="lg" class="mt-6 font-semibold"
              :color="plan.id === 'pro' ? 'primary' : 'neutral'"
              :variant="currentSub?.planId === plan.id ? 'outline' : 'solid'"
              :loading="subscribing === plan.id"
              :disabled="currentSub?.planId === plan.id"
              @click="subscribe(plan.id)">
              {{ currentSub?.planId === plan.id ? (en ? 'Current Plan' : 'Plan Actual') : (en ? 'Subscribe' : 'Suscribirse') }}
            </UButton>
          </div>
        </div>
      </div>

      <p v-if="errorMsg" class="text-sm text-red-600 dark:text-red-400 text-center">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400 text-center">{{ successMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const lang = useLanguage()
const en = computed(() => lang.language.value === 'en')

const loading = ref(true)
const plans = ref<any[]>([])
const currentSub = ref<any>(null)
const usage = ref({ projects: 0, members: 0 })
const billingCycle = ref<'monthly' | 'yearly'>('monthly')
const subscribing = ref('')
const errorMsg = ref('')
const successMsg = ref('')

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString(en.value ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' })
}

function planFeaturesList(plan: any): Record<string, boolean> {
  const f = plan.features || {}
  return {
    ai_basic: !!f.ai_basic,
    ai_doc_agents: !!f.ai_doc_agents,
    goals: !!f.goals,
    roadmap: !!f.roadmap,
    custom_domain: !!f.custom_domain,
  }
}

function featureLabel(feat: string): string {
  const labels: Record<string, { en: string; es: string }> = {
    ai_basic: { en: 'AI Assistant', es: 'Asistente AI' },
    ai_doc_agents: { en: 'AI Doc Agents', es: 'Agentes AI Docs' },
    goals: { en: 'Goals & OKRs', es: 'Objetivos y OKRs' },
    roadmap: { en: 'Roadmap', es: 'Roadmap' },
    custom_domain: { en: 'Custom Domain', es: 'Dominio Personalizado' },
  }
  const l = labels[feat]
  return l ? (en.value ? l.en : l.es) : feat
}

async function loadData() {
  loading.value = true
  try {
    const [plansData, subData] = await Promise.all([
      $fetch<any[]>('/api/plans'),
      store.workspace?.id ? $fetch<any>(`/api/workspaces/${store.workspace.id}/subscription`) : null,
    ])
    plans.value = plansData || []
    if (subData) {
      currentSub.value = subData.subscription
      usage.value = subData.usage
    }
  } catch (e: any) {
    console.error('[billing] load error:', e)
  } finally {
    loading.value = false
  }
}

async function subscribe(planId: string) {
  subscribing.value = planId
  errorMsg.value = ''
  successMsg.value = ''
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/subscription`, {
      method: 'POST',
      body: { planId, billingCycle: billingCycle.value },
    })
    successMsg.value = en.value ? 'Plan activated successfully!' : 'Plan activado correctamente!'
    setTimeout(() => { successMsg.value = '' }, 4000)
    await loadData()
  } catch (e: any) {
    errorMsg.value = e.message || 'Error subscribing'
  } finally {
    subscribing.value = ''
  }
}

onMounted(loadData)
</script>
