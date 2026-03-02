// Deprecated: Use useWorkspaceStore() instead
// Kept for backwards compatibility during migration
export function useWorkspace() {
  const store = useWorkspaceStore()
  return {
    currentWorkspace: computed(() => store.workspace),
    fetchWorkspaces: async () => [] as any[],
    fetchWorkspaceBySlug: (slug: string) => store.loadWorkspace(slug),
    fetchMembers: async (workspaceId: string) => {
      return $fetch<any[]>(`/api/workspaces/${workspaceId}/members`)
    },
    createWorkspace: async (name: string) => {
      return $fetch('/api/workspaces', { method: 'POST', body: { name } })
    },
  }
}
