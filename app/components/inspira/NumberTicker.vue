<template>
  <span
    ref="spanRef"
    :class="cn('inline-block tabular-nums tracking-wider', props.class)"
  >
    {{ formattedValue }}
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useTransition, TransitionPresets } from '@vueuse/core'
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{
  value: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  class?: string
  decimalPlaces?: number
}>(), {
  direction: 'up',
  delay: 0,
  duration: 1000,
  decimalPlaces: 0,
})

const spanRef = ref<HTMLSpanElement | null>(null)
const sourceValue = ref(props.direction === 'down' ? props.value : 0)

const outputValue = useTransition(sourceValue, {
  duration: props.duration,
  transition: TransitionPresets.easeOutExpo,
})

const formattedValue = computed(() => {
  return Number(outputValue.value).toFixed(props.decimalPlaces)
})

onMounted(() => {
  setTimeout(() => {
    sourceValue.value = props.direction === 'down' ? 0 : props.value
  }, props.delay)
})

watch(() => props.value, (newVal) => {
  sourceValue.value = newVal
})
</script>
