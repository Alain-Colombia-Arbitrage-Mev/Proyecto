import { defineStore } from 'pinia'
import type { UserRole } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = useSupabaseUser()
  const role = ref<UserRole>('member')
  const isPlatformAdmin = ref(false)
  const roleLoaded = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperadmin = computed(() => isPlatformAdmin.value || role.value === 'superadmin')
  const isAdmin = computed(() =>
    isSuperadmin.value || role.value === 'owner' || role.value === 'admin',
  )
  const isOwner = computed(() =>
    isSuperadmin.value || role.value === 'owner',
  )
  const userEmail = computed(() => user.value?.email || '')
  const userInitials = computed(() => {
    const email = userEmail.value
    if (!email) return '?'
    return email.slice(0, 2).toUpperCase()
  })

  function setRole(r: UserRole) {
    role.value = r
  }

  /**
   * Load user's effective role for a given workspace from the server
   */
  async function loadRole(workspaceId?: string) {
    if (!user.value) return
    try {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : ''
      const data = await $fetch<any>(`/api/user/me${query}`)
      isPlatformAdmin.value = data.is_platform_admin || false
      role.value = data.effective_role || 'member'
      roleLoaded.value = true
    } catch {
      // Fallback — keep current role
    }
  }

  function clear() {
    role.value = 'member'
    isPlatformAdmin.value = false
    roleLoaded.value = false
  }

  return {
    user,
    role,
    isPlatformAdmin,
    roleLoaded,
    isAuthenticated,
    isSuperadmin,
    isAdmin,
    isOwner,
    userEmail,
    userInitials,
    setRole,
    loadRole,
    clear,
  }
})
