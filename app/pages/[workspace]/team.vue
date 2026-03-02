<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Equipo</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ members.length }} miembro{{ members.length !== 1 ? 's' : '' }} en el workspace</p>
      </div>
      <UButton icon="i-heroicons-user-plus" color="primary" size="md" class="font-semibold" @click="showInvite = true">
        Invitar
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando equipo...</span>
      </div>
    </div>

    <!-- Members list -->
    <div v-else class="space-y-2 animate-fade-up delay-100">
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white rounded-2xl p-4 border border-gray-100 hover:border-focusflow-200 transition-all shadow-card group"
      >
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            :class="member.isCurrentUser
              ? 'bg-focusflow-100 text-focusflow-700'
              : roleAvatarClass(member.role)"
          >
            {{ getInitials(member.email || member.user_id) }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-sm text-gray-900 truncate">
                {{ member.email || member.user_id.slice(0, 12) + '...' }}
              </p>
              <span v-if="member.isCurrentUser" class="text-[9px] font-bold text-focusflow-600 bg-focusflow-50 px-1.5 py-0.5 rounded-md uppercase">Tú</span>
            </div>
            <p class="text-[11px] text-gray-400 mt-0.5">
              Se unió {{ formatJoinDate(member.joined_at) }}
            </p>
          </div>

          <!-- Role badge / selector -->
          <div class="flex items-center gap-2">
            <!-- If owner — just show badge, can't change -->
            <span
              v-if="member.role === 'owner'"
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700"
            >
              Owner
            </span>
            <!-- If admin and not current user — show selector (for admins/owners managing others) -->
            <template v-else-if="isAdmin && !member.isCurrentUser">
              <select
                :value="member.role"
                class="text-[11px] font-semibold px-2 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 cursor-pointer focus:ring-1 focus:ring-focusflow-300 outline-none"
                @change="handleRoleChange(member, ($event.target as HTMLSelectElement).value)"
              >
                <option value="viewer">Viewer</option>
                <option value="member">Miembro</option>
                <option value="admin">Admin</option>
              </select>
            </template>
            <!-- Otherwise just show badge -->
            <span
              v-else
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
              :class="roleClasses(member.role)"
            >
              {{ roleLabel(member.role) }}
            </span>

            <!-- Remove member button (visible to admins, not for self or owner) -->
            <button
              v-if="isAdmin && !member.isCurrentUser && member.role !== 'owner'"
              class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Remover del equipo"
              @click="handleRemoveMember(member)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="members.length === 0" class="text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900">Sin miembros</h3>
        <p class="text-sm text-gray-500 mt-1">Invita a tu equipo para colaborar</p>
      </div>
    </div>

    <!-- Invite modal -->
    <UModal v-model:open="showInvite">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-1">Invitar miembro</h2>
          <p class="text-sm text-gray-500 mb-5">El usuario debe tener una cuenta en FocusFlow</p>

          <form class="space-y-4" @submit.prevent="handleInvite">
            <UFormField label="Email del usuario">
              <UInput v-model="inviteEmail" type="email" placeholder="usuario@email.com" required class="w-full" size="lg" autofocus />
            </UFormField>

            <UFormField label="Rol">
              <USelectMenu v-model="inviteRole" :items="roleOptions" value-key="value" class="w-full" />
            </UFormField>

            <p v-if="inviteError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{{ inviteSuccess }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showInvite = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="inviting" class="font-semibold">Invitar</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const auth = useAuthStore()
const user = useSupabaseUser()

const members = ref<any[]>([])
const loading = ref(true)

const showInvite = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('member')
const inviteError = ref('')
const inviteSuccess = ref('')
const inviting = ref(false)

const isAdmin = computed(() => auth.isAdmin || auth.isOwner || auth.isSuperadmin)

const roleOptions = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Miembro', value: 'member' },
  { label: 'Admin', value: 'admin' },
]

onMounted(async () => {
  try {
    if (!store.workspace) return
    await loadMembers()
  } catch { } finally {
    loading.value = false
  }
})

async function loadMembers() {
  if (!store.workspace?.id) return
  try {
    const data = await $fetch<any[]>(`/api/workspaces/${store.workspace.id}/members`)
    members.value = (data || []).map(m => ({
      ...m,
      isCurrentUser: m.user_id === user.value?.id,
    }))
  } catch {
    members.value = []
  }
}

async function handleInvite() {
  inviteError.value = ''
  inviteSuccess.value = ''
  inviting.value = true
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members`, {
      method: 'POST',
      body: { email: inviteEmail.value, role: inviteRole.value },
    })
    inviteSuccess.value = `${inviteEmail.value} agregado al equipo`
    inviteEmail.value = ''
    await loadMembers()
  } catch (e: any) {
    inviteError.value = e.data?.message || 'Error al invitar'
  } finally {
    inviting.value = false
  }
}

async function handleRoleChange(member: any, newRole: string) {
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    })
    member.role = newRole
  } catch (e: any) {
    alert(e.data?.message || 'Error al cambiar rol')
    await loadMembers()
  }
}

async function handleRemoveMember(member: any) {
  const label = member.email || member.user_id.slice(0, 12)
  if (!confirm(`¿Remover a "${label}" del equipo?`)) return
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}`, {
      method: 'DELETE',
    })
    members.value = members.value.filter(m => m.id !== member.id)
  } catch (e: any) {
    alert(e.data?.message || 'Error al remover miembro')
  }
}

function getInitials(str: string) {
  if (str.includes('@')) {
    const name = str.split('@')[0]!
    return name.slice(0, 2).toUpperCase()
  }
  return str.slice(0, 2).toUpperCase()
}

function formatJoinDate(d: string) {
  try { return format(new Date(d), "d MMM yyyy", { locale: es }) } catch { return d }
}

function roleAvatarClass(role: string) {
  const map: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-sky-100 text-sky-700',
    member: 'bg-gray-100 text-gray-500',
    viewer: 'bg-gray-50 text-gray-400',
  }
  return map[role] || map.member
}

function roleClasses(role: string) {
  const map: Record<string, string> = {
    owner: 'bg-amber-50 text-amber-700',
    admin: 'bg-sky-50 text-sky-700',
    member: 'bg-gray-100 text-gray-500',
    viewer: 'bg-gray-50 text-gray-400',
  }
  return map[role] || map.member
}

function roleLabel(role: string) {
  return { owner: 'Owner', admin: 'Admin', member: 'Miembro', viewer: 'Viewer' }[role] || role
}
</script>
