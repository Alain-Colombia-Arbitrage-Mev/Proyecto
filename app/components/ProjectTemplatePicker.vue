<template>
  <div class="grid grid-cols-1 gap-2">
    <button
      v-for="tpl in templates"
      :key="tpl.value"
      type="button"
      class="group w-full text-left rounded-xl border p-3 transition-all cursor-pointer"
      :class="modelValue === tpl.value
        ? 'border-focusflow-400 bg-focusflow-50/60 dark:bg-focusflow-950/30 ring-1 ring-focusflow-400/40 shadow-sm'
        : 'border-gray-200/80 dark:border-white/10 hover:border-focusflow-300 dark:hover:border-focusflow-500/40 hover:bg-gray-50 dark:hover:bg-white/5'"
      @click="$emit('update:modelValue', tpl.value)"
    >
      <div class="flex items-start gap-3">
        <!-- Icon tile -->
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          :style="{ backgroundColor: tpl.accent + '1a' }"
        >
          <UIcon :name="tpl.icon" class="w-4.5 h-4.5" :style="{ color: tpl.accent }" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[13px] font-bold text-gray-900 dark:text-gray-100">{{ tpl.label }}</span>
            <UIcon
              v-if="modelValue === tpl.value"
              name="i-heroicons-check-circle-solid"
              class="w-4 h-4 text-focusflow-500 shrink-0"
            />
            <span v-else class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 shrink-0">
              {{ tpl.columns.length }} {{ lang.language.value === 'en' ? 'columns' : 'columnas' }}
            </span>
          </div>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{{ tpl.description }}</p>

          <!-- Column flow preview -->
          <div class="flex items-center gap-1 mt-2 flex-wrap">
            <template v-for="(col, i) in tpl.columns" :key="col.title">
              <span
                class="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                :style="{ backgroundColor: col.color + '14', color: col.color }"
              >
                <span class="w-1 h-1 rounded-full" :style="{ backgroundColor: col.color }" />
                {{ col.title }}
              </span>
              <UIcon
                v-if="i < tpl.columns.length - 1"
                name="i-heroicons-chevron-right-20-solid"
                class="w-2.5 h-2.5 text-gray-300 dark:text-gray-600 shrink-0"
              />
            </template>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()

const lang = useLanguage()

// Column previews must match server KANBAN_TEMPLATES
const templates = computed(() => {
  const en = lang.language.value === 'en'
  return [
    {
      value: 'deep_work',
      label: en ? 'Deep Work' : 'Enfoque Profundo',
      icon: 'i-heroicons-bolt',
      accent: '#F59E0B',
      description: en
        ? 'Anti-procrastination board: max 3 tasks today, only 1 in focus. Built for deep work sessions.'
        : 'Tablero anti-procrastinación: máx. 3 tareas hoy, solo 1 en foco. Diseñado para sesiones de deep work.',
      columns: [
        { title: 'Bandeja', color: '#6B7280' },
        { title: 'Hoy', color: '#3B82F6' },
        { title: 'Enfoque Ahora', color: '#F59E0B' },
        { title: 'Hecho', color: '#10B981' },
      ],
    },
    {
      value: 'kanban',
      label: 'Kanban',
      icon: 'i-heroicons-view-columns',
      accent: '#0ea5e9',
      description: en
        ? 'Continuous flow with WIP limits. For teams that pull work as capacity frees up.'
        : 'Flujo continuo con límites WIP. Para equipos que jalan trabajo según su capacidad.',
      columns: [
        { title: 'Backlog', color: '#6B7280' },
        { title: 'To Do', color: '#3B82F6' },
        { title: 'En Progreso', color: '#F59E0B' },
        { title: 'Revisión', color: '#8B5CF6' },
        { title: 'Hecho', color: '#10B981' },
      ],
    },
    {
      value: 'scrum',
      label: 'Scrum',
      icon: 'i-heroicons-arrow-path-rounded-square',
      accent: '#6366F1',
      description: en
        ? 'Sprint-based delivery with backlog grooming, review and QA.'
        : 'Entrega por sprints con backlog, review y QA.',
      columns: [
        { title: 'Product Backlog', color: '#6B7280' },
        { title: 'Sprint Backlog', color: '#6366F1' },
        { title: 'En Progreso', color: '#3B82F6' },
        { title: 'En Review', color: '#F59E0B' },
        { title: 'QA', color: '#8B5CF6' },
        { title: 'Done', color: '#10B981' },
      ],
    },
    {
      value: 'dev',
      label: en ? 'Development' : 'Desarrollo',
      icon: 'i-heroicons-code-bracket',
      accent: '#3B82F6',
      description: en
        ? 'Software pipeline: analysis, dev, code review, QA and production.'
        : 'Pipeline de software: análisis, dev, code review, QA y producción.',
      columns: [
        { title: 'Backlog', color: '#6B7280' },
        { title: 'Análisis', color: '#8B5CF6' },
        { title: 'Dev', color: '#3B82F6' },
        { title: 'Code Review', color: '#F59E0B' },
        { title: 'QA', color: '#F97316' },
        { title: 'Producción', color: '#10B981' },
      ],
    },
    {
      value: 'audio',
      label: 'Audio',
      icon: 'i-heroicons-musical-note',
      accent: '#EC4899',
      description: en
        ? 'Music & podcast production: from idea to published master.'
        : 'Producción musical y podcasts: de la idea al master publicado.',
      columns: [
        { title: 'Idea', color: '#EC4899' },
        { title: 'Grabación', color: '#8B5CF6' },
        { title: 'Edición', color: '#3B82F6' },
        { title: 'Mezcla', color: '#F59E0B' },
        { title: 'Master', color: '#F97316' },
        { title: 'Publicado', color: '#10B981' },
      ],
    },
    {
      value: 'creative',
      label: en ? 'Creative' : 'Creativo',
      icon: 'i-heroicons-paint-brush',
      accent: '#F59E0B',
      description: en
        ? 'Design & content workflow with brief, concept and client approval.'
        : 'Flujo de diseño y contenido con brief, concepto y aprobación del cliente.',
      columns: [
        { title: 'Brief', color: '#6B7280' },
        { title: 'Concepto', color: '#EC4899' },
        { title: 'Diseño', color: '#3B82F6' },
        { title: 'Revisión', color: '#F59E0B' },
        { title: 'Aprobado', color: '#8B5CF6' },
        { title: 'Entregado', color: '#10B981' },
      ],
    },
  ]
})
</script>
