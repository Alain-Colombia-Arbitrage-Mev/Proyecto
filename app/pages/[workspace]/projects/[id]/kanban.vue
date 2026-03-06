<template>
  <div class="relative">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 animate-fade-up flex-wrap gap-2">
      <div>
        <NuxtLink
          :to="`/${$route.params.workspace}/projects`"
          class="text-xs text-gray-400 hover:text-focusflow-700 dark:text-[#99a0ae] dark:hover:text-focusflow-400 mb-1 inline-flex items-center gap-1 font-medium transition-colors"
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
        <!-- Icon-only on mobile -->
        <UButton v-if="canUseAI" size="sm" variant="soft" icon="i-heroicons-sparkles" @click="aiPanelRef?.handleSuggestTasks()" :loading="aiPanelRef?.aiLoading" class="sm:hidden" />
        <UButton v-if="canUseAI" size="sm" variant="soft" color="success" icon="i-heroicons-bolt" @click="aiPanelRef?.handleAntiProcrastination()" :loading="aiPanelRef?.aiLoading" class="sm:hidden" />
        <UButton v-if="canImportTasks" size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" @click="showImportModal = true" class="sm:hidden" />
      </div>
    </div>

    <!-- Stat Cards Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-up">
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-[#99a0ae] mb-0.5">{{ language === 'en' ? 'Total Tasks' : 'Tareas Totales' }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ tasks.length }}</span>
          <div class="flex items-end gap-[2px] h-[32px]">
            <div v-for="(col, ci) in columns.slice(0, 6)" :key="'st-'+ci" class="w-[5px] rounded-sm"
              :style="{ height: `${Math.max(tasksByColumn(col.id).length / Math.max(tasks.length, 1) * 100, 8)}%`, backgroundColor: col.color || '#10B981' }" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-[#99a0ae] mb-0.5">{{ t.inProgress }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] dark:text-gray-100 leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ inProgressCount }}</span>
          <div class="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-[#99a0ae] mb-0.5">{{ t.dueToday }}</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold leading-none tabular-nums" :class="dueTodayCount > 0 ? 'text-red-600' : 'text-[#0D0D0D] dark:text-gray-100'" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ dueTodayCount }}</span>
          <div class="w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 p-3.5">
        <p class="text-[11px] text-gray-500 dark:text-[#99a0ae] mb-0.5">{{ t.completed }}</p>
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
            :class="viewMode === 'columns' ? 'bg-white dark:bg-white/15 text-[#0D0D0D] dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-[#99a0ae] hover:text-gray-700 dark:hover:text-gray-300'"
            @click="setViewMode('columns')"
          >
            <UIcon name="i-heroicons-view-columns" class="w-4 h-4" />
          </button>
          <button
            class="text-xs font-medium px-2.5 py-2 rounded-md transition-all cursor-pointer"
            :class="viewMode === 'list' ? 'bg-white dark:bg-white/15 text-[#0D0D0D] dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-[#99a0ae] hover:text-gray-700 dark:hover:text-gray-300'"
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
          :class="showKanbanFilter ? 'bg-[#0D0D0D] dark:bg-white/20 text-white' : 'text-gray-500 dark:text-[#99a0ae] bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15'"
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
      <select
        v-model="kanbanFilterPriority"
        class="text-xs font-medium text-gray-600 dark:text-[#99a0ae] bg-gray-100 dark:bg-white/10 rounded-full px-3 py-2 border-0 outline-none cursor-pointer"
      >
        <option value="">{{ t.priority }}</option>
        <option value="critical">{{ t.priorityCritical }}</option>
        <option value="high">{{ t.priorityHigh }}</option>
        <option value="medium">{{ t.priorityMedium }}</option>
        <option value="low">{{ t.priorityLow }}</option>
      </select>
      <select
        v-model="kanbanFilterAssignee"
        class="text-xs font-medium text-gray-600 dark:text-[#99a0ae] bg-gray-100 dark:bg-white/10 rounded-full px-3 py-2 border-0 outline-none cursor-pointer"
      >
        <option value="">{{ t.assignedTo }}</option>
        <option v-for="m in workspaceMembers" :key="m.user_id" :value="m.user_id">{{ m.email || m.user_id.slice(0, 12) }}</option>
      </select>
      <button
        v-if="kanbanFilterPriority || kanbanFilterAssignee"
        class="text-[11px] text-red-500 font-medium cursor-pointer hover:text-red-700"
        @click="kanbanFilterPriority = ''; kanbanFilterAssignee = ''"
      >
        {{ t.clear }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
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
            <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white/80 dark:ring-white/20" :style="{ backgroundColor: column.color }" />
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
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
              @click="handleClearColumn(column)"
              :title="language === 'en' ? 'Clear all tasks in column' : 'Vaciar tareas de la columna'"
            >
              <UIcon name="i-heroicons-archive-box-x-mark" class="w-3.5 h-3.5" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
              @click="openEditColumn(column)"
              :title="t.editColumn"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-3.5 h-3.5" />
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover/col:opacity-100"
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
            class="group/card bg-white dark:bg-[#1b1b1b] rounded-xl p-2.5 sm:p-3.5 cursor-grab active:cursor-grabbing border border-gray-100 dark:border-white/10 hover:border-focusflow-200 dark:hover:border-focusflow-500/30 transition-all duration-200 shadow-card hover:shadow-card-hover active:scale-[0.98] relative overflow-hidden"
            :class="taskAgingClass(task)"
            :style="task.color ? { borderLeftWidth: '4px', borderLeftColor: task.color } : {}"
            @dragstart="onDragStart($event, task)"
            @click="openTaskDetail(task)"
          >
            <!-- Card quick actions -->
            <div class="absolute top-2 right-2 flex items-center gap-1 z-10">
              <button
                v-if="canDeleteTasks"
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 sm:opacity-0 sm:group-hover/card:opacity-100"
                :title="t.deleteTask"
                @click.stop="handleDeleteTask(task)"
              >
                <UIcon name="i-heroicons-trash" class="w-3 h-3" />
              </button>
              <button
                class="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                :class="pomodoro.activeTask.value?.id === task.id
                  ? 'bg-emerald-100 text-emerald-600 opacity-100'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-focusflow-100 dark:hover:bg-focusflow-500/20 hover:text-focusflow-600 sm:opacity-0 sm:group-hover/card:opacity-100'"
                :title="pomodoro.activeTask.value?.id === task.id ? `Pomodoro: ${pomodoro.display.value}` : t.startPomodoro"
                @click.stop="pomodoro.startForTask({ id: task.id, title: task.title }, workspaceId)"
              >
                <UIcon name="i-heroicons-clock" class="w-3 h-3" />
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
              <span v-if="task.labels.length > 3" class="text-[9px] text-gray-400 px-1 py-0.5">+{{ task.labels.length - 3 }}</span>
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
              <span v-if="task.tags.length > 3" class="text-[9px] text-gray-400 px-1 py-0.5">+{{ task.tags.length - 3 }}</span>
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

            <!-- Description preview -->
            <p v-if="localizedDescription(task)" class="text-[11px] text-gray-500 dark:text-[#99a0ae] leading-relaxed mb-2 line-clamp-2">{{ htmlToPlainText(localizedDescription(task)).slice(0, 100) }}</p>

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
                <span class="text-[9px] font-medium text-gray-400 whitespace-nowrap tabular-nums">
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
                <span v-else-if="task.due_date" class="text-[10px] flex items-center gap-1 font-medium text-gray-500 dark:text-[#99a0ae]">
                  <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
                  {{ formatDate(task.due_date) }}
                </span>
                <span
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                  :class="{
                    'bg-red-50 dark:bg-red-500/10 text-red-600': task.priority === 'critical' || task.priority === 'high',
                    'bg-blue-50 dark:bg-blue-500/10 text-blue-600': task.priority === 'medium',
                    'bg-gray-50 dark:bg-white/5 text-gray-400': task.priority === 'low',
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
                  class="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-[#99a0ae] flex items-center justify-center text-[8px] font-bold ring-2 ring-white dark:ring-[#1b1b1b]"
                >
                  +{{ task.assignees.length - 3 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Drop hint -->
          <div
            v-if="filteredTasksByColumn(column.id).length === 0"
            class="flex items-center justify-center h-24 border border-dashed border-gray-300 dark:border-white/10 rounded-xl"
          >
            <p class="text-[10px] text-gray-400 font-medium"><span class="hidden sm:inline">{{ t.noTasksDrag }}</span><span class="sm:hidden">{{ t.noTasksMobile }}</span></p>
          </div>
        </div>

        <!-- Quick add -->
        <button
          v-if="canCreateTasks"
          class="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 hover:bg-focusflow-50/50 dark:hover:bg-focusflow-500/10 rounded-xl transition-all"
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
            class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-focusflow-300 dark:hover:border-focusflow-500/30 rounded-xl text-sm font-medium text-gray-400 hover:text-focusflow-700 dark:hover:text-focusflow-400 transition-all cursor-pointer"
            @click="showAddColumn = true"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            {{ language === 'en' ? 'Add column' : 'Agregar columna' }}
          </button>
        </div>
        <div v-else class="bg-white dark:bg-[#1b1b1b] rounded-xl p-4 border border-gray-100 dark:border-white/10 shadow-card">
          <form @submit.prevent="handleAddColumn" class="space-y-3">
            <UInput v-model="newColumnTitle" :placeholder="t.columnName" required class="w-full" size="sm" autofocus />
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500 dark:text-[#99a0ae]">{{ language === 'en' ? 'Color:' : 'Color:' }}</label>
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
      <div class="bg-white dark:bg-[#1b1b1b] rounded-[15px] border border-gray-100 dark:border-white/10 overflow-hidden">
        <!-- Table header -->
        <div class="grid grid-cols-[2fr_1fr_1fr_auto] md:grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_auto] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
          <span>{{ language === 'en' ? 'Task' : 'Tarea' }}</span>
          <span class="hidden md:block">{{ t.column }}</span>
          <span>{{ t.deadline }}</span>
          <span>{{ t.priority }}</span>
          <span class="hidden md:block">{{ t.tags }}</span>
          <span class="hidden md:block">{{ t.assigned }}</span>
          <span class="w-8" />
        </div>
        <!-- Rows grouped by column -->
        <template v-for="column in columns" :key="'list-'+column.id">
          <div
            v-if="filteredTasksByColumn(column.id).length > 0"
            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50 dark:border-white/5"
            :style="{ color: column.color, backgroundColor: column.color + '08' }"
          >
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: column.color }" />
              {{ column.title }} ({{ filteredTasksByColumn(column.id).length }})
            </span>
          </div>
          <div
            v-for="task in filteredTasksByColumn(column.id)"
            :key="'lt-'+task.id"
            class="grid grid-cols-[2fr_1fr_1fr_auto] md:grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_auto] px-4 py-2.5 text-[12px] border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            @click="openTaskDetail(task)"
          >
            <!-- Task name -->
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
              <span class="text-gray-900 dark:text-gray-100 font-medium truncate">{{ localizedTitle(task) }}</span>
            </div>
            <!-- Column (hidden mobile) -->
            <span class="text-gray-500 dark:text-[#99a0ae] truncate flex items-center gap-1 hidden md:flex">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ backgroundColor: column.color }" />
              {{ column.title }}
            </span>
            <!-- Deadline + progress -->
            <div class="flex flex-col gap-1">
              <span>
                <span v-if="task.due_date && getDeadlineInfo(task.due_date)"
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  :class="getDeadlineInfo(task.due_date)!.bgClass + ' ' + getDeadlineInfo(task.due_date)!.colorClass">
                  {{ getDeadlineInfo(task.due_date)!.label }}
                </span>
                <span v-else-if="task.due_date" class="font-medium text-gray-500 dark:text-[#99a0ae]">{{ formatDate(task.due_date) }}</span>
                <span v-else-if="task.estimated_hours" class="text-[10px] font-medium text-gray-500 dark:text-[#99a0ae]">~{{ task.estimated_hours }}h</span>
                <span v-else class="text-gray-300">—</span>
              </span>
              <div v-if="getTaskProgress(task.due_date, task.created_at, task.estimated_hours)" class="flex items-center gap-1.5">
                <div class="h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden w-full max-w-20">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :style="{
                      width: getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.percent + '%',
                      backgroundColor: getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.color,
                    }"
                  />
                </div>
                <span class="text-[8px] text-gray-400 tabular-nums whitespace-nowrap">{{ getTaskProgress(task.due_date, task.created_at, task.estimated_hours)!.label }}</span>
              </div>
            </div>
            <!-- Priority -->
            <span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                :class="{
                  'bg-red-50 text-red-600': task.priority === 'critical' || task.priority === 'high',
                  'bg-blue-50 text-blue-600': task.priority === 'medium',
                  'bg-gray-50 dark:bg-white/5 text-gray-400': task.priority === 'low',
                }">
                {{ { critical: t.priorityCritical, high: t.priorityHigh, medium: t.priorityMedium, low: t.priorityLow }[task.priority] || task.priority }}
              </span>
            </span>
            <!-- Labels + Tags (hidden mobile) -->
            <div class="gap-1 flex-wrap items-center hidden md:flex">
              <span v-for="label in (task.labels || []).slice(0, 2)" :key="label.id"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                :style="{ backgroundColor: label.color + '20', color: label.color }">
                {{ label.name }}
              </span>
              <span v-for="tag in (task.tags || []).slice(0, 2)" :key="tag"
                class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                :style="{ backgroundColor: tagColor(tag) + '18', color: tagColor(tag) }">
                #{{ tag }}
              </span>
            </div>
            <!-- Assignees (hidden mobile) -->
            <div class="hidden md:flex -space-x-1.5 items-center">
              <div
                v-for="uid in (task.assignees || []).slice(0, 3)"
                :key="uid"
                class="w-5 h-5 rounded-full bg-focusflow-100 dark:bg-focusflow-500/20 text-focusflow-700 dark:text-focusflow-400 flex items-center justify-center text-[8px] font-bold ring-2 ring-white dark:ring-[#1b1b1b]"
                :title="getMemberEmail(uid)"
              >
                {{ getMemberInitials(uid) }}
              </div>
              <span v-if="(task.assignees || []).length > 3" class="text-[9px] text-gray-400 ml-1">+{{ task.assignees!.length - 3 }}</span>
              <span v-if="!(task.assignees || []).length" class="text-[10px] text-gray-300">—</span>
            </div>
            <!-- Delete -->
            <div class="flex items-center justify-center w-8">
              <button
                v-if="canDeleteTasks"
                class="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                :title="t.deleteTask"
                @click.stop="handleDeleteTask(task)"
              >
                <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </template>
        <div v-if="allFilteredTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-gray-300 mb-2" />
          <p class="text-[12px]">{{ t.noTasksMobile }}</p>
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
              <label class="text-xs text-gray-500 dark:text-[#99a0ae]">{{ language === 'en' ? 'Color:' : 'Color:' }}</label>
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

// Stat computeds
const todayStr = new Date().toISOString().slice(0, 10)

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

// Memoized: group filtered tasks by column in a single pass (called once per reactive change, not per render)
const _filteredByColumn = computed(() => {
  const map: Record<string, Task[]> = {}
  for (const t of tasks.value) {
    if (kanbanFilterPriority.value && t.priority !== kanbanFilterPriority.value) continue
    if (kanbanFilterAssignee.value && !(t.assignees || []).includes(kanbanFilterAssignee.value)) continue
    if (!map[t.column_id]) map[t.column_id] = []
    map[t.column_id]!.push(t)
  }
  return map
})

function filteredTasksByColumn(columnId: string) {
  return _filteredByColumn.value[columnId] || []
}

const allFilteredTasks = computed(() => {
  let result = [...tasks.value]
  if (kanbanFilterPriority.value) {
    result = result.filter(t => t.priority === kanbanFilterPriority.value)
  }
  if (kanbanFilterAssignee.value) {
    result = result.filter(t => (t.assignees || []).includes(kanbanFilterAssignee.value))
  }
  return result
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
