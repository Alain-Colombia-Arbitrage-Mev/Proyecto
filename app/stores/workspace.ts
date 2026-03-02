import { defineStore } from 'pinia'
import type { Workspace, Project } from '~/types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspace = ref<Workspace | null>(null)
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)
  const loading = ref(false)
  const projectsLoaded = ref(false)

  const currentProject = computed(() =>
    projects.value.find(p => p.id === currentProjectId.value) || null,
  )

  const slug = computed(() => workspace.value?.slug || '')

  async function loadWorkspace(workspaceSlug: string) {
    if (workspace.value?.slug === workspaceSlug) return workspace.value
    loading.value = true
    try {
      const ws = await $fetch<Workspace>(`/api/workspaces/by-slug/${workspaceSlug}`)
      workspace.value = ws
      await loadProjects()
      return ws
    } catch {
      workspace.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function loadProjects() {
    if (!workspace.value) return
    try {
      const data = await $fetch<Project[]>(`/api/workspaces/${workspace.value.id}/projects`)
      projects.value = data || []
      projectsLoaded.value = true
    } catch {
      projects.value = []
    }
  }

  async function createProject(payload: {
    name: string
    description?: string
    priority?: string
    kanban_template?: string
  }) {
    if (!workspace.value) throw new Error('No workspace loaded')
    const result = await $fetch(`/api/workspaces/${workspace.value.id}/projects`, {
      method: 'POST',
      body: payload,
    })
    await loadProjects()
    return result
  }

  function setCurrentProject(projectId: string | null) {
    currentProjectId.value = projectId
  }

  function clear() {
    workspace.value = null
    projects.value = []
    currentProjectId.value = null
    projectsLoaded.value = false
  }

  return {
    workspace,
    projects,
    currentProjectId,
    currentProject,
    slug,
    loading,
    projectsLoaded,
    loadWorkspace,
    loadProjects,
    createProject,
    setCurrentProject,
    clear,
  }
})
