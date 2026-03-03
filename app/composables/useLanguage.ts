export type AppLanguage = 'es' | 'en'

/** Persisted language preference — shared across all components via module-level ref */
const currentLanguage = ref<AppLanguage>(
  (typeof localStorage !== 'undefined' ? localStorage.getItem('focusflow_lang') as AppLanguage : null) || 'es'
)

export function useLanguage() {
  function setLanguage(lang: AppLanguage) {
    currentLanguage.value = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('focusflow_lang', lang)
    }
  }

  function toggleLanguage() {
    setLanguage(currentLanguage.value === 'es' ? 'en' : 'es')
  }

  /** Get the localized title for a task based on current language */
  function localizedTitle(task: { title: string; title_en?: string }): string {
    if (currentLanguage.value === 'en' && task.title_en) return task.title_en
    return task.title
  }

  /** Get the localized description for a task based on current language */
  function localizedDescription(task: { description?: string; description_en?: string }): string {
    if (currentLanguage.value === 'en' && task.description_en) return task.description_en
    return task.description || ''
  }

  /** UI labels for common elements */
  const labels = computed(() => {
    if (currentLanguage.value === 'en') {
      return {
        newTask: 'New task',
        description: 'Description',
        priority: 'Priority',
        dueDate: 'Due date',
        column: 'Column',
        estimation: 'Estimation (hours)',
        assigned: 'Assigned',
        tags: 'Tags',
        save: 'Save',
        close: 'Close',
        cancel: 'Cancel',
        create: 'Create task',
        delete: 'Delete',
        deleteConfirm: 'Delete this task?',
        addDescription: 'Add a detailed description...',
        priorityLow: 'Low',
        priorityMedium: 'Medium',
        priorityHigh: 'High',
        priorityCritical: 'Critical',
        import: 'Import',
        noTranslation: '(No translation available)',
      }
    }
    return {
      newTask: 'Nueva tarea',
      description: 'Descripción',
      priority: 'Prioridad',
      dueDate: 'Fecha límite',
      column: 'Columna',
      estimation: 'Estimación (horas)',
      assigned: 'Asignados',
      tags: 'Etiquetas',
      save: 'Guardar',
      close: 'Cerrar',
      cancel: 'Cancelar',
      create: 'Crear tarea',
      delete: 'Eliminar',
      deleteConfirm: '¿Eliminar esta tarea?',
      addDescription: 'Agrega una descripción detallada...',
      priorityLow: 'Baja',
      priorityMedium: 'Media',
      priorityHigh: 'Alta',
      priorityCritical: 'Crítica',
      import: 'Importar',
      noTranslation: '(Sin traducción disponible)',
    }
  })

  return {
    language: currentLanguage,
    setLanguage,
    toggleLanguage,
    localizedTitle,
    localizedDescription,
    labels,
  }
}
