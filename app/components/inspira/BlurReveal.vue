<template>
  <div
    ref="containerRef"
    :class="cn('relative', props.class)"
    :style="animStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{
  class?: string
  delay?: number
  duration?: number
  blur?: string
  yOffset?: number
}>(), {
  delay: 0,
  duration: 1000,
  blur: '10px',
  yOffset: 20,
})

const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true

  if (!containerRef.value) {
    isVisible.value = true
    return
  }

  if (!('IntersectionObserver' in window)) {
    isVisible.value = true
    return
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        isVisible.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.05 }
  )

  observer.observe(containerRef.value)
})

const animStyle = computed(() => {
  // During SSR or before mount, render fully visible (no flash)
  if (!isMounted.value) {
    return {}
  }

  if (!isVisible.value) {
    return {
      opacity: '0',
      filter: `blur(${props.blur})`,
      transform: `translateY(${props.yOffset}px)`,
    }
  }

  return {
    opacity: '1',
    filter: 'blur(0px)',
    transform: 'translateY(0px)',
    transition: `all ${props.duration}ms cubic-bezier(0.25, 1, 0.5, 1) ${props.delay}ms`,
  }
})
</script>
