<template>
  <div class="min-h-screen flex items-center justify-center">
    <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-[var(--ui-text-muted)]" />
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const router = useRouter()
const handled = ref(false)

async function fetchWorkspacesWithRetry(): Promise<any[] | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const headers: Record<string, string> = {}
      // Forward cookies in SSR so Supabase auth works server-side
      if (import.meta.server) {
        const reqHeaders = useRequestHeaders(['cookie'])
        if (reqHeaders.cookie) headers.cookie = reqHeaders.cookie
      }
      const data = await $fetch<any[]>('/api/user/workspaces', { headers })
      return data
    } catch (e: any) {
      const status = e.statusCode || e.status
      if (status === 401) return null
      console.warn(`[index] Attempt ${attempt + 1} failed:`, status || e.message)
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)))
      }
    }
  }
  return null
}

async function redirectToWorkspace() {
  if (handled.value) return
  handled.value = true

  // Clean up invite session marker
  if (import.meta.client) {
    sessionStorage.removeItem('focusflow_invite_id')
  }

  const workspaces = await fetchWorkspacesWithRetry()

  if (workspaces && workspaces.length > 0) {
    await router.push(`/${workspaces[0].slug}/dashboard`)
  } else if (workspaces && workspaces.length === 0) {
    // Check if there are pending invitations — if so, go to dashboard of first available or onboarding
    await router.push('/onboarding')
  } else {
    // All retries failed — likely cookie not synced yet
    await new Promise(r => setTimeout(r, 1500))
    try {
      const data = await $fetch<any[]>('/api/user/workspaces')
      if (data && data.length > 0) {
        await router.push(`/${data[0].slug}/dashboard`)
        return
      }
    } catch { /* */ }
    await router.push('/onboarding')
  }
}

watch(user, (u, oldU) => {
  if (handled.value) return
  if (u) {
    redirectToWorkspace()
  } else if (u === null && oldU !== undefined) {
    handled.value = true
    router.push('/auth/login')
  }
}, { immediate: true })

onMounted(() => {
  if (user.value && !handled.value) {
    redirectToWorkspace()
  }
  setTimeout(() => {
    if (handled.value) return
    if (user.value) {
      redirectToWorkspace()
    } else {
      handled.value = true
      router.push('/auth/login')
    }
  }, 3000)
})
</script>
