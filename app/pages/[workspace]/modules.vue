<template>
  <div class="animate-fade-up max-w-3xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-square-3-stack-3d" class="w-7 h-7 text-purple-600 dark:text-purple-400" />
        {{ lang.language.value === 'en' ? 'Modules' : 'Modulos' }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ lang.language.value === 'en' ? 'Enable or disable features for this workspace. Changes apply to all members.' : 'Activa o desactiva funcionalidades para este workspace. Los cambios aplican a todos los miembros.' }}
      </p>
    </div>

    <div class="space-y-2">
      <div
        v-for="mod in definitions"
        :key="mod.key"
        class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 px-5 py-4 flex items-center gap-4 transition-all"
        :class="isEnabled(mod.key) ? '' : 'opacity-60'"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          :class="isEnabled(mod.key)
            ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
            : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'"
        >
          <UIcon :name="mod.icon" class="w-5 h-5" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ lang.language.value === 'en' ? mod.labelEn : mod.labelEs }}
            </p>
            <span v-if="mod.core" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
              {{ lang.language.value === 'en' ? 'Core' : 'Base' }}
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ lang.language.value === 'en' ? mod.description_en : mod.description_es }}
          </p>
        </div>

        <button
          class="w-11 h-6 rounded-full transition-colors relative shrink-0"
          :class="[
            isEnabled(mod.key) ? 'bg-purple-500' : 'bg-gray-300 dark:bg-white/20',
            mod.core ? 'cursor-not-allowed' : 'cursor-pointer',
          ]"
          :disabled="mod.core || togglingKey === mod.key"
          @click="handleToggle(mod)"
        >
          <span
            class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            :class="isEnabled(mod.key) ? 'translate-x-[22px]' : 'translate-x-0.5'"
          />
        </button>
      </div>
    </div>

    <!-- Info -->
    <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div class="flex gap-2">
        <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-blue-800 dark:text-blue-300 font-medium">
            {{ lang.language.value === 'en' ? 'Disabled modules are hidden from the sidebar for all workspace members.' : 'Los modulos desactivados se ocultan del sidebar para todos los miembros del workspace.' }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {{ lang.language.value === 'en' ? 'Data is preserved — re-enabling a module restores everything.' : 'Los datos se conservan — reactivar un modulo restaura todo.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const lang = useLanguage()
const { isEnabled, toggleModule, definitions } = useModules()
const togglingKey = ref('')

async function handleToggle(mod: { key: string; core?: boolean }) {
  if (mod.core) return
  togglingKey.value = mod.key
  try {
    await toggleModule(mod.key, !isEnabled(mod.key))
  } catch (e: any) {
    console.error('[modules] Error toggling:', e)
  } finally {
    togglingKey.value = ''
  }
}
</script>
