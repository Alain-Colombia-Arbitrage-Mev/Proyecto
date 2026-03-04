<template>
  <div class="flex items-center bg-gray-200/80 dark:bg-white/10 rounded-lg p-0.5 shrink-0">
    <button
      class="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
      :class="lang.language.value === 'es' ? 'bg-white dark:bg-white/20 text-[#0D0D0D] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      @click="lang.setLanguage('es')"
    >
      <!-- Spain flag SVG -->
      <svg class="w-4 h-3 rounded-[2px] shrink-0" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="480" fill="#c60b1e"/>
        <rect width="640" height="240" y="120" fill="#ffc400"/>
      </svg>
      <span>ES</span>
    </button>
    <button
      class="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all cursor-pointer"
      :class="lang.language.value === 'en' ? 'bg-white dark:bg-white/20 text-[#0D0D0D] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      @click="lang.setLanguage('en')"
    >
      <!-- US flag SVG -->
      <svg class="w-4 h-3 rounded-[2px] shrink-0" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
        <rect width="640" height="480" fill="#fff"/>
        <g fill="#b22234">
          <rect width="640" height="37"/>
          <rect width="640" height="37" y="74"/>
          <rect width="640" height="37" y="148"/>
          <rect width="640" height="37" y="222"/>
          <rect width="640" height="37" y="296"/>
          <rect width="640" height="37" y="370"/>
          <rect width="640" height="37" y="444"/>
        </g>
        <rect width="256" height="259" fill="#3c3b6e"/>
      </svg>
      <span>EN</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const lang = useLanguage()
</script>
