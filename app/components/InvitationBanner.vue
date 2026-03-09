<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="invitations.length > 0"
        class="fixed top-0 inset-x-0 z-[300] flex justify-center pointer-events-none"
      >
        <div class="w-full max-w-lg mx-4 mt-3 md:mt-4 pointer-events-auto">
          <div
            v-for="inv in invitations"
            :key="inv.id"
            class="mb-2 bg-white dark:bg-[#1b1b1b] rounded-2xl border border-focusflow-200 dark:border-focusflow-500/30 shadow-xl shadow-focusflow-500/10 dark:shadow-black/40 overflow-hidden"
          >
            <div class="px-4 py-3">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-focusflow-100 dark:bg-focusflow-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <UIcon name="i-heroicons-envelope-open" class="w-5 h-5 text-focusflow-600 dark:text-focusflow-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ lang.language.value === 'en' ? 'Workspace Invitation' : 'Invitacion a Workspace' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span v-if="inv.invited_by_name" class="font-medium text-gray-700 dark:text-gray-300">{{ inv.invited_by_name }}</span>
                    {{ lang.language.value === 'en' ? ' invited you to' : ' te invito a' }}
                    <span class="font-semibold text-focusflow-600 dark:text-focusflow-400"> {{ inv.workspace_name }}</span>
                    <span class="text-gray-500 dark:text-gray-400"> ({{ inv.role }})</span>
                  </p>
                  <div class="flex items-center gap-2 mt-2.5">
                    <button
                      class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-focusflow-600 hover:bg-focusflow-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                      :disabled="responding[inv.id]"
                      @click="respond(inv, 'accept')"
                    >
                      {{ responding[inv.id] === 'accept' ? '...' : (lang.language.value === 'en' ? 'Accept' : 'Aceptar') }}
                    </button>
                    <button
                      class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-700 dark:text-gray-300 hover:text-red-700 dark:hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                      :disabled="responding[inv.id]"
                      @click="respond(inv, 'decline')"
                    >
                      {{ responding[inv.id] === 'decline' ? '...' : (lang.language.value === 'en' ? 'Decline' : 'Rechazar') }}
                    </button>
                  </div>
                </div>
                <button
                  class="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  @click="dismiss(inv.id)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const lang = useLanguage()
const router = useRouter()
const user = useSupabaseUser()

interface Invitation {
  id: string
  workspace_id: string
  workspace_name: string
  workspace_slug: string
  role: string
  invited_by_name: string
  created_at: string
}

const invitations = ref<Invitation[]>([])
const responding = ref<Record<string, string>>({})
const loaded = ref(false)

async function loadInvitations() {
  if (!user.value) return
  try {
    invitations.value = await $fetch<Invitation[]>('/api/auth/pending-invitations')
  } catch {}
  loaded.value = true
}

async function respond(inv: Invitation, action: 'accept' | 'decline') {
  responding.value[inv.id] = action
  try {
    const result = await $fetch<any>('/api/auth/respond-invitation', {
      method: 'POST',
      body: { inviteId: inv.id, action },
    })

    // Remove from list
    invitations.value = invitations.value.filter(i => i.id !== inv.id)

    // If accepted, navigate to the workspace
    if (action === 'accept' && result?.workspace_id && inv.workspace_slug) {
      await router.push(`/${inv.workspace_slug}/dashboard`)
    }
  } catch (e: any) {
    console.error('[InvitationBanner] respond error:', e)
  } finally {
    delete responding.value[inv.id]
  }
}

function dismiss(invId: string) {
  invitations.value = invitations.value.filter(i => i.id !== invId)
}

// Load on mount + when user changes
onMounted(() => {
  if (user.value) loadInvitations()
})

watch(user, (u) => {
  if (u && !loaded.value) loadInvitations()
})
</script>
