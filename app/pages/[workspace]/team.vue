<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 animate-fade-up">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Equipo</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ members.length }} miembro{{ members.length !== 1 ? 's' : '' }} en el workspace</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton icon="i-heroicons-video-camera" variant="soft" size="md" class="font-semibold" @click="showMeetingModal = true">
          Programar reunión
        </UButton>
        <UButton v-if="isAdmin" icon="i-heroicons-user-plus" color="primary" size="md" class="font-semibold" @click="openInviteModal">
          Invitar
        </UButton>
      </div>
    </div>

    <!-- Upcoming meetings -->
    <div v-if="meetings.length > 0" class="mb-8 animate-fade-up">
      <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Próximas reuniones</h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="meeting in meetings"
          :key="meeting.id"
          class="bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-all shadow-card"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <UIcon name="i-heroicons-video-camera" class="w-4 h-4 text-blue-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 truncate">{{ meeting.title }}</p>
              <p class="text-[11px] text-gray-500 mt-0.5">
                {{ formatMeetingDate(meeting.scheduled_at) }} · {{ meeting.duration_minutes }} min
              </p>
              <div class="flex items-center gap-2 mt-2">
                <a
                  :href="meeting.meeting_url"
                  target="_blank"
                  class="text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-video-camera" class="w-3 h-3" />
                  Unirse
                </a>
                <span class="text-[10px] text-gray-400">{{ (meeting.attendees || []).length }} participante(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
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
                {{ member.email || (member.user_id ? member.user_id.slice(0, 12) + '...' : 'Sin email') }}
              </p>
              <span v-if="member.isCurrentUser" class="text-[9px] font-bold text-focusflow-600 bg-focusflow-50 px-1.5 py-0.5 rounded-md uppercase">Tú</span>
            </div>
            <p class="text-[11px] text-gray-400 mt-0.5">
              Se unió {{ formatJoinDate(member.joined_at) }}
            </p>
            <!-- Project access chips -->
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-if="member.has_all_projects"
                class="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"
              >
                Todos los proyectos
              </span>
              <template v-else>
                <span
                  v-for="pid in member.project_ids"
                  :key="pid"
                  class="text-[9px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: projectColor(pid) }" />
                  {{ projectName(pid) }}
                  <button
                    v-if="isAdmin && !member.isCurrentUser"
                    class="text-gray-400 hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                    @click.stop="removeProjectFromMember(member, pid)"
                    title="Quitar de este proyecto"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-2.5 h-2.5" />
                  </button>
                </span>
                <span
                  v-if="member.project_ids.length === 0"
                  class="text-[9px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-500"
                >
                  Sin acceso a proyectos
                </span>
                <!-- Quick add to project dropdown -->
                <div v-if="isAdmin && !member.isCurrentUser" class="relative inline-block">
                  <button
                    class="text-[9px] font-medium px-2 py-0.5 rounded-md bg-focusflow-50 text-focusflow-600 hover:bg-focusflow-100 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                    @click="toggleQuickAdd(member)"
                  >
                    <UIcon name="i-heroicons-plus" class="w-2.5 h-2.5" />
                    Proyecto
                  </button>
                  <!-- Quick add dropdown -->
                  <div
                    v-if="quickAddMemberId === member.id"
                    class="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[180px]"
                  >
                    <div class="px-2 py-1.5 border-b border-gray-50">
                      <p class="text-[9px] font-bold uppercase tracking-widest text-gray-400">Añadir a proyecto</p>
                    </div>
                    <div class="max-h-40 overflow-y-auto">
                      <button
                        v-for="project in availableProjectsFor(member)"
                        :key="project.id"
                        class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-focusflow-50 transition-colors cursor-pointer"
                        @click="addProjectToMember(member, project.id)"
                      >
                        <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
                        {{ project.name }}
                      </button>
                      <p v-if="availableProjectsFor(member).length === 0" class="text-[10px] text-gray-400 text-center py-2 px-3">
                        Ya tiene acceso a todos
                      </p>
                    </div>
                    <div class="px-2 pt-1 border-t border-gray-50 mt-1">
                      <button
                        class="w-full text-[10px] font-medium text-focusflow-600 hover:text-focusflow-700 py-1 cursor-pointer"
                        @click="openEditProjectsModal(member)"
                      >
                        Gestionar todos los accesos
                      </button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Role badge / selector -->
          <div class="flex items-center gap-2">
            <span
              v-if="member.role === 'owner'"
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700"
            >
              Owner
            </span>
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
            <span
              v-else
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
              :class="roleClasses(member.role)"
            >
              {{ roleLabel(member.role) }}
            </span>

            <!-- Remove member button -->
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

            <!-- Project multi-select (disabled for admin+) -->
            <UFormField v-if="!isInviteAdminPlus" label="Acceso a proyectos">
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                <label
                  v-for="project in allProjects"
                  :key="project.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    :value="project.id"
                    v-model="inviteProjectIds"
                    class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
                  />
                  <span class="text-sm text-gray-700">{{ project.name }}</span>
                </label>
                <p v-if="allProjects.length === 0" class="text-xs text-gray-400 text-center py-2">No hay proyectos</p>
              </div>
            </UFormField>
            <p v-else class="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Los roles admin+ tienen acceso automático a todos los proyectos
            </p>

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

    <!-- Edit project access modal -->
    <UModal v-model:open="showEditProjects">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 mb-1">Acceso a proyectos</h2>
          <p class="text-sm text-gray-500 mb-5">{{ editingMember?.email || 'Miembro' }}</p>

          <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <label
              v-for="project in allProjects"
              :key="project.id"
              class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <input
                type="checkbox"
                :value="project.id"
                v-model="editProjectIds"
                class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
              />
              <div class="flex items-center gap-2 flex-1">
                <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }"></div>
                <span class="text-sm text-gray-700">{{ project.name }}</span>
              </div>
            </label>
            <p v-if="allProjects.length === 0" class="text-xs text-gray-400 text-center py-2">No hay proyectos</p>
          </div>

          <div class="flex items-center justify-between pt-4">
            <button
              class="text-xs text-focusflow-600 hover:text-focusflow-700 font-medium cursor-pointer"
              @click="editProjectIds = allProjects.map(p => p.id)"
            >
              Seleccionar todos
            </button>
            <div class="flex gap-3">
              <UButton variant="ghost" @click="showEditProjects = false">Cancelar</UButton>
              <UButton color="primary" :loading="savingProjects" class="font-semibold" @click="handleSaveProjects">Guardar</UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Meeting schedule modal -->
    <MeetingScheduleModal
      v-model:open="showMeetingModal"
      :workspace-id="store.workspace?.id || ''"
      :members="meetingMembers"
      :projects="allProjects"
      @created="onMeetingCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Project, Meeting } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const auth = useAuthStore()
const user = useSupabaseUser()

const members = ref<any[]>([])
const loading = ref(true)
const allProjects = ref<Project[]>([])
const meetings = ref<Meeting[]>([])
const showMeetingModal = ref(false)

// Invite modal state
const showInvite = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('member')
const inviteProjectIds = ref<string[]>([])
const inviteError = ref('')
const inviteSuccess = ref('')
const inviting = ref(false)

// Edit projects modal state
const showEditProjects = ref(false)
const editingMember = ref<any>(null)
const editProjectIds = ref<string[]>([])
const savingProjects = ref(false)

const isAdmin = computed(() => auth.isAdmin || auth.isOwner || auth.isSuperadmin)

const isInviteAdminPlus = computed(() =>
  ['admin', 'owner', 'superadmin'].includes(inviteRole.value),
)

const roleOptions = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Miembro', value: 'member' },
  { label: 'Admin', value: 'admin' },
]

// Close quick-add dropdown on outside click
function handleOutsideClick(e: MouseEvent) {
  if (quickAddMemberId.value && !(e.target as HTMLElement).closest('.relative.inline-block')) {
    quickAddMemberId.value = null
  }
}

onMounted(async () => {
  document.addEventListener('click', handleOutsideClick)
  try {
    if (!store.workspace) return
    await Promise.all([loadMembers(), loadAllProjects(), loadMeetings()])
  } catch { } finally {
    loading.value = false
  }
})

async function loadAllProjects() {
  if (!store.workspace?.id) return
  try {
    // Use store projects (already loaded) or fetch
    if (store.projects.length > 0) {
      allProjects.value = store.projects
    } else {
      const data = await $fetch<Project[]>(`/api/workspaces/${store.workspace.id}/projects`)
      allProjects.value = data || []
    }
  } catch {
    allProjects.value = []
  }
}

const meetingMembers = computed(() =>
  members.value.map(m => ({ user_id: m.user_id, email: m.email || m.user_id, role: m.role })),
)

async function loadMeetings() {
  if (!store.workspace?.id) return
  try {
    meetings.value = await $fetch<Meeting[]>(`/api/workspaces/${store.workspace.id}/meetings`)
  } catch {
    meetings.value = []
  }
}

function onMeetingCreated(_meeting: Meeting) {
  loadMeetings()
}

function formatMeetingDate(d: string) {
  try { return format(new Date(d), "EEE d MMM, HH:mm", { locale: es }) } catch { return d }
}

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

function projectName(projectId: string): string {
  const p = allProjects.value.find(p => p.id === projectId)
  return p?.name || projectId.slice(0, 8)
}

function openInviteModal() {
  inviteEmail.value = ''
  inviteRole.value = 'member'
  inviteProjectIds.value = []
  inviteError.value = ''
  inviteSuccess.value = ''
  showInvite.value = true
}

async function handleInvite() {
  inviteError.value = ''
  inviteSuccess.value = ''
  inviting.value = true
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members`, {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        role: inviteRole.value,
        project_ids: isInviteAdminPlus.value ? [] : inviteProjectIds.value,
      },
    })
    inviteSuccess.value = `${inviteEmail.value} agregado al equipo`
    inviteEmail.value = ''
    inviteProjectIds.value = []
    await loadMembers()
  } catch (e: any) {
    inviteError.value = e.data?.message || 'Error al invitar'
  } finally {
    inviting.value = false
  }
}

async function handleRoleChange(member: any, newRole: string) {
  const oldRole = member.role
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    })
    // Reload to get updated project_ids / has_all_projects
    await loadMembers()
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

const quickAddMemberId = ref<string | null>(null)

function toggleQuickAdd(member: any) {
  quickAddMemberId.value = quickAddMemberId.value === member.id ? null : member.id
}

function availableProjectsFor(member: any): Project[] {
  const memberProjectIds = new Set(member.project_ids || [])
  return allProjects.value.filter(p => !memberProjectIds.has(p.id))
}

async function addProjectToMember(member: any, projectId: string) {
  const newIds = [...(member.project_ids || []), projectId]
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}/projects`, {
      method: 'PUT',
      body: { project_ids: newIds },
    })
    await loadMembers()
  } catch (e: any) {
    alert(e.data?.message || 'Error al añadir proyecto')
  }
  quickAddMemberId.value = null
}

async function removeProjectFromMember(member: any, projectId: string) {
  const newIds = (member.project_ids || []).filter((id: string) => id !== projectId)
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}/projects`, {
      method: 'PUT',
      body: { project_ids: newIds },
    })
    await loadMembers()
  } catch (e: any) {
    alert(e.data?.message || 'Error al quitar proyecto')
  }
}

function projectColor(projectId: string): string {
  const p = allProjects.value.find(p => p.id === projectId)
  return p?.color || '#9CA3AF'
}

function openEditProjectsModal(member: any) {
  editingMember.value = member
  editProjectIds.value = [...(member.project_ids || [])]
  showEditProjects.value = true
}

async function handleSaveProjects() {
  if (!editingMember.value) return
  savingProjects.value = true
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${editingMember.value.id}/projects`, {
      method: 'PUT',
      body: { project_ids: editProjectIds.value },
    })
    await loadMembers()
    showEditProjects.value = false
  } catch (e: any) {
    alert(e.data?.message || 'Error al actualizar acceso')
  } finally {
    savingProjects.value = false
  }
}

function getInitials(str: string | null | undefined) {
  if (!str) return '??'
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

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>
