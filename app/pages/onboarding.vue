<template>
  <div class="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-focusflow-100/40 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-focusflow-50/50 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-lg px-4 py-12">
      <!-- Pending invitations -->
      <div v-if="pendingInvitations.length > 0" class="animate-fade-up">
        <div class="text-center mb-8">
          <img src="/logo.png" alt="FocusFlow" class="w-14 h-14 rounded-2xl mx-auto mb-6 shadow-lg shadow-focusflow-100" />
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
            {{ lang.language.value === 'en' ? 'You have pending invitations' : 'Tienes invitaciones pendientes' }}
          </h1>
        </div>
        <div
          v-for="inv in pendingInvitations"
          :key="inv.id"
          class="mb-3 bg-white rounded-2xl border border-focusflow-200 shadow-lg shadow-focusflow-100/30 overflow-hidden"
        >
          <div class="px-5 py-4">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-focusflow-100 flex items-center justify-center shrink-0 mt-0.5">
                <UIcon name="i-heroicons-envelope-open" class="w-5 h-5 text-focusflow-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">
                  {{ lang.language.value === 'en' ? 'Workspace Invitation' : 'Invitacion a Workspace' }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  <span v-if="inv.invited_by_name" class="font-medium text-gray-700">{{ inv.invited_by_name }}</span>
                  {{ lang.language.value === 'en' ? ' invited you to' : ' te invito a' }}
                  <span class="font-semibold text-focusflow-600"> {{ inv.workspace_name }}</span>
                  <span class="text-gray-400"> ({{ inv.role }})</span>
                </p>
                <div class="flex items-center gap-2 mt-3">
                  <UButton
                    size="sm"
                    color="primary"
                    class="font-semibold"
                    :loading="respondingId === inv.id"
                    @click="acceptInvitation(inv)"
                  >
                    {{ lang.language.value === 'en' ? 'Join Workspace' : 'Unirme al Workspace' }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    color="neutral"
                    @click="declineInvitation(inv)"
                  >
                    {{ lang.language.value === 'en' ? 'Decline' : 'Rechazar' }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
        <UButton
          block
          size="lg"
          variant="soft"
          class="mt-6 font-semibold"
          :loading="creating"
          @click="goToMyWorkspace"
        >
          {{ lang.language.value === 'en' ? 'Go to my workspace' : 'Ir a mi workspace' }}
        </UButton>
      </div>

      <!-- No invitations: auto-create default workspace -->
      <div v-else class="text-center animate-fade-up">
        <img src="/logo.png" alt="FocusFlow" class="w-14 h-14 rounded-2xl mx-auto mb-6 shadow-lg shadow-focusflow-100" />
        <div class="flex flex-col items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-focusflow-500" />
          <p class="text-sm text-gray-500">
            {{ lang.language.value === 'en' ? 'Preparing your workspace...' : 'Preparando tu workspace...' }}
          </p>
          <p v-if="errorMsg" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-2">{{ errorMsg }}</p>
          <UButton v-if="errorMsg" size="sm" variant="soft" @click="goToMyWorkspace">
            {{ lang.language.value === 'en' ? 'Retry' : 'Reintentar' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()
const lang = useLanguage()

const errorMsg = ref('')
const creating = ref(false)

interface PendingInvitation {
  id: string
  workspace_id: string
  workspace_name: string
  workspace_slug: string
  role: string
  invited_by_name: string
  created_at: string
}

const pendingInvitations = ref<PendingInvitation[]>([])
const respondingId = ref('')

async function goToMyWorkspace() {
  errorMsg.value = ''
  creating.value = true
  try {
    const ws = await $fetch<{ slug: string }>('/api/user/ensure-workspace', { method: 'POST' })
    await router.replace(`/${ws.slug}/dashboard`)
  } catch (e: any) {
    errorMsg.value = e.data?.message || e.message || 'Error'
  } finally {
    creating.value = false
  }
}

async function acceptInvitation(inv: PendingInvitation) {
  respondingId.value = inv.id
  try {
    const result = await $fetch<any>('/api/auth/respond-invitation', {
      method: 'POST',
      body: { inviteId: inv.id, action: 'accept' },
    })
    if (result?.workspace_id && inv.workspace_slug) {
      await router.push(`/${inv.workspace_slug}/dashboard`)
    } else {
      await goToMyWorkspace()
    }
  } catch (e: any) {
    console.error('[onboarding] Accept invitation error:', e)
  } finally {
    respondingId.value = ''
  }
}

async function declineInvitation(inv: PendingInvitation) {
  try {
    await $fetch('/api/auth/respond-invitation', {
      method: 'POST',
      body: { inviteId: inv.id, action: 'decline' },
    })
    pendingInvitations.value = pendingInvitations.value.filter(i => i.id !== inv.id)
    if (pendingInvitations.value.length === 0) await goToMyWorkspace()
  } catch {}
}

onMounted(async () => {
  try {
    const existing = await $fetch<any[]>('/api/user/workspaces')
    if (existing && existing.length > 0) {
      await router.replace(`/${existing[0].slug}/dashboard`)
      return
    }
  } catch {}

  try {
    pendingInvitations.value = await $fetch<PendingInvitation[]>('/api/auth/pending-invitations')
  } catch {}

  // No invitations → create default workspace and go straight in
  if (pendingInvitations.value.length === 0) {
    await goToMyWorkspace()
  }
})
</script>
