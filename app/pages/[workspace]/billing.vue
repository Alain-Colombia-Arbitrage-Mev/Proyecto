<template>
  <div>
    <!-- Header -->
    <div class="mb-8 animate-fade-up">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1px;">
        {{ en ? 'Plans & Billing' : 'Planes y Facturacion' }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ en ? 'Choose the right plan for your team' : 'Elige el plan ideal para tu equipo' }}</p>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-emerald-500" />
        </div>
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ en ? 'Loading plans...' : 'Cargando planes...' }}</span>
      </div>
    </div>

    <div v-else class="space-y-6 animate-fade-up delay-100">

      <!-- ══════ Current Plan Bento Banner ══════ -->
      <div v-if="currentSub" class="relative rounded-2xl overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#1a1a2e] to-[#16213e]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(117,252,150,0.08),transparent_60%)]" />
        <div class="relative z-10 p-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-[#75fc96]/15 flex items-center justify-center">
                <UIcon name="i-heroicons-bolt" class="w-6 h-6 text-[#75fc96]" />
              </div>
              <div>
                <div class="flex items-center gap-2.5">
                  <span class="text-lg font-bold text-white" style="font-family: 'Space Grotesk'; letter-spacing: -0.5px;">{{ currentSub.planName }}</span>
                  <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#75fc96]/15 text-[#75fc96]">
                    {{ currentSub.status === 'active' ? (en ? 'ACTIVE' : 'ACTIVO') : currentSub.status }}
                  </span>
                </div>
                <p class="text-sm text-white/50 mt-0.5">
                  <span class="text-white/80 font-semibold">${{ currentSub.amount }}</span> USD / {{ currentSub.billingCycle === 'yearly' ? (en ? 'year' : 'anual') : (en ? 'month' : 'mes') }}
                  <span class="text-white/30 mx-1">&bull;</span>
                  {{ currentSub.memberCount }} {{ en ? 'members' : 'miembros' }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-white/30 uppercase tracking-widest">{{ en ? 'Renews' : 'Renueva' }}</p>
              <p class="text-sm font-semibold text-white/70 mt-0.5">{{ formatDate(currentSub.currentPeriodEnd) }}</p>
            </div>
          </div>

          <!-- Usage meters -->
          <div class="grid grid-cols-3 gap-4 mt-6">
            <div v-for="meter in usageMeters" :key="meter.label" class="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
              <div class="flex items-center justify-between mb-2.5">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-md flex items-center justify-center" :style="{ backgroundColor: meter.color + '18' }">
                    <UIcon :name="meter.icon" class="w-3.5 h-3.5" :style="{ color: meter.color }" />
                  </div>
                  <span class="text-[11px] text-white/50 font-medium">{{ meter.label }}</span>
                </div>
                <span class="text-[11px] font-bold text-white/80 tabular-nums">{{ meter.current }}/{{ meter.max }}</span>
              </div>
              <div class="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700" :style="{ width: `${meter.percent}%`, backgroundColor: meter.color }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════ No Plan State ══════ -->
      <div v-else class="relative rounded-2xl overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#1a1a2e] to-[#16213e]" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(168,85,247,0.12),transparent_60%)]" />
        <div class="relative z-10 p-8 text-center">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/25">
            <UIcon name="i-heroicons-rocket-launch" class="w-7 h-7 text-white" />
          </div>
          <h3 class="text-xl font-bold text-white" style="font-family: 'Space Grotesk'; letter-spacing: -0.5px;">
            {{ en ? 'Unlock your team\'s potential' : 'Desbloquea el potencial de tu equipo' }}
          </h3>
          <p class="text-sm text-white/40 mt-2 max-w-md mx-auto">
            {{ en ? 'Choose a plan below to access AI tools, advanced analytics, and unlimited collaboration.' : 'Elige un plan para acceder a herramientas AI, analytics avanzados y colaboracion ilimitada.' }}
          </p>
        </div>
      </div>

      <!-- ══════ Billing Cycle Toggle ══════ -->
      <div class="flex justify-center">
        <div class="inline-flex items-center bg-gray-100 dark:bg-white/[0.06] rounded-xl p-1 gap-1">
          <button class="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
            :class="billingCycle === 'monthly'
              ? 'bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="billingCycle = 'monthly'">
            {{ en ? 'Monthly' : 'Mensual' }}
          </button>
          <button class="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer relative"
            :class="billingCycle === 'yearly'
              ? 'bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="billingCycle = 'yearly'">
            {{ en ? 'Yearly' : 'Anual' }}
            <span class="absolute -top-2.5 -right-3 text-[9px] font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-emerald-500/20">
              -17%
            </span>
          </button>
        </div>
      </div>

      <!-- ══════ Plan Cards — Bento Grid ══════ -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">

        <!-- ── STARTER ── -->
        <div class="group relative bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-white/15 hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-black/20">
          <div class="p-7">
            <!-- Plan icon + name -->
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-50 dark:from-sky-500/15 dark:to-blue-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-cube" class="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Starter</h3>
                <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ en ? 'For small teams' : 'Para equipos pequenos' }}</p>
              </div>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <div class="flex items-baseline gap-1">
                <span class="text-[42px] font-black text-gray-900 dark:text-white leading-none" style="font-family: 'Space Grotesk'; letter-spacing: -3px;">
                  ${{ billingCycle === 'yearly' ? '1.67' : '2' }}
                </span>
                <div class="flex flex-col ml-1">
                  <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">USD</span>
                  <span class="text-[11px] text-gray-400 dark:text-gray-500">/ {{ en ? 'member/mo' : 'miembro/mes' }}</span>
                </div>
              </div>
              <p v-if="billingCycle === 'yearly'" class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                <UIcon name="i-heroicons-tag" class="w-3 h-3" />
                $20 USD / {{ en ? 'member/year' : 'miembro/anual' }}
              </p>
            </div>

            <!-- Limits bento -->
            <div class="grid grid-cols-2 gap-2 mb-5">
              <div class="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl p-3 text-center">
                <p class="text-lg font-black text-gray-900 dark:text-white" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">1</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Workspace</p>
              </div>
              <div class="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl p-3 text-center">
                <p class="text-lg font-black text-gray-900 dark:text-white" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">5</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{{ en ? 'Projects' : 'Proyectos' }}</p>
              </div>
              <div class="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl p-3 text-center">
                <p class="text-lg font-black text-gray-900 dark:text-white" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">10</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{{ en ? 'Members' : 'Miembros' }}</p>
              </div>
              <div class="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl p-3 text-center">
                <p class="text-lg font-black text-gray-900 dark:text-white" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">5M</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{{ en ? 'AI Tokens' : 'Tokens AI' }}</p>
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-2 mb-6">
              <div v-for="feat in starterFeatures" :key="feat.key" class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  :class="feat.enabled ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-gray-50 dark:bg-white/[0.03]'">
                  <UIcon :name="feat.enabled ? 'i-heroicons-check' : 'i-heroicons-minus'" class="w-3 h-3"
                    :class="feat.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'" />
                </div>
                <span class="text-[13px]" :class="feat.enabled ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'">
                  {{ feat.label }}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <button
              class="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
              :class="currentSub?.planId === 'starter'
                ? 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 cursor-default'
                : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 hover:shadow-lg active:scale-[0.98]'"
              :disabled="currentSub?.planId === 'starter' || subscribing === 'starter'"
              @click="subscribe('starter')">
              <span v-if="subscribing === 'starter'" class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </span>
              <span v-else>{{ currentSub?.planId === 'starter' ? (en ? 'Current Plan' : 'Plan Actual') : (en ? 'Get Started' : 'Comenzar') }}</span>
            </button>
          </div>
        </div>

        <!-- ── PRO ── -->
        <div class="group relative bg-white dark:bg-[#1b1b1b] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
          <!-- Gradient border effect -->
          <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1.5px]">
            <div class="w-full h-full rounded-[14px] bg-white dark:bg-[#1b1b1b]" />
          </div>

          <!-- Popular ribbon -->
          <div class="absolute top-4 right-4 z-10">
            <div class="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-emerald-500/25">
              <UIcon name="i-heroicons-star-solid" class="w-3 h-3" />
              {{ en ? 'POPULAR' : 'POPULAR' }}
            </div>
          </div>

          <div class="relative z-10 p-7">
            <!-- Plan icon + name -->
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UIcon name="i-heroicons-bolt" class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900 dark:text-white">Pro</h3>
                <p class="text-[11px] text-gray-400 dark:text-gray-500">{{ en ? 'For growing teams' : 'Para equipos en crecimiento' }}</p>
              </div>
            </div>

            <!-- Price -->
            <div class="mb-6">
              <div class="flex items-baseline gap-1">
                <span class="text-[42px] font-black text-gray-900 dark:text-white leading-none" style="font-family: 'Space Grotesk'; letter-spacing: -3px;">
                  ${{ billingCycle === 'yearly' ? '6.67' : '8' }}
                </span>
                <div class="flex flex-col ml-1">
                  <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">USD</span>
                  <span class="text-[11px] text-gray-400 dark:text-gray-500">/ {{ en ? 'member/mo' : 'miembro/mes' }}</span>
                </div>
              </div>
              <p v-if="billingCycle === 'yearly'" class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                <UIcon name="i-heroicons-tag" class="w-3 h-3" />
                $80 USD / {{ en ? 'member/year' : 'miembro/anual' }}
              </p>
            </div>

            <!-- Limits bento -->
            <div class="grid grid-cols-2 gap-2 mb-5">
              <div class="bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 text-center">
                <p class="text-lg font-black text-emerald-700 dark:text-emerald-400" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">5</p>
                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-medium">Workspaces</p>
              </div>
              <div class="bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 text-center">
                <p class="text-lg font-black text-emerald-700 dark:text-emerald-400" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">50</p>
                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-medium">{{ en ? 'Projects' : 'Proyectos' }}</p>
              </div>
              <div class="bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 text-center">
                <p class="text-lg font-black text-emerald-700 dark:text-emerald-400" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">100</p>
                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-medium">{{ en ? 'Members' : 'Miembros' }}</p>
              </div>
              <div class="bg-emerald-50/50 dark:bg-emerald-500/[0.06] border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-3 text-center">
                <p class="text-lg font-black text-emerald-700 dark:text-emerald-400" style="font-family: 'Space Grotesk'; letter-spacing: -1px;">50M</p>
                <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 font-medium">{{ en ? 'AI Tokens' : 'Tokens AI' }}</p>
              </div>
            </div>

            <!-- Features -->
            <div class="space-y-2 mb-6">
              <div v-for="feat in proFeatures" :key="feat.key" class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-check" class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span class="text-[13px] text-gray-700 dark:text-gray-300">{{ feat.label }}</span>
              </div>
            </div>

            <!-- CTA -->
            <button
              class="w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
              :class="currentSub?.planId === 'pro'
                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-400 cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:shadow-xl active:scale-[0.98]'"
              :disabled="currentSub?.planId === 'pro' || subscribing === 'pro'"
              @click="subscribe('pro')">
              <span v-if="subscribing === 'pro'" class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </span>
              <span v-else>{{ currentSub?.planId === 'pro' ? (en ? 'Current Plan' : 'Plan Actual') : (en ? 'Upgrade to Pro' : 'Actualizar a Pro') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ══════ Feature Comparison Bento ══════ -->
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-100 dark:border-white/[0.08] overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ en ? 'Compare Features' : 'Comparar Funciones' }}</h3>
          </div>
          <div class="divide-y divide-gray-50 dark:divide-white/[0.04]">
            <div v-for="row in comparisonRows" :key="row.key" class="grid grid-cols-[1fr_100px_100px] items-center px-6 py-3">
              <div class="flex items-center gap-2.5">
                <UIcon :name="row.icon" class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
                <span class="text-[13px] text-gray-700 dark:text-gray-300">{{ row.label }}</span>
              </div>
              <div class="text-center">
                <UIcon v-if="row.starter === true" name="i-heroicons-check-circle-solid" class="w-5 h-5 text-emerald-500 mx-auto" />
                <UIcon v-else-if="row.starter === false" name="i-heroicons-minus-circle" class="w-5 h-5 text-gray-200 dark:text-gray-700 mx-auto" />
                <span v-else class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ row.starter }}</span>
              </div>
              <div class="text-center">
                <UIcon v-if="row.pro === true" name="i-heroicons-check-circle-solid" class="w-5 h-5 text-emerald-500 mx-auto" />
                <span v-else class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ row.pro }}</span>
              </div>
            </div>
          </div>
          <!-- Column headers (sticky visual) -->
          <div class="grid grid-cols-[1fr_100px_100px] px-6 py-2.5 bg-gray-50/80 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/[0.06]">
            <span />
            <span class="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Starter</span>
            <span class="text-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pro</span>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <p v-if="errorMsg" class="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl px-4 py-3 text-center max-w-md mx-auto">{{ errorMsg }}</p>
      <p v-if="successMsg" class="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-center max-w-md mx-auto flex items-center justify-center gap-2">
        <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
        {{ successMsg }}
      </p>
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

// Usage meters for current plan banner
const usageMeters = computed(() => {
  if (!currentSub.value) return []
  const s = currentSub.value
  return [
    {
      label: en.value ? 'Projects' : 'Proyectos',
      icon: 'i-heroicons-folder',
      color: '#10b981',
      current: usage.value.projects,
      max: s.limits.maxProjects,
      percent: Math.min(100, (usage.value.projects / s.limits.maxProjects) * 100),
    },
    {
      label: en.value ? 'Members' : 'Miembros',
      icon: 'i-heroicons-user-group',
      color: '#3b82f6',
      current: usage.value.members,
      max: s.limits.maxMembers,
      percent: Math.min(100, (usage.value.members / s.limits.maxMembers) * 100),
    },
    {
      label: en.value ? 'AI Tokens' : 'Tokens AI',
      icon: 'i-heroicons-cpu-chip',
      color: '#8b5cf6',
      current: '—',
      max: formatTokens(s.limits.tokenLimit),
      percent: 0,
    },
  ]
})

// Feature lists
const starterFeatures = computed(() => {
  const e = en.value
  return [
    { key: 'ai', enabled: true, label: e ? 'AI Assistant (basic)' : 'Asistente AI (basico)' },
    { key: 'meetings', enabled: true, label: e ? 'Meetings & Google Meet' : 'Reuniones y Google Meet' },
    { key: 'timesheet', enabled: true, label: e ? 'Time tracking' : 'Control de tiempo' },
    { key: 'kanban', enabled: true, label: 'Kanban boards' },
    { key: 'docs', enabled: false, label: e ? 'AI Doc Agents' : 'Agentes AI Docs' },
    { key: 'goals', enabled: false, label: e ? 'Goals & OKRs' : 'Objetivos y OKRs' },
    { key: 'roadmap', enabled: false, label: 'Roadmap' },
    { key: 'domain', enabled: false, label: e ? 'Custom domain' : 'Dominio personalizado' },
  ]
})

const proFeatures = computed(() => {
  const e = en.value
  return [
    { key: 'ai', label: e ? 'AI Assistant (advanced)' : 'Asistente AI (avanzado)' },
    { key: 'docs', label: e ? 'AI Doc Agents' : 'Agentes AI Docs' },
    { key: 'meetings', label: e ? 'Meetings & Google Meet' : 'Reuniones y Google Meet' },
    { key: 'timesheet', label: e ? 'Time tracking' : 'Control de tiempo' },
    { key: 'kanban', label: 'Kanban boards' },
    { key: 'goals', label: e ? 'Goals & OKRs' : 'Objetivos y OKRs' },
    { key: 'roadmap', label: 'Roadmap' },
    { key: 'domain', label: e ? 'Custom domain' : 'Dominio personalizado' },
  ]
})

// Comparison table
const comparisonRows = computed(() => {
  const e = en.value
  return [
    { key: 'ws', icon: 'i-heroicons-building-office-2', label: 'Workspaces', starter: '1', pro: '5' },
    { key: 'proj', icon: 'i-heroicons-folder', label: e ? 'Projects' : 'Proyectos', starter: '5', pro: '50' },
    { key: 'mem', icon: 'i-heroicons-user-group', label: e ? 'Team members' : 'Miembros', starter: '10', pro: '100' },
    { key: 'tok', icon: 'i-heroicons-cpu-chip', label: e ? 'AI tokens / month' : 'Tokens AI / mes', starter: '5M', pro: '50M' },
    { key: 'ai', icon: 'i-heroicons-sparkles', label: e ? 'AI Assistant' : 'Asistente AI', starter: true, pro: true },
    { key: 'docs', icon: 'i-heroicons-document-text', label: e ? 'AI Doc Agents' : 'Agentes AI Docs', starter: false, pro: true },
    { key: 'meet', icon: 'i-heroicons-video-camera', label: 'Google Meet', starter: true, pro: true },
    { key: 'time', icon: 'i-heroicons-clock', label: e ? 'Time tracking' : 'Control de tiempo', starter: true, pro: true },
    { key: 'goals', icon: 'i-heroicons-flag', label: e ? 'Goals & OKRs' : 'Objetivos y OKRs', starter: false, pro: true },
    { key: 'road', icon: 'i-heroicons-map', label: 'Roadmap', starter: false, pro: true },
    { key: 'storage', icon: 'i-heroicons-cloud-arrow-up', label: e ? 'File storage' : 'Almacenamiento', starter: '500 MB', pro: '10 GB' },
    { key: 'domain', icon: 'i-heroicons-globe-alt', label: e ? 'Custom domain' : 'Dominio personalizado', starter: false, pro: true },
  ]
})

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
