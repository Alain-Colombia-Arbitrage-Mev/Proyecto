<template>
  <div
    :class="cn(
      'group relative flex flex-col justify-between overflow-hidden rounded-xl',
      'bg-white dark:bg-[#1b1b1b] [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
      'dark:[box-shadow:0_-1px_0_rgba(255,255,255,.1)_inset,0_1px_0_rgba(255,255,255,.1)_inset,0_0_0_1px_rgba(255,255,255,.1)]',
      props.class,
    )"
  >
    <div class="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
      <div v-if="icon" class="mb-2 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75 dark:text-neutral-300">
        <UIcon :name="icon" class="w-8 h-8" />
      </div>
      <h3 v-if="name" class="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
        {{ name }}
      </h3>
      <p v-if="description" class="max-w-lg text-neutral-400">
        {{ description }}
      </p>
      <slot name="content" />
    </div>

    <div
      v-if="href || $slots.cta"
      class="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
    >
      <slot name="cta">
        <NuxtLink v-if="href" :to="href" class="pointer-events-auto flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100">
          {{ cta || 'Ver más' }}
          <UIcon name="i-heroicons-arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </slot>
    </div>
    <div class="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
    
    <!-- Custom background slot -->
    <div class="absolute inset-0 -z-10">
      <slot name="background" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '~/utils/cn'

const props = defineProps<{
  name?: string
  class?: string
  icon?: string
  description?: string
  href?: string
  cta?: string
}>()
</script>
