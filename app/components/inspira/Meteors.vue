<template>
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <span
      v-for="meteor in meteors"
      :key="meteor.id"
      :class="meteorClass"
      :style="{
        top: 0,
        left: meteor.left,
        animationDelay: meteor.animationDelay,
        animationDuration: meteor.animationDuration,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cn } from '~/utils/cn'

const props = withDefaults(defineProps<{
  number?: number
  class?: string
}>(), {
  number: 20,
})

interface Meteor {
  id: number
  left: string
  animationDelay: string
  animationDuration: string
}

const meteorClass = computed(() => cn(
  'animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]',
  "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
  props.class,
))

const meteors = ref<Meteor[]>([])

onMounted(() => {
  meteors.value = Array.from({ length: props.number }).map((_, i) => ({
    id: i,
    left: Math.floor(Math.random() * (400 - -400) + -400) + 'px',
    animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
    animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
  }))
})
</script>

<style>
@keyframes meteor {
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
}

.animate-meteor-effect {
  animation: meteor 5s linear infinite;
}
</style>
