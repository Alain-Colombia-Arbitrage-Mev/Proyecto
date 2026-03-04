<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-[var(--ui-text-muted)]">Autenticando...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

onMounted(() => {
  sessionStorage.setItem('focusflow_just_logged_in', '1')
})
</script>
