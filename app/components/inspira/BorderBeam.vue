<template>
  <div
    :class="cn(
      'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',
      '![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]',
      'after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]',
      props.class,
    )"
    :style="{
      '--size': size,
      '--duration': duration,
      '--anchor': anchor,
      '--border-width': borderWidth,
      '--color-from': colorFrom,
      '--color-to': colorTo,
      '--delay': `-${delay}s`,
    } as any"
  />
</template>

<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{
  class?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}>(), {
  size: 200,
  duration: 15,
  anchor: 90,
  borderWidth: 1.5,
  colorFrom: '#ffaa40',
  colorTo: '#9c40ff',
  delay: 0,
})
</script>

<style>
@keyframes border-beam {
  100% {
    offset-distance: 100%;
  }
}
.animate-border-beam {
  animation: border-beam calc(var(--duration) * 1s) infinite linear;
}
</style>
