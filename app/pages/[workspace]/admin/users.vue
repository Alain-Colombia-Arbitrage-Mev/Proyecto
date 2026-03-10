<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <div class="flex items-center gap-2 mb-1">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <UIcon name="i-heroicons-shield-exclamation" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ t.adminPanel }}</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.adminPanelDesc }}</p>
        </div>
      </div>
    </div>

    <!-- Access denied -->
    <div v-if="!auth.isSuperadmin" class="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-8 text-center">
      <UIcon name="i-heroicons-shield-exclamation" class="w-12 h-12 text-red-400 mx-auto mb-3" />
      <p class="text-sm font-medium text-red-700 dark:text-red-400">Superadmin access required</p>
    </div>

    <template v-else>
      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.totalUsers }}</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.activeToday }}</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ stats.activeToday }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.withWorkspace }}</p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ stats.withWorkspace }}</p>
        </div>
        <div class="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-xl p-4">
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ t.noWorkspace }}</p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ stats.noWorkspace }}</p>
        </div>
      </div>

      <!-- Search -->
      <div class="relative">
        <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
        <input
          v-model="search"
          :placeholder="t.searchUsers"
          class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-focusflow-500/40 transition-all"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <div class="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-focusflow-500 rounded-full animate-spin" />
          <span class="text-sm">{{ t.loadingUsers }}</span>
        </div>
      </div>

      <!-- Users table -->
      <div v-else-if="filteredUsers.length > 0" class="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <!-- Desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-white/[0.06]">
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">Email</th>
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.workspacesLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.membersLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.projectsLabel }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.tasksAssigned }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.completed }}</th>
                <th class="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.lastLogin }}</th>
                <th class="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3">{{ t.actions }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="u in paginatedUsers"
                :key="u.id"
                class="border-b border-gray-50 dark:border-white/[0.04] last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                :class="expandedUser === u.id ? 'bg-focusflow-50/30 dark:bg-focusflow-500/5' : ''"
              >
                <td class="px-4 py-3">
                  <button class="flex items-center gap-2.5 cursor-pointer group" @click="toggleExpand(u.id)">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      :class="u.totalWorkspaces > 0 ? 'bg-focusflow-100 dark:bg-focusflow-500/15 text-focusflow-700 dark:text-focusflow-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'"
                    >
                      {{ u.email.slice(0, 2).toUpperCase() }}
                    </div>
                    <div class="min-w-0 text-left">
                      <p class="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[220px] group-hover:text-focusflow-600 dark:group-hover:text-focusflow-400 transition-colors">{{ u.email }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ t.registeredOn }} {{ formatDate(u.created_at) }}</p>
                    </div>
                    <UIcon
                      name="i-heroicons-chevron-right-20-solid"
                      class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0 transition-transform duration-200"
                      :class="expandedUser === u.id ? 'rotate-90' : ''"
                    />
                  </button>
                  <!-- Expanded workspace details -->
                  <Transition name="expand">
                    <div v-if="expandedUser === u.id && u.workspaces.length > 0" class="mt-2 ml-10 space-y-1.5">
                      <div
                        v-for="ws in u.workspaces"
                        :key="ws.id"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
                      >
                        <div class="w-6 h-6 rounded-md bg-focusflow-500/10 flex items-center justify-center shrink-0">
                          <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5 text-focusflow-500" />
                        </div>
                        <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{{ ws.name }}</span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          :class="roleBadge(ws.role)">{{ ws.role }}</span>
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 ml-auto mr-2">{{ ws.memberCount }} {{ t.membersLabel.toLowerCase() }} / {{ ws.projectCount }} {{ t.projectsLabel.toLowerCase() }}</span>
                        <!-- Manage projects button -->
                        <button
                          class="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0"
                          @click.stop="openManageProjects(u, ws)"
                        >
                          {{ t.projectsLabel }}
                        </button>
                        <NuxtLink
                          v-if="ws.slug"
                          :to="`/${ws.slug}/dashboard`"
                          class="text-[10px] font-semibold text-focusflow-600 dark:text-focusflow-400 bg-focusflow-50 dark:bg-focusflow-500/10 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 px-2 py-1 rounded-md transition-colors shrink-0"
                        >
                          {{ lang.language.value === 'en' ? 'Enter' : 'Entrar' }}
                        </NuxtLink>
                      </div>
                    </div>
                  </Transition>
                </td>
                <td class="px-4 py-3 text-center">
                  <span v-if="u.totalWorkspaces > 0" class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5" />
                    {{ u.totalWorkspaces }}
                  </span>
                  <span v-else class="text-[10px] text-gray-500 dark:text-gray-400">&mdash;</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ totalMembers(u) }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ totalProjects(u) }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs font-semibold" :class="u.tasks.total > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'">{{ u.tasks.total }}</span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div v-if="u.tasks.total > 0" class="flex items-center justify-center gap-1.5">
                    <div class="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${Math.round((u.tasks.completed / u.tasks.total) * 100)}%` }" />
                    </div>
                    <span class="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{{ u.tasks.completed }}</span>
                  </div>
                  <span v-else class="text-[10px] text-gray-500 dark:text-gray-400">&mdash;</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-[11px]" :class="isRecentLogin(u.last_sign_in_at) ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-500 dark:text-gray-400'">
                    {{ u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : t.never }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    class="inline-flex items-center gap-1 text-[10px] font-semibold text-focusflow-600 dark:text-focusflow-400 bg-focusflow-50 dark:bg-focusflow-500/10 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    @click="openAssignWorkspace(u)"
                  >
                    <UIcon name="i-heroicons-building-office-2" class="w-3.5 h-3.5" />
                    + Workspace
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
          <div
            v-for="u in paginatedUsers"
            :key="u.id"
            class="p-4 space-y-2"
          >
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                :class="u.totalWorkspaces > 0 ? 'bg-focusflow-100 dark:bg-focusflow-500/15 text-focusflow-700 dark:text-focusflow-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'"
              >
                {{ u.email.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ u.email }}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ t.registeredOn }} {{ formatDate(u.created_at) }}</p>
              </div>
              <span class="text-[10px] shrink-0" :class="isRecentLogin(u.last_sign_in_at) ? 'text-emerald-500 font-medium' : 'text-gray-500 dark:text-gray-400'">
                {{ u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : t.never }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-[10px] pl-11">
              <span class="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <UIcon name="i-heroicons-building-office" class="w-3 h-3" /> {{ u.totalWorkspaces }}
              </span>
              <span class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-3 h-3" /> {{ u.tasks.total }} {{ t.tasksAssigned.toLowerCase() }}
              </span>
              <span v-if="u.tasks.completed > 0" class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3" /> {{ u.tasks.completed }}
              </span>
            </div>

            <!-- Workspace pills -->
            <div v-if="u.workspaces.length > 0" class="flex flex-wrap gap-1 pl-11">
              <NuxtLink
                v-for="ws in u.workspaces"
                :key="ws.id"
                :to="ws.slug ? `/${ws.slug}/dashboard` : undefined"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-[9px] font-medium text-gray-600 dark:text-gray-400 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/10 hover:text-focusflow-600 dark:hover:text-focusflow-400 transition-colors"
              >
                {{ ws.name }}
                <span class="px-1 py-px rounded-full text-[8px] font-bold uppercase" :class="roleBadge(ws.role)">{{ ws.role }}</span>
              </NuxtLink>
            </div>

            <!-- Action buttons (mobile) -->
            <div class="flex gap-2 pl-11">
              <button
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-focusflow-600 dark:text-focusflow-400 bg-focusflow-50 dark:bg-focusflow-500/10 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                @click="openAssignWorkspace(u)"
              >
                <UIcon name="i-heroicons-building-office-2" class="w-3 h-3" />
                + Workspace
              </button>
              <button
                v-for="ws in u.workspaces"
                :key="'proj-' + ws.id"
                class="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                @click="openManageProjects(u, ws)"
              >
                <UIcon name="i-heroicons-folder" class="w-3 h-3" />
                {{ ws.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.06]">
          <p class="text-[10px] text-gray-500 dark:text-gray-400">
            {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredUsers.length) }} / {{ filteredUsers.length }}
          </p>
          <div class="flex items-center gap-1">
            <button
              :disabled="currentPage <= 1"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors cursor-pointer"
              @click="currentPage--"
            >
              <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            </button>
            <span class="text-xs font-medium text-gray-600 dark:text-gray-300 px-2">{{ currentPage }} / {{ totalPages }}</span>
            <button
              :disabled="currentPage >= totalPages"
              class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors cursor-pointer"
              @click="currentPage++"
            >
              <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
        <UIcon name="i-heroicons-users" class="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.noUsersFound }}</p>
      </div>
    </template>

    <!-- Assign to workspace modal -->
    <UModal v-model:open="showAssignWorkspace">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ t.addToWorkspace }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">{{ assignTargetUser?.email }}</p>

          <div class="space-y-4">
            <!-- Workspace select -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{{ t.selectWorkspace }}</label>
              <select
                v-model="assignWorkspaceId"
                class="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white focus:ring-2 focus:ring-focusflow-500/40 outline-none"
              >
                <option value="" disabled>{{ t.selectWorkspace }}...</option>
                <option
                  v-for="ws in availableWorkspacesForAssign"
                  :key="ws.id"
                  :value="ws.id"
                >
                  {{ ws.name }}
                </option>
              </select>
            </div>

            <!-- Role select -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{{ t.selectRole }}</label>
              <select
                v-model="assignRole"
                class="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white focus:ring-2 focus:ring-focusflow-500/40 outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="marketing">Marketing</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <!-- Project selection (for non-admin roles) -->
            <div v-if="!isAssignAdminPlus && selectedWorkspaceProjects.length > 0">
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{{ t.selectProjects }}</label>
              <div class="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg p-3">
                <label
                  v-for="project in selectedWorkspaceProjects"
                  :key="project.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    :value="project.id"
                    v-model="assignProjectIds"
                    class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
                  />
                  <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ project.name }}</span>
                </label>
              </div>
            </div>
            <p v-else-if="isAssignAdminPlus" class="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-lg px-3 py-2">
              {{ t.adminAutoAccessShort }}
            </p>

            <!-- Feedback -->
            <p v-if="assignError" class="text-sm text-red-600 bg-red-50 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2">{{ assignError }}</p>
            <p v-if="assignSuccess" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2">{{ assignSuccess }}</p>

            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showAssignWorkspace = false">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
              <UButton color="primary" :loading="assigningWorkspace" :disabled="!assignWorkspaceId" class="font-semibold" @click="handleAssignWorkspace">
                {{ t.addToWorkspace }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Manage project access modal -->
    <UModal v-model:open="showManageProjects">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1">{{ t.manageProjectAccess }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">{{ manageProjectsUser?.email }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-5 flex items-center gap-1.5">
            <UIcon name="i-heroicons-building-office" class="w-3.5 h-3.5" />
            {{ manageProjectsWorkspace?.name }}
            <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" :class="roleBadge(manageProjectsWorkspace?.role || '')">{{ manageProjectsWorkspace?.role }}</span>
          </p>

          <!-- Admin+ notice -->
          <div v-if="isManageAdminPlus" class="text-center py-8">
            <UIcon name="i-heroicons-shield-check" class="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t.adminAutoAccessShort }}</p>
          </div>

          <!-- Project checkboxes -->
          <template v-else>
            <div v-if="manageProjectsList.length > 0" class="space-y-1.5 max-h-64 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-lg p-3">
              <label
                v-for="project in manageProjectsList"
                :key="project.id"
                class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  :value="project.id"
                  v-model="manageProjectIds"
                  class="rounded border-gray-300 text-focusflow-600 focus:ring-focusflow-500"
                />
                <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: project.color }" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ project.name }}</span>
              </label>
            </div>
            <div v-else class="text-center py-6">
              <p class="text-sm text-gray-400 dark:text-gray-500">{{ t.noProjectsInWorkspace }}</p>
            </div>
          </template>

          <!-- Feedback -->
          <p v-if="manageProjectsError" class="text-sm text-red-600 bg-red-50 border border-red-100 dark:border-red-500/20 rounded-lg px-3 py-2 mt-3">{{ manageProjectsError }}</p>
          <p v-if="manageProjectsSuccess" class="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-2 mt-3">{{ manageProjectsSuccess }}</p>

          <div class="flex items-center justify-between pt-4">
            <button
              v-if="!isManageAdminPlus && manageProjectsList.length > 0"
              class="text-xs text-focusflow-600 hover:text-focusflow-700 font-medium cursor-pointer"
              @click="manageProjectIds = manageProjectsList.map(p => p.id)"
            >
              {{ lang.language.value === 'en' ? 'Select all' : 'Seleccionar todos' }}
            </button>
            <span v-else />
            <div class="flex gap-3">
              <UButton variant="ghost" @click="showManageProjects = false">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
              <UButton v-if="!isManageAdminPlus" color="primary" :loading="savingManagedProjects" class="font-semibold" @click="handleSaveManageProjects">
                {{ lang.language.value === 'en' ? 'Save' : 'Guardar' }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const auth = useAuthStore()
const store = useWorkspaceStore()
const lang = useLanguage()
const t = lang.labels

interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  workspaces: Array<{
    id: string
    name: string
    slug: string
    role: string
    memberCount: number
    projectCount: number
  }>
  tasks: { total: number; completed: number; in_progress: number }
  totalWorkspaces: number
}

interface AdminWorkspace {
  id: string
  name: string
  slug: string
  projects: Array<{ id: string; name: string; color: string }>
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const search = ref('')
const expandedUser = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 25

// All workspaces (for assignment)
const allWorkspaces = ref<AdminWorkspace[]>([])

// Assign to workspace modal
const showAssignWorkspace = ref(false)
const assignTargetUser = ref<AdminUser | null>(null)
const assignWorkspaceId = ref('')
const assignRole = ref('member')
const assignProjectIds = ref<string[]>([])
const assigningWorkspace = ref(false)
const assignError = ref('')
const assignSuccess = ref('')

// Manage project access modal
const showManageProjects = ref(false)
const manageProjectsUser = ref<AdminUser | null>(null)
const manageProjectsWorkspace = ref<{ id: string; name: string; role: string; memberId?: string } | null>(null)
const manageProjectIds = ref<string[]>([])
const manageProjectsList = ref<Array<{ id: string; name: string; color: string }>>([])
const savingManagedProjects = ref(false)
const manageProjectsError = ref('')
const manageProjectsSuccess = ref('')

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return users.value
  return users.value.filter(u => u.email.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

// Reset page on search
watch(search, () => { currentPage.value = 1 })

const stats = computed(() => {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  return {
    total: users.value.length,
    activeToday: users.value.filter(u => u.last_sign_in_at && (now - new Date(u.last_sign_in_at).getTime()) < dayMs).length,
    withWorkspace: users.value.filter(u => u.totalWorkspaces > 0).length,
    noWorkspace: users.value.filter(u => u.totalWorkspaces === 0).length,
  }
})

const isAssignAdminPlus = computed(() =>
  ['admin', 'owner', 'superadmin'].includes(assignRole.value),
)

const availableWorkspacesForAssign = computed(() => {
  if (!assignTargetUser.value) return allWorkspaces.value
  const userWsIds = new Set(assignTargetUser.value.workspaces.map(ws => ws.id))
  return allWorkspaces.value.filter(ws => !userWsIds.has(ws.id))
})

const selectedWorkspaceProjects = computed(() => {
  if (!assignWorkspaceId.value) return []
  const ws = allWorkspaces.value.find(w => w.id === assignWorkspaceId.value)
  return ws?.projects || []
})

const isManageAdminPlus = computed(() => {
  if (!manageProjectsWorkspace.value) return false
  return ['admin', 'owner', 'superadmin'].includes(manageProjectsWorkspace.value.role)
})

function toggleExpand(id: string) {
  expandedUser.value = expandedUser.value === id ? null : id
}

function totalMembers(u: AdminUser) {
  if (u.workspaces.length === 0) return 0
  return u.workspaces.reduce((sum, ws) => sum + ws.memberCount, 0)
}

function totalProjects(u: AdminUser) {
  if (u.workspaces.length === 0) return 0
  return u.workspaces.reduce((sum, ws) => sum + ws.projectCount, 0)
}

function roleBadge(role: string) {
  if (role === 'owner') return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
  if (role === 'admin') return 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
  if (role === 'superadmin') return 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400'
  return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(lang.language.value === 'en' ? 'en-US' : 'es-CO', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t.value.now || 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return `${months}mo`
}

function isRecentLogin(d: string | null) {
  if (!d) return false
  return (Date.now() - new Date(d).getTime()) < 24 * 60 * 60 * 1000
}

// ── Assign to workspace ──
function openAssignWorkspace(user: AdminUser) {
  assignTargetUser.value = user
  assignWorkspaceId.value = ''
  assignRole.value = 'member'
  assignProjectIds.value = []
  assignError.value = ''
  assignSuccess.value = ''
  showAssignWorkspace.value = true
}

async function handleAssignWorkspace() {
  if (!assignTargetUser.value || !assignWorkspaceId.value) return
  assignError.value = ''
  assignSuccess.value = ''
  assigningWorkspace.value = true

  try {
    await $fetch(`/api/workspaces/${assignWorkspaceId.value}/members`, {
      method: 'POST',
      body: {
        email: assignTargetUser.value.email,
        role: assignRole.value,
        project_ids: isAssignAdminPlus.value ? [] : assignProjectIds.value,
      },
    })

    const wsName = allWorkspaces.value.find(w => w.id === assignWorkspaceId.value)?.name || ''
    assignSuccess.value = `${assignTargetUser.value.email} ${t.value.addedToWorkspace} "${wsName}"`

    // Reload users to reflect changes
    await loadUsers()

    // Reset for next assignment
    assignWorkspaceId.value = ''
    assignProjectIds.value = []
  } catch (e: any) {
    assignError.value = e.data?.message || e.statusMessage || 'Error'
  } finally {
    assigningWorkspace.value = false
  }
}

// ── Manage project access ──
async function openManageProjects(user: AdminUser, ws: { id: string; name: string; role: string }) {
  manageProjectsUser.value = user
  manageProjectsWorkspace.value = { ...ws }
  manageProjectsError.value = ''
  manageProjectsSuccess.value = ''
  showManageProjects.value = true

  // Get projects for this workspace
  const wsData = allWorkspaces.value.find(w => w.id === ws.id)
  manageProjectsList.value = wsData?.projects || []

  // Get current member's project assignments
  try {
    const members = await $fetch<any[]>(`/api/workspaces/${ws.id}/members`)
    const member = members.find(m => m.user_id === user.id)
    if (member) {
      manageProjectsWorkspace.value!.memberId = member.id
      if (member.has_all_projects) {
        manageProjectIds.value = manageProjectsList.value.map(p => p.id)
      } else {
        manageProjectIds.value = member.project_ids || []
      }
    } else {
      manageProjectIds.value = []
    }
  } catch {
    manageProjectIds.value = []
  }
}

async function handleSaveManageProjects() {
  if (!manageProjectsWorkspace.value?.memberId) return
  savingManagedProjects.value = true
  manageProjectsError.value = ''
  manageProjectsSuccess.value = ''

  try {
    await $fetch(`/api/workspaces/${manageProjectsWorkspace.value.id}/members/${manageProjectsWorkspace.value.memberId}/projects`, {
      method: 'PUT',
      body: { project_ids: manageProjectIds.value },
    })
    manageProjectsSuccess.value = t.value.projectsUpdated
    await loadUsers()
  } catch (e: any) {
    manageProjectsError.value = e.data?.message || e.statusMessage || 'Error'
  } finally {
    savingManagedProjects.value = false
  }
}

// ── Load data ──
async function loadUsers() {
  if (!auth.isSuperadmin) return
  loading.value = true
  try {
    const data = await $fetch<{ total: number; users: AdminUser[] }>('/api/admin/users')
    users.value = data.users
  } catch (e) {
    console.error('Failed to load admin users:', e)
  }
  loading.value = false
}

async function loadWorkspaces() {
  if (!auth.isSuperadmin) return
  try {
    allWorkspaces.value = await $fetch<AdminWorkspace[]>('/api/admin/workspaces')
  } catch {
    allWorkspaces.value = []
  }
}

onMounted(() => {
  loadUsers()
  loadWorkspaces()
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to {
  max-height: 300px;
}
</style>
