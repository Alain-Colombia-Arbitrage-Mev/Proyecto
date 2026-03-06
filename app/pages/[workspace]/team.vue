<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 animate-fade-up">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{{ t.teamTitle }}</h1>
        <p class="text-sm text-gray-500 dark:text-[#99a0ae] mt-0.5">{{ members.length }} {{ members.length !== 1 ? t.membersCount : t.memberSingular }}</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton v-if="auth.isSuperadmin || auth.isOwner" icon="i-heroicons-shield-check" variant="outline" size="md" class="font-semibold hidden sm:inline-flex" @click="showPermEditor = true">
          {{ lang.language.value === 'en' ? 'Permissions' : 'Permisos' }}
        </UButton>
        <UButton v-if="auth.isSuperadmin || auth.isOwner" icon="i-heroicons-shield-check" variant="outline" size="md" class="sm:hidden" @click="showPermEditor = true" />
        <UButton v-if="canCreateMeetings" icon="i-heroicons-video-camera" variant="soft" size="md" class="font-semibold hidden sm:inline-flex" @click="showMeetingModal = true">
          {{ t.scheduleMeeting }}
        </UButton>
        <UButton v-if="canCreateMeetings" icon="i-heroicons-video-camera" variant="soft" size="md" class="sm:hidden" @click="showMeetingModal = true" />
        <UButton v-if="canManageMembers" icon="i-heroicons-user-plus" color="primary" size="md" class="font-semibold hidden sm:inline-flex" @click="openInviteModal">
          {{ t.invite }}
        </UButton>
        <UButton v-if="canManageMembers" icon="i-heroicons-user-plus" color="primary" size="md" class="sm:hidden" @click="openInviteModal" />
      </div>
    </div>

    <!-- Upcoming meetings -->
    <div v-if="meetings.length > 0" class="mb-8 animate-fade-up">
      <h2 class="text-sm font-bold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wider mb-3">{{ t.upcomingMeetings }}</h2>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="meeting in meetings"
          :key="meeting.id"
          class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-4 border border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all shadow-card"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <UIcon name="i-heroicons-video-camera" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ meeting.title }}</p>
              <p class="text-[11px] text-gray-500 dark:text-[#99a0ae] mt-0.5">
                {{ formatMeetingDate(meeting.scheduled_at) }} · {{ meeting.duration_minutes }} min
              </p>
              <div class="flex items-center gap-2 mt-2">
                <a
                  :href="meeting.meeting_url"
                  target="_blank"
                  class="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <UIcon name="i-heroicons-video-camera" class="w-3.5 h-3.5" />
                  {{ t.join }}
                </a>
                <span class="text-[10px] text-gray-400 dark:text-gray-500">{{ (meeting.attendees || []).length }} {{ t.participants }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400 dark:text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loadingTeam }}</span>
      </div>
    </div>

    <!-- Pending Invitations -->
    <div v-if="!loading && pendingInvitations.length > 0 && isAdmin" class="mb-6 animate-fade-up">
      <h2 class="text-sm font-bold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wider mb-3">
        {{ t.pendingInvitations }} ({{ pendingInvitations.length }})
      </h2>
      <div class="space-y-2">
        <div
          v-for="inv in pendingInvitations"
          :key="inv.id"
          class="bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-500/10 group"
        >
          <div class="flex items-center gap-3 sm:gap-4">
            <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center font-bold text-sm text-amber-700 dark:text-amber-400 shrink-0">
              {{ getInitials(inv.email) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">{{ inv.email }}</p>
              <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                {{ t.pendingInvite }} · {{ formatJoinDate(inv.created_at) }}
              </p>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
              {{ roleLabel(inv.role) }}
            </span>
            <button
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              :title="t.cancelInvite"
              @click="handleDeleteInvitation(inv)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Members list -->
    <div v-if="!loading" class="space-y-2 animate-fade-up delay-100">
      <div
        v-for="member in members"
        :key="member.id"
        class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-4 border border-gray-100 dark:border-white/10 hover:border-focusflow-200 dark:hover:border-focusflow-500/30 transition-all shadow-card group"
      >
        <div class="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            :class="member.isCurrentUser
              ? 'bg-focusflow-100 dark:bg-focusflow-500/10 text-focusflow-700 dark:text-focusflow-400'
              : roleAvatarClass(member.role)"
          >
            {{ getInitials(member.email || member.user_id) }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {{ member.email || (member.user_id ? member.user_id.slice(0, 12) + '...' : t.noEmail) }}
              </p>
              <span v-if="member.isCurrentUser" class="text-[10px] font-bold text-focusflow-600 dark:text-focusflow-400 bg-focusflow-50 dark:bg-focusflow-500/10 px-1.5 py-0.5 rounded-md uppercase">{{ t.you }}</span>
            </div>
            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              {{ t.joined }} {{ formatJoinDate(member.joined_at) }}
            </p>
            <!-- Project access chips -->
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-if="member.has_all_projects"
                class="text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                {{ t.allProjects }}
              </span>
              <template v-else>
                <span
                  v-for="pid in member.project_ids"
                  :key="pid"
                  class="text-[10px] font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: projectColor(pid) }" />
                  {{ projectName(pid) }}
                  <button
                    v-if="isAdmin && !member.isCurrentUser"
                    class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer ml-0.5"
                    @click.stop="removeProjectFromMember(member, pid)"
                    :title="t.removeFromProject"
                  >
                    <UIcon name="i-heroicons-x-mark" class="w-2.5 h-2.5" />
                  </button>
                </span>
                <span
                  v-if="member.project_ids.length === 0"
                  class="text-[9px] font-medium px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400"
                >
                  {{ t.noProjectAccess }}
                </span>
                <!-- Quick add to project dropdown -->
                <div v-if="isAdmin && !member.isCurrentUser" class="relative inline-block">
                  <button
                    class="text-[9px] font-medium px-2 py-0.5 rounded-md bg-focusflow-50 dark:bg-focusflow-500/10 text-focusflow-600 dark:text-focusflow-400 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                    @click="toggleQuickAdd(member)"
                  >
                    <UIcon name="i-heroicons-plus" class="w-2.5 h-2.5" />
                    {{ t.project }}
                  </button>
                  <!-- Quick add dropdown -->
                  <div
                    v-if="quickAddMemberId === member.id"
                    class="absolute left-0 sm:left-0 right-0 sm:right-auto top-full mt-1 z-20 bg-white dark:bg-[#1b1b1b] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1 min-w-[180px]"
                  >
                    <div class="px-2 py-1.5 border-b border-gray-50 dark:border-white/10">
                      <p class="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{{ t.addToProject }}</p>
                    </div>
                    <div class="max-h-40 overflow-y-auto">
                      <button
                        v-for="project in availableProjectsFor(member)"
                        :key="project.id"
                        class="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 transition-colors cursor-pointer"
                        @click="addProjectToMember(member, project.id)"
                      >
                        <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
                        {{ project.name }}
                      </button>
                      <p v-if="availableProjectsFor(member).length === 0" class="text-[10px] text-gray-400 dark:text-gray-500 text-center py-2 px-3">
                        {{ t.alreadyHasAll }}
                      </p>
                    </div>
                    <div class="px-2 pt-1 border-t border-gray-50 dark:border-white/10 mt-1">
                      <button
                        class="w-full text-[10px] font-medium text-focusflow-600 hover:text-focusflow-700 py-1 cursor-pointer"
                        @click="openEditProjectsModal(member)"
                      >
                        {{ t.manageAccess }}
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
              v-if="member.role === 'owner' && !canChangeRole(member)"
              class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Owner
            </span>
            <template v-else-if="canChangeRole(member)">
              <select
                :value="member.role"
                class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-700 dark:text-gray-300 cursor-pointer focus:ring-1 focus:ring-focusflow-300 outline-none"
                @change="handleRoleChange(member, ($event.target as HTMLSelectElement).value)"
              >
                <option value="viewer">{{ t.viewer }}</option>
                <option value="marketing">Marketing</option>
                <option value="member">{{ t.member }}</option>
                <option value="admin">{{ t.admin }}</option>
                <option v-if="auth.isSuperadmin || auth.isOwner" value="owner">{{ t.owner }}</option>
                <option v-if="auth.isSuperadmin" value="superadmin">{{ t.superadmin }}</option>
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
              v-if="isAdmin && !member.isCurrentUser && (member.role !== 'owner' || auth.isSuperadmin)"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
              :title="t.removeFromTeam"
              @click="handleRemoveMember(member)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Procrastination Metrics Section -->
      <div v-if="canSeeMetrics" class="mt-8 animate-fade-up delay-200">
        <button
          class="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-[#99a0ae] hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer mb-4"
          @click="toggleMetrics"
        >
          <UIcon :name="showProcMetrics ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="w-4 h-4" />
          <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
          {{ showProcMetrics ? t.hideMetrics : t.showMetrics }}
        </button>

        <div v-if="showProcMetrics">
          <div v-if="loadingMetrics" class="flex items-center gap-3 text-gray-400 dark:text-gray-500 py-8 justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            <span class="text-sm">{{ t.loadingMetrics }}</span>
          </div>

          <div v-else>
            <!-- Section header -->
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-focusflow-50 dark:bg-focusflow-500/10 flex items-center justify-center">
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-focusflow-600 dark:text-focusflow-400" />
              </div>
              <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ t.procrastinationMetrics }}</h3>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="pm in procrastinationData"
                :key="pm.user_id"
                class="bg-white dark:bg-[#1b1b1b] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-card"
              >
                <!-- Header: avatar + email + SVG ring -->
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    :class="memberAvatarClass(pm.user_id)"
                  >
                    {{ getInitials(memberEmail(pm.user_id)) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ memberEmail(pm.user_id) }}</p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-500">{{ pm.total_tasks }} {{ t.tasksTracked }}</p>
                  </div>
                  <!-- SVG circular progress ring -->
                  <div v-if="pm.procrastination_index !== null" class="relative w-9 h-9 shrink-0" :title="t.procrastinationIndex + ': ' + pm.procrastination_index">
                    <svg viewBox="0 0 36 36" class="w-9 h-9 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="stroke-gray-100 dark:stroke-white/10" />
                      <circle
                        cx="18" cy="18" r="15.5" fill="none" stroke-width="3"
                        stroke-linecap="round"
                        :stroke="riskStrokeColor(pm.procrastination_index)"
                        :stroke-dasharray="`${(pm.procrastination_index / 100) * 97.4} 97.4`"
                        class="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center text-[9px] font-bold" :class="riskTextColor(pm.procrastination_index)">
                      {{ pm.procrastination_index }}
                    </span>
                  </div>
                </div>

                <!-- No data state -->
                <div v-if="pm.procrastination_index === null" class="text-center py-3">
                  <p class="text-xs text-gray-400 dark:text-gray-500">{{ t.noTaskData }}</p>
                </div>

                <!-- Metric bars -->
                <div v-else class="space-y-2.5">
                  <div v-for="metric in getMetrics(pm)" :key="metric.label" :title="metric.desc">
                    <div class="flex items-center justify-between mb-0.5">
                      <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">{{ metric.label }}</span>
                      <span class="text-[10px] font-bold" :class="riskTextColor(metric.value)">{{ metric.value }}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700 ease-out" :class="riskBarColor(metric.value)" :style="{ width: metric.value + '%' }" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="members.length === 0" class="text-center py-16">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t.noMembers }}</h3>
        <p class="text-sm text-gray-500 dark:text-[#99a0ae] mt-1">{{ t.inviteTeam }}</p>
      </div>
    </div>

    <!-- Invite modal -->
    <UModal v-model:open="showInvite">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ t.inviteMember }}</h2>
          <p class="text-sm text-gray-500 dark:text-[#99a0ae] mb-5">{{ t.inviteDesc }}</p>

          <form class="space-y-4" @submit.prevent="handleInvite">
            <UFormField :label="t.userEmail">
              <UInput v-model="inviteEmail" type="email" placeholder="usuario@email.com" required class="w-full" size="lg" autofocus />
            </UFormField>

            <UFormField :label="t.role">
              <USelectMenu v-model="inviteRole" :items="roleOptions" value-key="value" class="w-full" />
            </UFormField>

            <!-- Project multi-select (disabled for admin+) -->
            <UFormField v-if="!isInviteAdminPlus" :label="t.projectAccess">
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg p-3">
                <label
                  v-for="project in allProjects"
                  :key="project.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    :value="project.id"
                    v-model="inviteProjectIds"
                    class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ project.name }}</span>
                </label>
                <p v-if="allProjects.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{{ t.noProjects }}</p>
              </div>
            </UFormField>
            <p v-else class="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
              {{ t.adminAutoAccess }}
            </p>

            <p v-if="inviteError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{{ inviteError }}</p>
            <p v-if="inviteSuccess" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{{ inviteSuccess }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showInvite = false">{{ t.cancel }}</UButton>
              <UButton type="submit" color="primary" :loading="inviting" class="font-semibold">{{ t.invite }}</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Edit project access modal -->
    <UModal v-model:open="showEditProjects">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ t.projectAccess }}</h2>
          <p class="text-sm text-gray-500 dark:text-[#99a0ae] mb-5">{{ editingMember?.email || t.member }}</p>

          <div class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg p-3">
            <label
              v-for="project in allProjects"
              :key="project.id"
              class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
            >
              <input
                type="checkbox"
                :value="project.id"
                v-model="editProjectIds"
                class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
              />
              <div class="flex items-center gap-2 flex-1">
                <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }"></div>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ project.name }}</span>
              </div>
            </label>
            <p v-if="allProjects.length === 0" class="text-xs text-gray-400 dark:text-gray-500 text-center py-2">{{ t.noProjects }}</p>
          </div>

          <div class="flex items-center justify-between pt-4">
            <button
              class="text-xs text-focusflow-600 hover:text-focusflow-700 font-medium cursor-pointer"
              @click="editProjectIds = allProjects.map(p => p.id)"
            >
              {{ t.selectAll }}
            </button>
            <div class="flex gap-3">
              <UButton variant="ghost" @click="showEditProjects = false">{{ t.cancel }}</UButton>
              <UButton color="primary" :loading="savingProjects" class="font-semibold" @click="handleSaveProjects">{{ t.save }}</UButton>
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

    <!-- Role permission editor -->
    <RolePermissionEditor
      v-model:open="showPermEditor"
      @saved="loadMembers"
    />
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Project, Meeting } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = useWorkspaceStore()
const auth = useAuthStore()
const user = useSupabaseUser()
const lang = useLanguage()
const t = lang.labels

const members = ref<any[]>([])
const loading = ref(true)
const allProjects = ref<Project[]>([])
const meetings = ref<Meeting[]>([])
const showMeetingModal = ref(false)
const showPermEditor = ref(false)

// Pending invitations
const pendingInvitations = ref<{ id: string; email: string; role: string; status: string; created_at: string }[]>([])

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

// Procrastination metrics state
const procrastinationData = ref<any[]>([])
const showProcMetrics = ref(false)
const loadingMetrics = ref(false)
const metricsLoaded = ref(false)

const isAdmin = computed(() => auth.isAdmin || auth.isOwner || auth.isSuperadmin)
const canSeeMetrics = computed(() => isAdmin.value)
const { canManageMembers, canCreateMeetings } = usePermissions()

function canChangeRole(member: any): boolean {
  if (member.isCurrentUser) return false
  if (auth.isSuperadmin) return true
  if (auth.isOwner && member.role !== 'superadmin') return true
  if (isAdmin.value && !['owner', 'superadmin'].includes(member.role)) return true
  return false
}

const isInviteAdminPlus = computed(() =>
  ['admin', 'owner', 'superadmin'].includes(inviteRole.value),
)

const roleOptions = computed(() => {
  const options = [
    { label: t.value.viewer, value: 'viewer' },
    { label: 'Marketing', value: 'marketing' },
    { label: t.value.member, value: 'member' },
    { label: t.value.admin, value: 'admin' },
  ]
  if (auth.isOwner || auth.isSuperadmin) {
    options.push({ label: t.value.owner, value: 'owner' })
  }
  if (auth.isSuperadmin) {
    options.push({ label: t.value.superadmin, value: 'superadmin' })
  }
  return options
})

// Close quick-add dropdown on outside click
function handleOutsideClick(e: MouseEvent) {
  if (quickAddMemberId.value && !(e.target as HTMLElement).closest('.relative.inline-block')) {
    quickAddMemberId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

watch(() => store.workspace?.id, async (id) => {
  if (!id) return
  loading.value = true
  try {
    await Promise.all([loadMembers(), loadAllProjects(), loadMeetings(), loadInvitations()])
  } catch { } finally {
    loading.value = false
  }
}, { immediate: true })

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
  try { return format(new Date(d), "EEE d MMM, HH:mm", { locale: lang.language.value === 'en' ? enUS : es }) } catch { return d }
}

async function loadInvitations() {
  if (!store.workspace?.id) return
  try {
    pendingInvitations.value = await $fetch(`/api/workspaces/${store.workspace.id}/invitations`)
  } catch {
    pendingInvitations.value = []
  }
}

async function handleDeleteInvitation(inv: { id: string; email: string }) {
  if (!confirm(t.value.confirmCancelInvite?.replace('{email}', inv.email) || `Cancel invitation for ${inv.email}?`)) return
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/invitations/${inv.id}`, { method: 'DELETE' })
    pendingInvitations.value = pendingInvitations.value.filter(i => i.id !== inv.id)
  } catch (e: any) {
    alert(e.data?.message || 'Error cancelling invitation')
  }
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
    const result = await $fetch<any>(`/api/workspaces/${store.workspace!.id}/members`, {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        role: inviteRole.value,
        project_ids: isInviteAdminPlus.value ? [] : inviteProjectIds.value,
      },
    })
    if (result.pending) {
      inviteSuccess.value = result.message || `Invitacion enviada a ${inviteEmail.value}`
      await loadInvitations()
    } else {
      inviteSuccess.value = `${inviteEmail.value} ${t.value.addedToTeam}`
      await loadMembers()
    }
    inviteEmail.value = ''
    inviteProjectIds.value = []
  } catch (e: any) {
    const msg = e.data?.message || e.statusMessage || e.message || ''
    inviteError.value = msg || t.value.errorInviting
  } finally {
    inviting.value = false
  }
}

async function handleRoleChange(member: any, newRole: string) {
  const label = member.email || member.display_name || member.user_id.slice(0, 12)
  const msg = lang.language.value === 'en'
    ? `Change ${label} role to "${newRole}"?`
    : `¿Cambiar rol de ${label} a "${newRole}"?`
  if (!confirm(msg)) {
    // Reset select to old value by reloading
    await loadMembers()
    return
  }
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}`, {
      method: 'PATCH',
      body: { role: newRole },
    })
    await loadMembers()
  } catch (e: any) {
    alert(e.data?.message || t.value.errorChangingRole)
    await loadMembers()
  }
}

async function handleRemoveMember(member: any) {
  const label = member.email || member.user_id.slice(0, 12)
  if (!confirm(t.value.confirmRemoveMember.replace('{name}', label))) return
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}/members/${member.id}`, {
      method: 'DELETE',
    })
    members.value = members.value.filter(m => m.id !== member.id)
  } catch (e: any) {
    alert(e.data?.message || t.value.errorRemovingMember)
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
    alert(e.data?.message || t.value.errorAddingProject)
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
    alert(e.data?.message || t.value.errorRemovingProject)
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
    alert(e.data?.message || t.value.errorUpdatingAccess)
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
  try { return format(new Date(d), "d MMM yyyy", { locale: lang.language.value === 'en' ? enUS : es }) } catch { return d }
}

function roleAvatarClass(role: string) {
  const map: Record<string, string> = {
    owner: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
    admin: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400',
    member: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400',
    viewer: 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500',
  }
  return map[role] || map.member
}

function roleClasses(role: string) {
  const map: Record<string, string> = {
    owner: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    admin: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400',
    member: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400',
    viewer: 'bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500',
  }
  return map[role] || map.member
}

function roleLabel(role: string) {
  const map: Record<string, string> = { owner: t.value.owner, admin: t.value.admin, member: t.value.member, viewer: t.value.viewer, superadmin: t.value.superadmin }
  return map[role] || role
}

// ── Procrastination metrics ──
async function loadProcrastination() {
  if (!store.workspace?.id) return
  loadingMetrics.value = true
  try {
    procrastinationData.value = await $fetch<any[]>(`/api/workspaces/${store.workspace.id}/procrastination`)
  } catch {
    procrastinationData.value = []
  } finally {
    loadingMetrics.value = false
    metricsLoaded.value = true
  }
}

function toggleMetrics() {
  showProcMetrics.value = !showProcMetrics.value
  if (showProcMetrics.value && !metricsLoaded.value) {
    loadProcrastination()
  }
}

function memberEmail(userId: string): string {
  const m = members.value.find(m => m.user_id === userId)
  return m?.email || userId.slice(0, 12) + '...'
}

function memberAvatarClass(userId: string): string {
  const m = members.value.find(m => m.user_id === userId)
  if (m?.isCurrentUser) return 'bg-focusflow-100 dark:bg-focusflow-500/10 text-focusflow-700 dark:text-focusflow-400'
  return roleAvatarClass(m?.role || 'member')
}

function riskBarColor(score: number | null): string {
  if (score === null) return 'bg-gray-300 dark:bg-gray-600'
  if (score <= 30) return 'bg-focusflow-500'
  if (score <= 60) return 'bg-amber-400'
  return 'bg-rose-500'
}

function riskTextColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score <= 30) return 'text-focusflow-600 dark:text-focusflow-400'
  if (score <= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function riskBadgeClass(score: number): string {
  if (score <= 30) return 'bg-focusflow-50 dark:bg-focusflow-500/10 text-focusflow-700 dark:text-focusflow-400'
  if (score <= 60) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
  return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
}

function riskStrokeColor(score: number | null): string {
  if (score === null) return '#d1d5db'
  if (score <= 30) return '#14b8a6' // focusflow-500
  if (score <= 60) return '#fbbf24' // amber-400
  return '#f43f5e' // rose-500
}

function getMetrics(pm: any) {
  return [
    { label: t.value.overdueRate, value: pm.overdue_rate, desc: t.value.overdueRateDesc },
    { label: t.value.lateCompletionRate, value: pm.late_completion_rate, desc: t.value.lateCompletionRateDesc },
    { label: t.value.stagnationScore, value: pm.stagnation_score, desc: t.value.stagnationScoreDesc },
    { label: t.value.effortGap, value: pm.effort_gap, desc: t.value.effortGapDesc },
    ...(pm.quiz_score !== null ? [{ label: t.value.quizScore, value: pm.quiz_score, desc: t.value.quizScoreDesc }] : []),
  ]
}

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>
