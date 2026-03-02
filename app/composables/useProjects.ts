// Deprecated: Use useWorkspaceStore() instead
// Kept for backwards compatibility during migration
export function useProjects() {
  const store = useWorkspaceStore()
  return {
    fetchProjects: async () => {
      await store.loadProjects()
      return store.projects
    },
    fetchProject: async (projectId: string) => {
      return store.projects.find(p => p.id === projectId) || null
    },
    createProject: (project: any) => store.createProject(project),
    updateProject: async () => null,
  }
}
