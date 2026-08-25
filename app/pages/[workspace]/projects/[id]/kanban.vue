<template>
  <div class="relative">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 animate-fade-up flex-wrap gap-2">
      <div>
        <NuxtLink
          :to="`/${$route.params.workspace}/projects`"
          class="text-xs text-gray-500 hover:text-focusflow-700 dark:text-gray-400 dark:hover:text-focusflow-400 mb-1 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          {{ t.projects }}
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{{ project?.name || 'Kanban' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Full text on desktop -->
        <UButton v-if="canUseAI" size="sm" variant="soft" icon="i-heroicons-sparkles" @click="aiPanelRef?.handleSuggestTasks()" :loading="aiPanelRef?.aiLoading" class="font-medium hidden sm:inline-flex">
          {{ t.aiSuggestions }}
        </UButton>
        <UButton v-if="canUseAI" size="sm" variant="soft" color="success" icon="i-heroicons-bolt" @click="aiPanelRef?.handleAntiProcrastination()" :loading="aiPanelRef?.aiLoading" class="font-medium hidden sm:inline-flex">
          {{ t.antiProcrastination }}
        </UButton>
        <UButton v-if="canImportTasks" size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" @click="showImportModal = true" class="font-medium hidden sm:inline-flex">
          {{ t.import }}
        </UButton>
        <UButton
          size="sm"
          :variant="focusMode ? 'solid' : 'outline'"
          :color="focusMode ? 'primary' : 'neutral'"
          icon="i-heroicons-viewfinder-circle"
          class="font-medium hidden sm:inline-flex"
          @click="toggleFocusMode"
        >
          {{ t.focusMode }}
        </UButton>
        <!-- Icon-only on mobile -->
        <UButton v-if="canUseAI" size="sm" variant="soft" icon="i-heroicons-sparkles" @click="aiPanelRef?.handleSuggestTasks()" :loading="aiPanelRef?.aiLoading" class="sm:hidden" />
        <UButton v-if="canUseAI" size="sm" variant="soft" color="success" icon="i-heroicons-bolt" @click="aiPanelRef?.handleAntiProcrastination()" :loading="aiPanelRef?.aiLoading" class="sm:hidden" />
        <UButton v-if="canImportTasks" size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" @click="showImportModal = true" class="sm:hidden" />
        <UButton size="sm" :variant="focusMode ? 'solid' : 'outline'" :color="focusMode ? 'primary' : 'neutral'" icon="i-heroicons-viewfinder-circle" class="sm:hidden" @click="toggleFocusMode" />
      </div>
    </div>

    <!-- Stat Cards Row (hidden in focus mode) -->
    <div v-show="!focusMode" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-up">
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{{ language === 'en' ? 'Total Tasks' : 'Tareas Totales' }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ tasks.length }}</span>
          <div class="flex items-end gap-[2px] h-[32px]">
            <div v-for="(col, ci) in columns.slice(0, 6)" :key="'st-'+ci" class="w-[5px] rounded-sm"
              :style="{ height: `${Math.max(tasksByColumn(col.id).length / Math.max(tasks.length, 1) * 100, 8)}%`, backgroundColor: col.color || '#10B981' }" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{{ t.inProgress }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ inProgressCount }}</span>
          <div class="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{{ t.dueToday }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold leading-none tabular-nums" :class="dueTodayCount > 0 ? 'text-red-600' : 'text-[#0D0D0D] dark:text-gray-100'" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ dueTodayCount }}</span>
          <div class="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{{ t.completed }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#10B981] leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ completedCount }}</span>
          <div class="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tablero header bar -->
    <div class="flex items-center justify-between mb-4 animate-fade-up flex-wrap gap-2">
      <div class="flex items-center gap-3">
        <h2 class="text-[16px] font-semibold text-[#0D0D0D] dark:text-gray-100">{{ t.board }}</h2>
        <!-- View toggle -->
        <div class="flex items-center bg-gray-100 dark:bg-white/10 rounded-lg p-0.5">
          <button
            class="text-xs font-medium px-2.5 py-2 rounded-md transition-all cursor-pointer"
            :class="viewMode === 'columns' ? 'bg-white dark:bg-white/15 text-[#0D0D0D] dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="setViewMode('columns')"
          >
            <UIcon name="i-heroicons-view-columns" class="w-4 h-4" />
          </button>
          <button
            class="text-xs font-medium px-2.5 py-2 rounded-md transition-all cursor-pointer"
            :class="viewMode === 'list' ? 'bg-white dark:bg-white/15 text-[#0D0D0D] dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="setViewMode('list')"
          >
            <UIcon name="i-heroicons-bars-3" class="w-4 h-4" />
          </button>
        </div>
        <LanguageToggle />
        <!-- Bulk delete -->
        <button
          v-if="canDeleteTasks && tasks.length > 0"
          class="text-xs font-medium px-3.5 py-2 rounded-full transition-all cursor-pointer text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
          @click="handleDeleteAllTasks"
        >
          <span class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
            {{ language === 'en' ? 'Delete all' : 'Borrar todo' }}
          </span>
        </button>
        <!-- Kanban filter -->
        <button
          class="text-xs font-medium px-3.5 py-2 rounded-full transition-all cursor-pointer"
          :class="showKanbanFilter ? 'bg-[#0D0D0D] dark:bg-white/20 text-white' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15'"
          @click="showKanbanFilter = !showKanbanFilter"
        >
          <span class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-funnel" class="w-3.5 h-3.5" />
            {{ t.filters }}
          </span>
        </button>
      </div>
      <button
        v-if="canCreateTasks"
        class="bg-[#10B981] hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        @click="openAddTask(columns[0]?.id || '')"
      >
        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        {{ t.createTask }}
      </button>
    </div>

    <!-- Kanban filters row -->
    <div v-if="showKanbanFilter" class="flex items-center gap-2 mb-4 animate-fade-up flex-wrap">
      <div class="relative min-w-[220px] flex-1 sm:flex-none">
        <UIcon name="i-heroicons-magnifying-glass" class="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="kanbanSearch"
          type="search"
          :placeholder="language === 'en' ? 'Search tasks, tags, owners...' : 'Buscar tareas, tags, responsables...'"
          class="w-full sm:w-[260px] text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-full pl-8 pr-3 py-2 border-0 outline-none focus:ring-2 focus:ring-focusflow-300/60"
        />
      </div>
      <select
        v-model="kanbanFilterPriority"
        class="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-2 border-0 outline-none cursor-pointer"
      >
        <option value="">{{ t.priority }}</option>
        <option value="critical">{{ t.priorityCritical }}</option>
        <option value="high">{{ t.priorityHigh }}</option>
        <option value="medium">{{ t.priorityMedium }}</option>
        <option value="low">{{ t.priorityLow }}</option>
      </select>
      <select
        v-model="kanbanFilterAssignee"
        class="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-2 border-0 outline-none cursor-pointer"
      >
        <option value="">{{ t.assignedTo }}</option>
        <option v-for="m in workspaceMembers" :key="m.user_id" :value="m.user_id">{{ m.email || m.user_id.slice(0, 12) }}</option>
      </select>
      <select
        v-model="kanbanFilterDue"
        class="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-full px-3 py-2 border-0 outline-none cursor-pointer"
      >
        <option value="">{{ language === 'en' ? 'Any due date' : 'Cualquier fecha' }}</option>
        <option value="overdue">{{ language === 'en' ? 'Overdue' : 'Atrasadas' }}</option>
        <option value="today">{{ language === 'en' ? 'Due today' : 'Vencen hoy' }}</option>
        <option value="week">{{ language === 'en' ? 'Next 7 days' : 'Próximos 7 días' }}</option>
        <option value="none">{{ language === 'en' ? 'No due date' : 'Sin fecha' }}</option>
      </select>
      <button
        v-if="kanbanSearch || kanbanFilterPriority || kanbanFilterAssignee || kanbanFilterDue"
        class="text-[11px] text-red-500 font-medium cursor-pointer hover:text-red-700"
        @click="clearTaskFilters"
      >
        {{ t.clear }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loadingBoard }}</span>
      </div>
    </div>

    <!-- Kanban Board (Columns View) -->
    <div v-else-if="viewMode === 'columns'" class="kanban-scroll flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 md:-mx-8 md:px-8 min-h-[50vh] animate-fade-up delay-100 snap-x snap-mandatory md:snap-none">
      <div
        v-for="column in columns"
        :key="column.id"
        class="flex flex-col w-[75vw] min-w-[256px] md:w-72 md:min-w-[288px] shrink-0 snap-center md:snap-align-none"
        :class="isWipExceeded(column) ? 'ring-2 ring-red-300 rounded-xl bg-red-50/30 dark:bg-red-500/10' : ''"
      >
        <!-- Column header -->
        <div
          class="flex items-center justify-between mb-3 px-3 py-2 rounded-xl group/col"
          :style="{ backgroundColor: columnBgColor(column.color), borderLeft: `3px solid ${column.color}` }"
        >
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-white/20" :style="{ backgroundColor: column.color }" />
            <h3 class="font-bold text-xs uppercase tracking-wider" :style="{ color: column.color }">{{ column.title }}</h3>
            <span
              class="text-[10px] rounded-full px-1.5 py-0.5 font-semibold tabular-nums"
              :style="{ backgroundColor: column.color + '20', color: column.color }"
            >
              {{ filteredTasksByColumn(column.id).length }}
              <span v-if="column.wip_limit" :style="{ color: column.color + '99' }">/{{ column.wip_limit }}</span>
            </span>
          </div>
          <div class="flex items-center gap-0.5">
            <button
              v-if="canDeleteTasks && filteredTasksByColumn(column.id).length > 0"
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
              @click="handleClearColumn(column)"
              :title="language === 'en' ? 'Clear all tasks in column' : 'Vaciar tareas de la columna'"
            >
              <UIcon name="i-heroicons-archive-box-x-mark" class="w-3.5 h-3.5" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
              @click="openEditColumn(column)"
              :title="t.editColumn"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
              @click="handleDeleteColumn(column)"
              :title="t.deleteColumn"
            >
              <UIcon name="i-heroicons-trash" class="w-3 h-3" />
            </button>
            <button
              v-if="canCreateTasks"
              class="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/50 transition-all"
              :style="{ color: column.color }"
              @click="openAddTask(column.id)"
            >
              <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Tasks list -->
        <div
          class="flex-1 space-y-2 bg-gray-50/80 dark:bg-white/5 rounded-xl p-2 min-h-[120px] transition-colors"
          :class="dragOverColumn === column.id ? 'ring-2 ring-focusflow-300 bg-focusflow-50/50' : ''"
          @dragover.prevent="dragOverColumn = column.id"
          @dragleave="dragOverColumn = ''"
          @drop="onDrop($event, column.id)"
        >
          <div
            v-for="task in filteredTasksByColumn(column.id)"
            :key="task.id"
            draggable="true"
            class="group/card bg-white dark:bg-[#1b1b1b] rounded-xl p-2.5 sm:p-3.5 cursor-grab active:cursor-grabbing border border-gray-200/70 dark:border-white/10 hover:border-focusflow-200 dark:hover:border-focusflow-500/30 transition-all duration-200 shadow-card hover:shadow-card-hover active:scale-[0.98] relative overflow-hidden"
            :class="taskAgingClass(task)"
            :style="task.color ? { borderLeftWidth: '4px', borderLeftColor: task.color } : {}"
            @dragstart="onDragStart($event, task)"
            @click="openTaskDetail(task)"
          >
            <!-- Card quick actions -->
            <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
              <button
                v-if="canDeleteTasks"
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 sm:opacity-0 sm:group-hover/card:opacity-100"
                :title="t.deleteTask"
                @click.stop="handleDeleteTask(task)"
              >
                <UIcon name="i-heroicons-trash" class="w-3 h-3" />
              </button>
              <button
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:text-purple-600 sm:opacity-0 sm:group-hover/card:opacity-100"
                :title="language === 'en' ? 'Delegate to AI Agent' : 'Delegar a Agente AI'"
                @click.stop="openDelegateModal(task)"
              >
                <UIcon name="i-heroicons-cpu-chip" class="w-3 h-3" />
              </button>
              <button
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                :class="pomodoro.activeTask.value?.id === task.id
                  ? 'bg-emerald-100 text-emerald-600 opacity-100'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 hover:text-focusflow-600 sm:opacity-0 sm:group-hover/card:opacity-100'"
                :title="pomodoro.activeTask.value?.id === task.id ? `Pomodoro: ${pomodoro.display.value}` : t.startPomodoro"
                @click.stop="pomodoro.startForTask({ id: task.id, title: task.title }, workspaceId)"
              >
                <UIcon name="i-heroicons-clock" class="w-3 h-3" />
              </button>
              <button
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-600 sm:opacity-0 sm:group-hover/card:opacity-100"
                :title="language === 'en' ? 'Hyperfocus Mode (50/10 + music)' : 'Modo Hiperenfoque (50/10 + música)'"
                @click.stop="pomodoro.startHyperfocus({ id: task.id, title: task.title }, workspaceId)"
              >
                <UIcon name="i-heroicons-bolt-solid" class="w-3 h-3" />
              </button>
            </div>
            <!-- Labels row -->
            <div v-if="task.labels?.length" class="flex flex-wrap gap-1 mb-1.5">
              <span
                v-for="label in task.labels.slice(0, 3)"
                :key="label.id"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                :style="{ backgroundColor: label.color + '20', color: label.color }"
              >
                {{ label.name }}
              </span>
              <span v-if="task.labels.length > 3" class="text-[9px] text-gray-500 dark:text-gray-400 px-1 py-0.5">+{{ task.labels.length - 3 }}</span>
            </div>

            <!-- Tags row -->
            <div v-if="task.tags?.length" class="flex flex-wrap gap-1 mb-2">
              <span
                v-for="tag in task.tags.slice(0, 3)"
                :key="tag"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                :style="{ backgroundColor: tagColor(tag) + '18', color: tagColor(tag) }"
              >
                #{{ tag }}
              </span>
              <span v-if="task.tags.length > 3" class="text-[9px] text-gray-500 dark:text-gray-400 px-1 py-0.5">+{{ task.tags.length - 3 }}</span>
            </div>

            <!-- Priority + title -->
            <div class="flex items-start gap-2 mb-1.5">
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                :class="{
                  'bg-red-500 animate-pulse-dot': task.priority === 'critical',
                  'bg-orange-400': task.priority === 'high',
                  'bg-blue-400': task.priority === 'medium',
                  'bg-gray-300 dark:bg-gray-600': task.priority === 'low',
                }"
              />
              <p class="text-[13px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">{{ localizedTitle(task) }}</p>
            </div>

            <!-- AI Agent badge -->
            <div v-if="task.ai_agent" class="mb-1.5">
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                <UIcon name="i-heroicons-cpu-chip" class="w-2.5 h-2.5" />
                {{ task.ai_agent }}
              </span>
            </div>

            <!-- Description preview -->
            <p v-if="localizedDescription(task)" class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2 line-clamp-2">{{ htmlToPlainText(localizedDescription(task)).slice(0, 100) }}</p>

            <!-- Time progress bar -->
            <div v-if="getTaskProgress(task.due_date, task.created_at, task.estimated_hours)" class="mb-2.5">
              <div class="flex items-center gap-2 mb-0.5">
                <div class="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-700 ease-out"
                    :style="{
                      width: getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.percent + '%',
                      backgroundColor: getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.color,
                    }"
                  />
                </div>
                <span class="text-[9px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                  {{ getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.label }}
                </span>
              </div>
            </div>

            <!-- Bottom: deadline + priority + assignees -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-wrap">
                <span v-if="task.due_date && getDeadlineInfo(task.due_date)"
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                  :class="getDeadlineInfo(task.due_date)!.bgClass + ' ' + getDeadlineInfo(task.due_date)!.colorClass">
                  <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                  {{ getDeadlineInfo(task.due_date)!.label }}
                </span>
                <span v-else-if="task.due_date" class="text-[10px] flex items-center gap-1 font-medium text-gray-500 dark:text-gray-400">
                  <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
                  {{ formatDate(task.due_date) }}
                </span>
                <span
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                  :class="{
                    'bg-red-50 dark:bg-red-500/10 text-red-600': task.priority === 'critical' || task.priority === 'high',
                    'bg-blue-50 dark:bg-blue-500/10 text-blue-600': task.priority === 'medium',
                    'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400': task.priority === 'low',
                  }"
                >
                  {{ { critical: t.priorityCritical, high: t.priorityHigh, medium: t.priorityMedium, low: t.priorityLow }[task.priority] || task.priority }}
                </span>
              </div>
              <!-- Assignee avatars -->
              <div v-if="task.assignees?.length" class="flex -space-x-1.5">
                <div
                  v-for="uid in task.assignees.slice(0, 3)"
                  :key="uid"
                  class="w-5 h-5 rounded-full bg-focusflow-100 dark:bg-focusflow-500/20 text-focusflow-700 dark:text-focusflow-400 flex items-center justify-center text-[8px] font-bold ring-2 ring-white dark:ring-[#1b1b1b]"
                  :title="getMemberEmail(uid)"
                >
                  {{ getMemberInitials(uid) }}
                </div>
                <div
                  v-if="task.assignees.length > 3"
                  class="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[8px] font-bold ring-2 ring-white dark:ring-[#1b1b1b]"
                >
                  +{{ task.assignees.length - 3 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Drop hint -->
          <div
            v-if="filteredTasksByColumn(column.id).length === 0"
            class="flex items-center justify-center h-24 border border-dashed border-gray-300 dark:border-white/10 rounded-xl bg-white/50 dark:bg-transparent"
          >
            <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium"><span class="hidden sm:inline">{{ t.noTasksDrag }}</span><span class="sm:hidden">{{ t.noTasksMobile }}</span></p>
          </div>
        </div>

        <!-- Quick add -->
        <button
          v-if="canCreateTasks"
          class="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 hover:bg-focusflow-50/50 dark:hover:bg-focusflow-500/10 rounded-xl transition-all"
          @click="openAddTask(column.id)"
        >
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          {{ language === 'en' ? 'Add' : 'Agregar' }}
        </button>
      </div>

      <!-- Add Column button -->
      <div class="flex flex-col w-64 min-w-[256px] md:w-72 md:min-w-[288px] shrink-0">
        <div v-if="!showAddColumn" class="flex-1 flex items-start">
          <button
            class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-focusflow-300 dark:hover:border-focusflow-500/30 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 transition-all cursor-pointer"
            @click="showAddColumn = true"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            {{ language === 'en' ? 'Add column' : 'Agregar columna' }}
          </button>
        </div>
        <div v-else class="bg-white dark:bg-[#1b1b1b] rounded-xl p-4 border border-gray-200/80 dark:border-white/10 shadow-card">
          <form @submit.prevent="handleAddColumn" class="space-y-3">
            <UInput v-model="newColumnTitle" :placeholder="t.columnName" required class="w-full" size="sm" autofocus />
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">{{ language === 'en' ? 'Color:' : 'Color:' }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in columnColors"
                  :key="c"
                  type="button"
                  class="w-5 h-5 rounded-full border-2 transition-all cursor-pointer"
                  :class="newColumnColor === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'"
                  :style="{ backgroundColor: c }"
                  @click="newColumnColor = c"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <UButton type="submit" size="xs" color="primary" :loading="addingColumn" class="font-semibold">{{ t.create }}</UButton>
              <UButton size="xs" variant="ghost" @click="showAddColumn = false">{{ t.cancel }}</UButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="!loading && viewMode === 'list'" class="animate-fade-up delay-100">
      <div class="space-y-3">
        <!-- Work OS controls -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 p-3.5">
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 min-w-[220px]">
              <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                v-model="kanbanSearch"
                type="search"
                :placeholder="language === 'en' ? 'Search tasks, tags, owners...' : 'Buscar tareas, tags, responsables...'"
                class="w-full text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-focusflow-300/60"
              />
            </div>
            <select v-model="kanbanFilterDue" class="workos-select">
              <option value="">{{ language === 'en' ? 'Any due date' : 'Cualquier fecha' }}</option>
              <option value="overdue">{{ language === 'en' ? 'Overdue' : 'Atrasadas' }}</option>
              <option value="today">{{ language === 'en' ? 'Due today' : 'Vencen hoy' }}</option>
              <option value="week">{{ language === 'en' ? 'Next 7 days' : 'Próximos 7 días' }}</option>
              <option value="none">{{ language === 'en' ? 'No due date' : 'Sin fecha' }}</option>
            </select>
            <select v-model="listGroupBy" class="workos-select">
              <option value="column">{{ language === 'en' ? 'Group: Status' : 'Grupo: Estado' }}</option>
              <option value="priority">{{ language === 'en' ? 'Group: Priority' : 'Grupo: Prioridad' }}</option>
              <option value="assignee">{{ language === 'en' ? 'Group: Owner' : 'Grupo: Responsable' }}</option>
              <option value="none">{{ language === 'en' ? 'No groups' : 'Sin grupos' }}</option>
            </select>
            <select v-model="listSortBy" class="workos-select">
              <option value="position">{{ language === 'en' ? 'Sort: Board order' : 'Orden: Tablero' }}</option>
              <option value="due_date">{{ language === 'en' ? 'Sort: Due date' : 'Orden: Fecha' }}</option>
              <option value="priority">{{ language === 'en' ? 'Sort: Priority' : 'Orden: Prioridad' }}</option>
              <option value="updated_at">{{ language === 'en' ? 'Sort: Recent activity' : 'Orden: Actividad' }}</option>
              <option value="title">{{ language === 'en' ? 'Sort: Name' : 'Orden: Nombre' }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <div class="rounded-lg bg-gray-50 dark:bg-white/5 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">{{ language === 'en' ? 'Visible' : 'Visibles' }}</p>
              <p class="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{{ allFilteredTasks.length }}</p>
            </div>
            <div class="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-red-400">{{ language === 'en' ? 'Overdue' : 'Atrasadas' }}</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-300 tabular-nums">{{ overdueVisibleCount }}</p>
            </div>
            <div class="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-amber-500">{{ language === 'en' ? 'Unassigned' : 'Sin responsable' }}</p>
              <p class="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">{{ unassignedVisibleCount }}</p>
            </div>
            <div class="rounded-lg bg-focusflow-50 dark:bg-focusflow-500/10 px-3 py-2">
              <p class="text-[10px] font-bold uppercase tracking-wider text-focusflow-600 dark:text-focusflow-300">{{ language === 'en' ? 'Estimated' : 'Estimado' }}</p>
              <p class="text-lg font-bold text-focusflow-700 dark:text-focusflow-300 tabular-nums">{{ visibleEstimatedHours }}h</p>
            </div>
          </div>
        </div>

        <!-- Bulk action bar -->
        <div
          v-if="selectedTaskIds.length > 0"
          class="bg-[#0d0d0d] dark:bg-white/10 text-white rounded-[15px] px-3.5 py-3 flex flex-wrap items-center gap-2"
        >
          <span class="text-xs font-bold mr-1">{{ selectedTaskIds.length }} {{ language === 'en' ? 'selected' : 'seleccionadas' }}</span>
          <select v-model="bulkColumnId" class="bulk-select" @change="applyBulkColumn">
            <option value="">{{ language === 'en' ? 'Move to status' : 'Mover a estado' }}</option>
            <option v-for="column in columns" :key="'bulk-col-'+column.id" :value="column.id">{{ column.title }}</option>
          </select>
          <select v-model="bulkPriority" class="bulk-select" @change="applyBulkPriority">
            <option value="">{{ language === 'en' ? 'Set priority' : 'Cambiar prioridad' }}</option>
            <option value="critical">{{ t.priorityCritical }}</option>
            <option value="high">{{ t.priorityHigh }}</option>
            <option value="medium">{{ t.priorityMedium }}</option>
            <option value="low">{{ t.priorityLow }}</option>
          </select>
          <select v-model="bulkAssignee" class="bulk-select" @change="applyBulkAssignee">
            <option value="">{{ language === 'en' ? 'Assign owner' : 'Asignar responsable' }}</option>
            <option value="__none">{{ language === 'en' ? 'Clear owner' : 'Sin responsable' }}</option>
            <option v-for="member in workspaceMembers" :key="'bulk-member-'+member.user_id" :value="member.user_id">{{ member.email }}</option>
          </select>
          <button class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors" @click="selectedTaskIds = []">
            {{ t.clear }}
          </button>
          <button
            v-if="canDeleteTasks"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 text-red-100 hover:bg-red-500/30 transition-colors"
            @click="handleDeleteSelectedTasks"
          >
            {{ language === 'en' ? 'Delete selected' : 'Borrar seleccionadas' }}
          </button>
        </div>

        <!-- Work OS table -->
        <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-200/80 dark:border-white/10 overflow-hidden">
          <div class="overflow-x-auto">
            <div class="min-w-[1120px]">
              <div class="grid grid-cols-[42px_minmax(260px,2fr)_minmax(150px,0.9fr)_minmax(132px,0.8fr)_minmax(132px,0.8fr)_minmax(150px,0.9fr)_minmax(108px,0.6fr)_minmax(128px,0.7fr)_48px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                <label class="flex items-center">
                  <input type="checkbox" class="workos-checkbox" :checked="allVisibleSelected" @change="toggleAllVisibleTasks" />
                </label>
                <span>{{ language === 'en' ? 'Task' : 'Tarea' }}</span>
                <span>{{ language === 'en' ? 'Status' : 'Estado' }}</span>
                <span>{{ t.deadline }}</span>
                <span>{{ t.priority }}</span>
                <span>{{ language === 'en' ? 'Owner' : 'Responsable' }}</span>
                <span>{{ language === 'en' ? 'Estimate' : 'Estimado' }}</span>
                <span>{{ language === 'en' ? 'Progress' : 'Progreso' }}</span>
                <span class="w-8" />
              </div>

              <template v-for="group in listTaskGroups" :key="'list-group-'+group.id">
                <div
                  v-if="group.tasks.length > 0"
                  class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50 dark:border-white/5"
                  :style="{ color: group.color, backgroundColor: group.color + '08' }"
                >
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: group.color }" />
                    {{ group.title }} ({{ group.tasks.length }})
                  </span>
                </div>

                <div
                  v-for="task in group.tasks"
                  :key="'lt-'+task.id"
                  class="grid grid-cols-[42px_minmax(260px,2fr)_minmax(150px,0.9fr)_minmax(132px,0.8fr)_minmax(132px,0.8fr)_minmax(150px,0.9fr)_minmax(108px,0.6fr)_minmax(128px,0.7fr)_48px] px-4 py-2.5 text-[12px] border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group/row"
                  :class="isTaskSaving(task.id) ? 'opacity-70' : ''"
                  draggable="true"
                  @dragstart="onDragStart($event, task)"
                  @click="openTaskDetail(task)"
                >
                  <label class="flex items-center" @click.stop>
                    <input
                      type="checkbox"
                      class="workos-checkbox"
                      :checked="selectedTaskIds.includes(task.id)"
                      @change="toggleTaskSelection(task.id, $event)"
                    />
                  </label>

                  <div class="flex items-center gap-2 min-w-0">
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      :class="{
                        'bg-red-500': task.priority === 'critical',
                        'bg-orange-400': task.priority === 'high',
                        'bg-blue-400': task.priority === 'medium',
                        'bg-gray-300 dark:bg-gray-600': task.priority === 'low',
                      }"
                    />
                    <div class="min-w-0">
                      <span class="block text-gray-900 dark:text-gray-100 font-medium truncate">{{ localizedTitle(task) }}</span>
                      <div v-if="task.labels?.length || task.tags?.length" class="mt-1 flex flex-wrap gap-1">
                        <span v-for="label in (task.labels || []).slice(0, 2)" :key="label.id" class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" :style="{ backgroundColor: label.color + '20', color: label.color }">
                          {{ label.name }}
                        </span>
                        <span v-for="tag in (task.tags || []).slice(0, 2)" :key="tag" class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md" :style="{ backgroundColor: tagColor(tag) + '18', color: tagColor(tag) }">
                          #{{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <select
                    class="workos-cell-select"
                    :value="task.column_id || ''"
                    @click.stop
                    @change="handleInlineColumnChange(task, $event)"
                  >
                    <option v-for="column in columns" :key="'row-col-'+task.id+'-'+column.id" :value="column.id">{{ column.title }}</option>
                  </select>

                  <input
                    type="date"
                    class="workos-cell-input"
                    :value="toDateInput(task.due_date)"
                    @click.stop
                    @change="handleInlineDueDateChange(task, $event)"
                  />

                  <select
                    class="workos-cell-select"
                    :value="task.priority"
                    @click.stop
                    @change="handleInlinePriorityChange(task, $event)"
                  >
                    <option value="critical">{{ t.priorityCritical }}</option>
                    <option value="high">{{ t.priorityHigh }}</option>
                    <option value="medium">{{ t.priorityMedium }}</option>
                    <option value="low">{{ t.priorityLow }}</option>
                  </select>

                  <div class="flex items-center gap-1.5 min-w-0" @click.stop>
                    <select
                      class="workos-cell-select min-w-0 flex-1"
                      :value="firstAssignee(task) || ''"
                      @change="handleInlineAssigneeChange(task, $event)"
                    >
                      <option value="">{{ language === 'en' ? 'Unassigned' : 'Sin responsable' }}</option>
                      <option v-for="member in workspaceMembers" :key="'row-member-'+task.id+'-'+member.user_id" :value="member.user_id">{{ member.email }}</option>
                    </select>
                    <span v-if="(task.assignees || []).length > 1" class="text-[10px] text-gray-400 shrink-0">+{{ task.assignees!.length - 1 }}</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    class="workos-cell-input"
                    :value="task.estimated_hours ?? ''"
                    :placeholder="language === 'en' ? 'Hours' : 'Horas'"
                    @click.stop
                    @change="handleInlineEstimateChange(task, $event)"
                  />

                  <div class="flex items-center gap-2">
                    <div class="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex-1">
                      <div class="h-full rounded-full bg-focusflow-500 transition-all duration-300" :style="{ width: `${taskProgress(task)}%` }" />
                    </div>
                    <span class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums w-8">{{ taskProgress(task) }}%</span>
                  </div>

                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-focusflow-600 hover:bg-focusflow-50 dark:hover:bg-focusflow-500/10 transition-all opacity-0 group-hover/row:opacity-100"
                      :title="language === 'en' ? 'Open task' : 'Abrir tarea'"
                      @click.stop="openTaskDetail(task)"
                    >
                      <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                    </button>
                    <button
                      v-if="canDeleteTasks"
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover/row:opacity-100"
                      :title="t.deleteTask"
                      @click.stop="handleDeleteTask(task)"
                    >
                      <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </template>

              <div v-if="allFilteredTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-gray-300 mb-2" />
                <p class="text-[12px]">{{ t.noTasksMobile }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Panel (lazy-loaded) -->
    <LazyKanbanAIPanel
      ref="aiPanelRef"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :project="project"
      :columns="columns"
      :selected-task="selectedTask"
      :language="language"
      :t="t"
      @load-tasks="loadTasks"
    />

    <!-- Add Task Modal -->
    <LazyTaskCreateModal
      v-model:open="showAddTask"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :column-id="addToColumnId"
      :workspace-members="workspaceMembers"
      :columns="columns"
      @created="loadTasks"
    />

    <!-- Edit Column Modal -->
    <UModal v-model:open="showEditColumn">
      <template #content>
        <div class="p-6">
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5">{{ t.editColumn }}</h2>
          <form class="space-y-4" @submit.prevent="handleUpdateColumn">
            <UFormField :label="t.name">
              <UInput v-model="editColumnData.title" required class="w-full" size="lg" autofocus />
            </UFormField>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-gray-400">{{ language === 'en' ? 'Color:' : 'Color:' }}</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in columnColors"
                  :key="c"
                  type="button"
                  class="w-5 h-5 rounded-full border-2 transition-all cursor-pointer"
                  :class="editColumnData.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'"
                  :style="{ backgroundColor: c }"
                  @click="editColumnData.color = c"
                />
              </div>
            </div>
            <UFormField :label="language === 'en' ? 'WIP Limit (optional)' : 'Límite WIP (opcional)'">
              <UInput v-model="editColumnData.wip_limit" type="number" min="0" :placeholder="language === 'en' ? 'No limit' : 'Sin límite'" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showEditColumn = false">{{ t.cancel }}</UButton>
              <UButton type="submit" color="primary" :loading="savingColumn" class="font-semibold">{{ t.save }}</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Task Detail Slideover -->
    <LazyTaskDetailModal
      v-model:open="showTaskDetail"
      :task="selectedTask"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :workspace-members="workspaceMembers"
      :columns="columns"
      @updated="loadTasks"
      @deleted="loadTasks"
      @improve-with-a-i="aiPanelRef?.handleImproveTask()"
    />

    <!-- Delegate to AI Agent Modal -->
    <LazyTaskDelegateAgentModal
      v-if="delegateTask"
      v-model:open="showDelegateModal"
      :task-id="delegateTask.id"
      :task-title="delegateTask.title"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      @delegated="loadTasks"
    />

    <LazyTaskImportModal
      v-model:open="showImportModal"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :columns="columns.map(c => ({ id: c.id, title: c.title }))"
      @imported="loadProjectData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Project, KanbanColumn, Task, Label } from '~/types'
import { format, differenceInDays } from 'date-fns'
import { htmlToPlainText } from '~/utils/richtext'

definePageMeta({ middleware: 'auth' })

const { getDeadlineInfo, getEstimatedLabel, getTaskProgress } = useTaskDeadline()
const lang = useLanguage()
const { language, setLanguage: setLang, localizedTitle, localizedDescription } = lang
const t = lang.labels
const pomodoro = usePomodoroTimer()

const route = useRoute()
const store = useWorkspaceStore()
const { canCreateTasks, canDeleteTasks, canUseAI, canImportTasks } = usePermissions()

const project = ref<Project | null>(null)
const columns = ref<KanbanColumn[]>([])
const tasks = ref<Task[]>([])
const loading = ref(true)

const aiPanelRef = ref<InstanceType<typeof import('~/components/kanban/KanbanAIPanel.vue').default> | null>(null)

// ── Focus mode: hide sidebar/nav + stat cards, board only ──
const focusMode = useState('focusMode', () => false)

function toggleFocusMode() {
  focusMode.value = !focusMode.value
  if (import.meta.client) {
    localStorage.setItem('focusflow_focus_mode', focusMode.value ? '1' : '0')
  }
}

onMounted(() => {
  if (localStorage.getItem('focusflow_focus_mode') === '1') {
    focusMode.value = true
  }
  // Refresh board when AI agents (advisor plan-from-doc, etc.) create tasks in this project
  window.addEventListener('focusflow:reload-tasks', onExternalTasksCreated as EventListener)
})

function onExternalTasksCreated(e: CustomEvent) {
  if (!e.detail?.projectId || e.detail.projectId === (route.params.id as string)) {
    loadProjectData().catch(() => {})
  }
}

// Leaving the board always restores the normal layout
onUnmounted(() => {
  focusMode.value = false
  window.removeEventListener('focusflow:reload-tasks', onExternalTasksCreated as EventListener)
})


const workspaceId = computed(() => store.workspace?.id || '')

const showAddTask = ref(false)
const addToColumnId = ref('')

const showTaskDetail = ref(false)
const selectedTask = ref<Task | null>(null)

const showAddColumn = ref(false)
const showImportModal = ref(false)
const addingColumn = ref(false)
const newColumnTitle = ref('')
const newColumnColor = ref('#6B7280')
const showEditColumn = ref(false)
const savingColumn = ref(false)
const editingColumnId = ref('')
const editColumnData = reactive({ title: '', color: '', wip_limit: '' })
const columnColors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EF4444', '#EC4899', '#6B7280', '#14B8A6', '#6366F1']

let draggedTask: Task | null = null
const dragOverColumn = ref('')

// View mode (columns or list)
const viewMode = ref<'columns' | 'list'>((typeof localStorage !== 'undefined' && localStorage.getItem('focusflow-kanban-view') as any) || 'columns')

function setViewMode(mode: 'columns' | 'list') {
  viewMode.value = mode
  if (typeof localStorage !== 'undefined') localStorage.setItem('focusflow-kanban-view', mode)
}

// Kanban filters
const showKanbanFilter = ref(false)
const kanbanFilterPriority = ref('')
const kanbanFilterAssignee = ref('')
const kanbanFilterDue = ref('')
const kanbanSearch = ref('')
const listGroupBy = ref<'column' | 'priority' | 'assignee' | 'none'>('column')
const listSortBy = ref<'position' | 'due_date' | 'priority' | 'updated_at' | 'title'>('position')
const selectedTaskIds = ref<string[]>([])
const bulkColumnId = ref('')
const bulkPriority = ref('')
const bulkAssignee = ref('')
const savingTaskIds = ref<Set<string>>(new Set())

// Stat computeds
const todayStr = new Date().toISOString().slice(0, 10)
const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const inProgressCount = computed(() => {
  // Count tasks not in first or last column
  if (columns.value.length <= 2) return tasks.value.length
  const middleCols = columns.value.slice(1, -1).map(c => c.id)
  return tasks.value.filter(t => t.column_id && middleCols.includes(t.column_id)).length
})

const completedCount = computed(() => {
  if (columns.value.length === 0) return 0
  const lastColId = columns.value[columns.value.length - 1]!.id
  return tasks.value.filter(t => t.column_id === lastColId).length
})

const dueTodayCount = computed(() => {
  return tasks.value.filter(t => t.due_date && t.due_date.startsWith(todayStr)).length
})

function isWipExceeded(column: KanbanColumn): boolean {
  if (!column.wip_limit) return false
  return filteredTasksByColumn(column.id).length > column.wip_limit
}

function taskAgingClass(task: Task): string {
  if (!task.column_entered_at) return ''
  const days = differenceInDays(new Date(), new Date(task.column_entered_at))
  if (days >= 7) return 'border-l-4 border-l-red-500'
  if (days >= 3) return 'border-l-4 border-l-amber-400'
  return ''
}

function clearTaskFilters() {
  kanbanSearch.value = ''
  kanbanFilterPriority.value = ''
  kanbanFilterAssignee.value = ''
  kanbanFilterDue.value = ''
}

function toDateInput(dateStr?: string | null): string {
  return dateStr ? String(dateStr).slice(0, 10) : ''
}

const doneColumnId = computed(() => columns.value[columns.value.length - 1]?.id || '')

function isTaskDone(task: Task): boolean {
  return !!doneColumnId.value && task.column_id === doneColumnId.value
}

function isTaskOverdue(task: Task): boolean {
  const due = toDateInput(task.due_date)
  return !!due && due < todayStr && !isTaskDone(task)
}

function matchesTextSearch(task: Task, query: string): boolean {
  if (!query) return true
  const assignees = (task.assignees || []).map(getMemberEmail).join(' ')
  const labels = (task.labels || []).map(label => label.name).join(' ')
  const haystack = [
    localizedTitle(task),
    localizedDescription(task),
    (task.tags || []).join(' '),
    labels,
    assignees,
  ].join(' ').toLowerCase()
  return haystack.includes(query)
}

function matchesDueFilter(task: Task): boolean {
  const due = toDateInput(task.due_date)
  if (!kanbanFilterDue.value) return true
  if (kanbanFilterDue.value === 'none') return !due
  if (!due) return false
  if (kanbanFilterDue.value === 'overdue') return isTaskOverdue(task)
  if (kanbanFilterDue.value === 'today') return due === todayStr
  if (kanbanFilterDue.value === 'week') return due >= todayStr && due <= nextWeekStr
  return true
}

const allFilteredTasks = computed(() => {
  const query = kanbanSearch.value.trim().toLowerCase()
  return tasks.value.filter((task) => {
    if (kanbanFilterPriority.value && task.priority !== kanbanFilterPriority.value) return false
    if (kanbanFilterAssignee.value && !(task.assignees || []).includes(kanbanFilterAssignee.value)) return false
    if (!matchesDueFilter(task)) return false
    return matchesTextSearch(task, query)
  })
})

// Memoized: group filtered tasks by column in a single pass (called once per reactive change, not per render)
const _filteredByColumn = computed(() => {
  const map: Record<string, Task[]> = {}
  for (const t of allFilteredTasks.value) {
    if (!map[t.column_id]) map[t.column_id] = []
    map[t.column_id]!.push(t)
  }
  return map
})

function filteredTasksByColumn(columnId: string) {
  return _filteredByColumn.value[columnId] || []
}

const priorityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const priorityMeta = computed(() => [
  { value: 'critical', label: t.value.priorityCritical, color: '#EF4444' },
  { value: 'high', label: t.value.priorityHigh, color: '#F97316' },
  { value: 'medium', label: t.value.priorityMedium, color: '#3B82F6' },
  { value: 'low', label: t.value.priorityLow, color: '#9CA3AF' },
])

function compareTasks(a: Task, b: Task): number {
  if (listSortBy.value === 'due_date') {
    const ad = toDateInput(a.due_date) || '9999-12-31'
    const bd = toDateInput(b.due_date) || '9999-12-31'
    return ad.localeCompare(bd) || compareTasksByPosition(a, b)
  }
  if (listSortBy.value === 'priority') {
    return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99) || compareTasksByPosition(a, b)
  }
  if (listSortBy.value === 'updated_at') {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }
  if (listSortBy.value === 'title') {
    return localizedTitle(a).localeCompare(localizedTitle(b))
  }
  return compareTasksByPosition(a, b)
}

function compareTasksByPosition(a: Task, b: Task): number {
  const aCol = columns.value.findIndex(c => c.id === a.column_id)
  const bCol = columns.value.findIndex(c => c.id === b.column_id)
  return (aCol - bCol) || ((a.position || 0) - (b.position || 0)) || localizedTitle(a).localeCompare(localizedTitle(b))
}

const sortedListTasks = computed(() => [...allFilteredTasks.value].sort(compareTasks))

const listTaskGroups = computed(() => {
  if (listGroupBy.value === 'none') {
    return [{ id: 'all', title: language.value === 'en' ? 'All tasks' : 'Todas las tareas', color: '#10B981', tasks: sortedListTasks.value }]
  }
  if (listGroupBy.value === 'priority') {
    return priorityMeta.value.map(priority => ({
      id: `priority-${priority.value}`,
      title: priority.label,
      color: priority.color,
      tasks: sortedListTasks.value.filter(task => task.priority === priority.value),
    }))
  }
  if (listGroupBy.value === 'assignee') {
    const groups = workspaceMembers.value.map(member => ({
      id: `assignee-${member.user_id}`,
      title: member.email,
      color: '#14B8A6',
      tasks: sortedListTasks.value.filter(task => firstAssignee(task) === member.user_id),
    }))
    groups.push({
      id: 'assignee-none',
      title: language.value === 'en' ? 'Unassigned' : 'Sin responsable',
      color: '#F59E0B',
      tasks: sortedListTasks.value.filter(task => !firstAssignee(task)),
    })
    return groups
  }
  return columns.value.map(column => ({
    id: `column-${column.id}`,
    title: column.title,
    color: column.color || '#10B981',
    tasks: sortedListTasks.value.filter(task => task.column_id === column.id),
  }))
})

const overdueVisibleCount = computed(() => allFilteredTasks.value.filter(isTaskOverdue).length)
const unassignedVisibleCount = computed(() => allFilteredTasks.value.filter(task => !(task.assignees || []).length).length)
const visibleEstimatedHours = computed(() => {
  const total = allFilteredTasks.value.reduce((sum, task) => sum + Number(task.estimated_hours || 0), 0)
  return Number.isInteger(total) ? total : total.toFixed(1)
})

const visibleTaskIds = computed(() => allFilteredTasks.value.map(task => task.id))
const allVisibleSelected = computed(() => visibleTaskIds.value.length > 0 && visibleTaskIds.value.every(id => selectedTaskIds.value.includes(id)))

watch(visibleTaskIds, (ids) => {
  selectedTaskIds.value = selectedTaskIds.value.filter(id => ids.includes(id))
})

function taskProgress(task: Task): number {
  // Simple heuristic: if in last column = 100%, in first = 0%, proportional otherwise
  if (!columns.value.length) return 0
  const colIdx = columns.value.findIndex(c => c.id === task.column_id)
  if (colIdx < 0) return 0
  return Math.round((colIdx / Math.max(columns.value.length - 1, 1)) * 100)
}

function isOverdue(dateStr: string): boolean {
  return dateStr < todayStr
}

const TAG_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#F97316', '#EF4444', '#EC4899', '#14B8A6', '#6366F1', '#84CC16']
function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]!
}

// Workspace members for assignee picker
const workspaceMembers = ref<{ user_id: string; email: string; role: string }[]>([])

async function loadWorkspaceMembers() {
  if (!workspaceId.value) return
  try {
    const data = await $fetch<any[]>(`/api/workspaces/${workspaceId.value}/members`)
    workspaceMembers.value = (data || []).map(m => ({
      user_id: m.user_id,
      email: m.email || m.user_id.slice(0, 8),
      role: m.role,
    }))
  } catch {}
}

function getMemberEmail(userId: string) {
  return workspaceMembers.value.find(m => m.user_id === userId)?.email || userId.slice(0, 8)
}

function getMemberInitials(userId: string) {
  const email = getMemberEmail(userId)
  if (email.includes('@')) return email.split('@')[0]!.slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

function firstAssignee(task: Task): string {
  return (task.assignees || [])[0] || ''
}

function eventValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value
}

function markTaskSaving(taskId: string, saving: boolean) {
  const next = new Set(savingTaskIds.value)
  if (saving) next.add(taskId)
  else next.delete(taskId)
  savingTaskIds.value = next
}

function isTaskSaving(taskId: string): boolean {
  return savingTaskIds.value.has(taskId)
}

async function updateTaskInline(task: Task, updates: Record<string, unknown>) {
  if (!workspaceId.value || isTaskSaving(task.id)) return
  const index = tasks.value.findIndex(t => t.id === task.id)
  if (index === -1) return

  const previous = { ...tasks.value[index] } as Task
  tasks.value[index] = { ...tasks.value[index]!, ...updates, updated_at: new Date().toISOString() } as Task
  markTaskSaving(task.id, true)

  try {
    const updated = await $fetch<Task>(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, {
      method: 'PATCH',
      body: updates,
    })
    const freshIndex = tasks.value.findIndex(t => t.id === task.id)
    if (freshIndex !== -1) tasks.value[freshIndex] = { ...tasks.value[freshIndex]!, ...updated } as Task
  } catch {
    const freshIndex = tasks.value.findIndex(t => t.id === task.id)
    if (freshIndex !== -1) tasks.value[freshIndex] = previous
  } finally {
    markTaskSaving(task.id, false)
  }
}

function handleInlineColumnChange(task: Task, event: Event) {
  const columnId = eventValue(event)
  if (columnId && columnId !== task.column_id) updateTaskInline(task, { column_id: columnId })
}

function handleInlinePriorityChange(task: Task, event: Event) {
  const priority = eventValue(event)
  if (priority && priority !== task.priority) updateTaskInline(task, { priority })
}

function handleInlineDueDateChange(task: Task, event: Event) {
  const dueDate = eventValue(event)
  const current = toDateInput(task.due_date)
  if (dueDate !== current) updateTaskInline(task, { due_date: dueDate || null })
}

function handleInlineEstimateChange(task: Task, event: Event) {
  const raw = eventValue(event)
  const estimated = raw === '' ? null : Number(raw)
  const current = task.estimated_hours ?? null
  if (estimated !== current && (estimated === null || Number.isFinite(estimated))) {
    updateTaskInline(task, { estimated_hours: estimated })
  }
}

function handleInlineAssigneeChange(task: Task, event: Event) {
  const assignee = eventValue(event)
  const assignees = assignee ? [assignee] : []
  if (assignees.join(',') !== (task.assignees || []).join(',')) {
    updateTaskInline(task, { assignees })
  }
}

function toggleTaskSelection(taskId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (checked && !selectedTaskIds.value.includes(taskId)) {
    selectedTaskIds.value = [...selectedTaskIds.value, taskId]
  } else if (!checked) {
    selectedTaskIds.value = selectedTaskIds.value.filter(id => id !== taskId)
  }
}

function toggleAllVisibleTasks(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    selectedTaskIds.value = [...new Set([...selectedTaskIds.value, ...visibleTaskIds.value])]
  } else {
    selectedTaskIds.value = selectedTaskIds.value.filter(id => !visibleTaskIds.value.includes(id))
  }
}

async function applyBulkUpdate(updates: Record<string, unknown>) {
  const ids = [...selectedTaskIds.value]
  const selected = tasks.value.filter(task => ids.includes(task.id))
  await Promise.all(selected.map(task => updateTaskInline(task, updates)))
  selectedTaskIds.value = []
}

async function applyBulkColumn() {
  if (!bulkColumnId.value) return
  await applyBulkUpdate({ column_id: bulkColumnId.value })
  bulkColumnId.value = ''
}

async function applyBulkPriority() {
  if (!bulkPriority.value) return
  await applyBulkUpdate({ priority: bulkPriority.value })
  bulkPriority.value = ''
}

async function applyBulkAssignee() {
  if (!bulkAssignee.value) return
  const assignees = bulkAssignee.value === '__none' ? [] : [bulkAssignee.value]
  await applyBulkUpdate({ assignees })
  bulkAssignee.value = ''
}

async function handleDeleteSelectedTasks() {
  const count = selectedTaskIds.value.length
  if (count === 0) return
  const msg = language.value === 'en'
    ? `Delete ${count} selected task(s)? This cannot be undone.`
    : `¿Eliminar ${count} tarea(s) seleccionada(s)? Esta acción no se puede deshacer.`
  if (!confirm(msg)) return
  try {
    const ids = [...selectedTaskIds.value]
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/batch-delete`, {
      method: 'POST',
      body: { task_ids: ids },
    })
    tasks.value = tasks.value.filter(task => !ids.includes(task.id))
    selectedTaskIds.value = []
  } catch { /* */ }
}


onMounted(async () => {
  try {
    await store.loadWorkspace(route.params.workspace as string)
    if (!store.workspace) return
    const [data] = await Promise.all([
      $fetch<any>(`/api/workspaces/${store.workspace.id}/projects/${route.params.id}`),
      loadWorkspaceMembers(),
    ])
    project.value = data.project as Project
    columns.value = (data.columns || []) as KanbanColumn[]
    tasks.value = (data.tasks || []) as Task[]
    store.setCurrentProject(route.params.id as string)
  } finally {
    loading.value = false
  }
})

async function loadProjectData() {
  if (!store.workspace) return
  const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/projects/${route.params.id}`, {
    params: { _t: Date.now() },
  })
  columns.value = (data.columns || []) as KanbanColumn[]
  tasks.value = (data.tasks || []) as Task[]
}

async function loadTasks() {
  if (!store.workspace) return
  const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/projects/${route.params.id}`, {
    params: { _t: Date.now() },
  })
  tasks.value = (data.tasks || []) as Task[]
}

const _tasksByColumn = computed(() => {
  const map: Record<string, Task[]> = {}
  for (const t of tasks.value) {
    if (!map[t.column_id]) map[t.column_id] = []
    map[t.column_id]!.push(t)
  }
  return map
})

function tasksByColumn(columnId: string) {
  return _tasksByColumn.value[columnId] || []
}

function columnBgColor(hex: string) {
  // Return a light tint of the column color (~15% opacity for visible header backgrounds)
  return hex + '26'
}

function formatDate(d: string) {
  try { return format(new Date(d), 'dd MMM') } catch { return d }
}

// --- Column Management ---
async function handleAddColumn() {
  if (!newColumnTitle.value.trim()) return
  addingColumn.value = true
  try {
    const col = await $fetch<any>(`/api/workspaces/${workspaceId.value}/columns`, {
      method: 'POST',
      body: { project_id: route.params.id, title: newColumnTitle.value, color: newColumnColor.value },
    })
    columns.value.push(col)
    newColumnTitle.value = ''
    newColumnColor.value = '#6B7280'
    showAddColumn.value = false
  } catch { /* */ } finally {
    addingColumn.value = false
  }
}

function openEditColumn(column: KanbanColumn) {
  editingColumnId.value = column.id
  editColumnData.title = column.title
  editColumnData.color = column.color || '#6B7280'
  editColumnData.wip_limit = column.wip_limit?.toString() || ''
  showEditColumn.value = true
}

async function handleUpdateColumn() {
  if (!editingColumnId.value) return
  savingColumn.value = true
  try {
    const updated = await $fetch<any>(`/api/workspaces/${workspaceId.value}/columns/${editingColumnId.value}`, {
      method: 'PATCH',
      body: { title: editColumnData.title, color: editColumnData.color, wip_limit: editColumnData.wip_limit ? parseInt(editColumnData.wip_limit) : null },
    })
    const idx = columns.value.findIndex(c => c.id === editingColumnId.value)
    if (idx !== -1) columns.value[idx] = { ...columns.value[idx], ...updated }
    showEditColumn.value = false
  } catch { /* */ } finally {
    savingColumn.value = false
  }
}

async function handleDeleteColumn(column: KanbanColumn) {
  const tasksInColumn = tasksByColumn(column.id).length
  if (tasksInColumn > 0) {
    const msg = language.value === 'en'
      ? `"${column.title}" has ${tasksInColumn} task(s). Delete the column and all its tasks?`
      : `"${column.title}" tiene ${tasksInColumn} tarea(s). ¿Eliminar la columna y todas sus tareas?`
    if (!confirm(msg)) return
    // Clear tasks first, then delete column
    try {
      await $fetch(`/api/workspaces/${workspaceId.value}/tasks/batch-delete`, {
        method: 'POST',
        body: { column_id: column.id },
      })
    } catch { return }
  } else {
    if (!confirm(language.value === 'en' ? `Delete column "${column.title}"?` : `¿Eliminar la columna "${column.title}"?`)) return
  }
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/columns/${column.id}`, { method: 'DELETE' })
    columns.value = columns.value.filter(c => c.id !== column.id)
    await loadTasks()
  } catch { /* */ }
}

// --- Drag & Drop ---
function onDragStart(e: DragEvent, task: Task) {
  draggedTask = task
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }
}

async function onDrop(_e: DragEvent, columnId: string) {
  dragOverColumn.value = ''
  if (!draggedTask || draggedTask.column_id === columnId) return
  const task = draggedTask
  draggedTask = null
  const idx = tasks.value.findIndex(t => t.id === task.id)
  if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx]!, column_id: columnId }
  await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, {
    method: 'PATCH',
    body: { column_id: columnId },
  })
}

// --- Create Task ---
function openAddTask(columnId: string) {
  addToColumnId.value = columnId
  showAddTask.value = true
}

// --- Delegate to AI Agent ---
const showDelegateModal = ref(false)
const delegateTask = ref<Task | null>(null)

function openDelegateModal(task: Task) {
  delegateTask.value = task
  showDelegateModal.value = true
}

// --- Task Detail ---
function openTaskDetail(task: Task) {
  selectedTask.value = task
  showTaskDetail.value = true
}

async function handleDeleteTask(task: Task) {
  const msg = language.value === 'en' ? `Delete "${task.title}"?` : `¿Eliminar "${task.title}"?`
  if (!confirm(msg)) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${task.id}`, { method: 'DELETE' })
    selectedTaskIds.value = selectedTaskIds.value.filter(id => id !== task.id)
    await loadTasks()
  } catch { /* */ }
}

async function handleClearColumn(column: KanbanColumn) {
  const count = tasksByColumn(column.id).length
  if (count === 0) return
  const msg = language.value === 'en'
    ? `Delete all ${count} task(s) in "${column.title}"? This cannot be undone.`
    : `¿Eliminar las ${count} tarea(s) de "${column.title}"? Esta acción no se puede deshacer.`
  if (!confirm(msg)) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/batch-delete`, {
      method: 'POST',
      body: { column_id: column.id },
    })
    await loadTasks()
  } catch { /* */ }
}

async function handleDeleteAllTasks() {
  const count = tasks.value.length
  if (count === 0) return
  const msg = language.value === 'en'
    ? `DELETE ALL ${count} TASKS in this project? This cannot be undone.`
    : `¿ELIMINAR TODAS las ${count} tareas de este proyecto? Esta acción no se puede deshacer.`
  if (!confirm(msg)) return
  // Double confirmation for safety
  const msg2 = language.value === 'en'
    ? `Are you absolutely sure? Type YES to confirm.`
    : `¿Estás completamente seguro? Escribe SI para confirmar.`
  const answer = prompt(msg2)
  if (answer !== 'YES' && answer !== 'SI' && answer !== 'Si' && answer !== 'si' && answer !== 'yes') return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/batch-delete`, {
      method: 'POST',
      body: { project_id: route.params.id },
    })
    await loadTasks()
  } catch { /* */ }
}

</script>

<style scoped>
.workos-select,
.workos-cell-select,
.workos-cell-input,
.bulk-select {
  border: 1px solid rgba(209, 213, 219, 0.8);
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
}

.workos-select {
  min-height: 2.5rem;
  padding: 0 0.75rem;
  background: rgba(249, 250, 251, 0.9);
  color: rgb(55, 65, 81);
  font-size: 0.8125rem;
  font-weight: 600;
}

.workos-cell-select,
.workos-cell-input {
  width: 100%;
  min-height: 2rem;
  padding: 0 0.5rem;
  background: transparent;
  color: rgb(55, 65, 81);
  font-size: 0.75rem;
}

.bulk-select {
  min-height: 2rem;
  padding: 0 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.18);
  font-size: 0.75rem;
  font-weight: 600;
}

.bulk-select option {
  color: #111827;
}

.workos-checkbox {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  accent-color: #0d9488;
  cursor: pointer;
}

.workos-select:focus,
.workos-cell-select:focus,
.workos-cell-input:focus {
  border-color: rgba(20, 184, 166, 0.65);
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.16);
}

:is(.dark) .workos-select {
  background: rgba(255, 255, 255, 0.06);
  color: rgb(229, 231, 235);
  border-color: rgba(255, 255, 255, 0.1);
}

:is(.dark) .workos-cell-select,
:is(.dark) .workos-cell-input {
  color: rgb(229, 231, 235);
  border-color: rgba(255, 255, 255, 0.1);
}

:is(.dark) .workos-cell-select option,
:is(.dark) .workos-select option {
  color: #111827;
}

/* Kanban horizontal scroll */
@media (max-width: 767px) {
  .kanban-scroll::-webkit-scrollbar {
    height: 0;
    display: none;
  }
  .kanban-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
@media (min-width: 768px) {
  .kanban-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .kanban-scroll::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  .kanban-scroll::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.18);
    border-radius: 4px;
  }
  .kanban-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  :is(.dark) .kanban-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  :is(.dark) .kanban-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.18);
  }
  :is(.dark) .kanban-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

</style>
