<template>
  <div class="flex items-center bg-gray-200/60 rounded-lg p-0.5 shrink-0">
    <button
      class="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
      :class="lang.language.value === 'es' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
      @click="lang.setLanguage('es')"
    >
      <span class="text-sm leading-none">🇪🇸</span>
      <span>ES</span>
    </button>
    <button
      class="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
      :class="lang.language.value === 'en' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
      @click="lang.setLanguage('en')"
    >
      <span class="text-sm leading-none">🇺🇸</span>
      <span>EN</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const lang = useLanguage()
</script>
