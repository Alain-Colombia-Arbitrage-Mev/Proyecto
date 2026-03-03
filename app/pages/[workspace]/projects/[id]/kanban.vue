<template>
  <div class="relative">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 animate-fade-up flex-wrap gap-2">
      <div>
        <NuxtLink
          :to="`/${$route.params.workspace}/projects`"
          class="text-xs text-gray-400 hover:text-focusflow-700 mb-1 inline-flex items-center gap-1 font-medium transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Proyectos
        </NuxtLink>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">{{ project?.name || 'Kanban' }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- Full text on desktop -->
        <UButton size="sm" variant="soft" icon="i-heroicons-sparkles" @click="handleSuggestTasks" :loading="aiLoading" class="font-medium hidden sm:inline-flex">
          AI Sugerencias
        </UButton>
        <UButton size="sm" variant="soft" color="success" icon="i-heroicons-bolt" @click="handleAntiProcrastination" :loading="aiLoading" class="font-medium hidden sm:inline-flex">
          Anti-Procrastinación
        </UButton>
        <UButton size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" @click="showImportModal = true" class="font-medium hidden sm:inline-flex">
          Importar
        </UButton>
        <!-- Icon-only on mobile -->
        <UButton size="sm" variant="soft" icon="i-heroicons-sparkles" @click="handleSuggestTasks" :loading="aiLoading" class="sm:hidden" />
        <UButton size="sm" variant="soft" color="success" icon="i-heroicons-bolt" @click="handleAntiProcrastination" :loading="aiLoading" class="sm:hidden" />
        <UButton size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" @click="showImportModal = true" class="sm:hidden" />
      </div>
    </div>

    <!-- Stat Cards Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 animate-fade-up">
      <div class="bg-white rounded-[15px] border border-gray-100 p-3.5">
        <p class="text-[11px] text-gray-500 mb-0.5">Tareas Totales</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ tasks.length }}</span>
          <div class="flex items-end gap-[2px] h-[32px]">
            <div v-for="(col, ci) in columns.slice(0, 6)" :key="'st-'+ci" class="w-[5px] rounded-sm"
              :style="{ height: `${Math.max(tasksByColumn(col.id).length / Math.max(tasks.length, 1) * 100, 8)}%`, backgroundColor: col.color || '#10B981' }" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-[15px] border border-gray-100 p-3.5">
        <p class="text-[11px] text-gray-500 mb-0.5">En Progreso</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#0D0D0D] leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ inProgressCount }}</span>
          <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-[15px] border border-gray-100 p-3.5">
        <p class="text-[11px] text-gray-500 mb-0.5">Vencen Hoy</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold leading-none tabular-nums" :class="dueTodayCount > 0 ? 'text-red-600' : 'text-[#0D0D0D]'" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ dueTodayCount }}</span>
          <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>
      <div class="bg-white rounded-[15px] border border-gray-100 p-3.5">
        <p class="text-[11px] text-gray-500 mb-0.5">Completadas</p>
        <div class="flex items-end justify-between">
          <span class="text-[28px] font-bold text-[#10B981] leading-none tabular-nums" style="font-family: 'Space Grotesk', sans-serif; letter-spacing: -1.5px;">{{ completedCount }}</span>
          <div class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tablero header bar -->
    <div class="flex items-center justify-between mb-4 animate-fade-up flex-wrap gap-2">
      <div class="flex items-center gap-3">
        <h2 class="text-[16px] font-semibold text-[#0D0D0D]">Tablero</h2>
        <!-- View toggle -->
        <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            class="text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer"
            :class="viewMode === 'columns' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="setViewMode('columns')"
          >
            <UIcon name="i-heroicons-view-columns" class="w-3.5 h-3.5" />
          </button>
          <button
            class="text-[11px] font-medium px-2.5 py-1 rounded-md transition-all cursor-pointer"
            :class="viewMode === 'list' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="setViewMode('list')"
          >
            <UIcon name="i-heroicons-bars-3" class="w-3.5 h-3.5" />
          </button>
        </div>
        <!-- Language toggle -->
        <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            class="text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
            :class="language === 'es' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
            @click="setLang('es')"
          >ES</button>
          <button
            class="text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer"
            :class="language === 'en' ? 'bg-white text-[#0D0D0D] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
            @click="setLang('en')"
          >EN</button>
        </div>
        <!-- Kanban filter -->
        <button
          class="text-[11px] font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer"
          :class="showKanbanFilter ? 'bg-[#0D0D0D] text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'"
          @click="showKanbanFilter = !showKanbanFilter"
        >
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-funnel" class="w-3 h-3" />
            Filtros
          </span>
        </button>
      </div>
      <button
        class="bg-[#10B981] hover:bg-emerald-600 text-white text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        @click="openAddTask(columns[0]?.id || '')"
      >
        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
        Crear tarea
      </button>
    </div>

    <!-- Kanban filters row -->
    <div v-if="showKanbanFilter" class="flex items-center gap-2 mb-4 animate-fade-up">
      <select
        v-model="kanbanFilterPriority"
        class="text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1.5 border-0 outline-none cursor-pointer"
      >
        <option value="">Prioridad</option>
        <option value="critical">Crítica</option>
        <option value="high">Alta</option>
        <option value="medium">Media</option>
        <option value="low">Baja</option>
      </select>
      <select
        v-model="kanbanFilterAssignee"
        class="text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1.5 border-0 outline-none cursor-pointer"
      >
        <option value="">Asignado a</option>
        <option v-for="m in workspaceMembers" :key="m.user_id" :value="m.user_id">{{ m.email || m.user_id.slice(0, 12) }}</option>
      </select>
      <button
        v-if="kanbanFilterPriority || kanbanFilterAssignee"
        class="text-[11px] text-red-500 font-medium cursor-pointer hover:text-red-700"
        @click="kanbanFilterPriority = ''; kanbanFilterAssignee = ''"
      >
        Limpiar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Cargando tablero...</span>
      </div>
    </div>

    <!-- Kanban Board (Columns View) -->
    <div v-else-if="viewMode === 'columns'" class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8 min-h-[65vh] animate-fade-up delay-100">
      <div
        v-for="column in columns"
        :key="column.id"
        class="flex flex-col w-64 min-w-[256px] md:w-72 md:min-w-[288px] shrink-0"
        :class="isWipExceeded(column) ? 'ring-2 ring-red-300 rounded-xl bg-red-50/30' : ''"
      >
        <!-- Column header -->
        <div
          class="flex items-center justify-between mb-3 px-3 py-2 rounded-xl group/col"
          :style="{ backgroundColor: columnBgColor(column.color), borderLeft: `3px solid ${column.color}` }"
        >
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full ring-2 ring-white/80" :style="{ backgroundColor: column.color }" />
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
              class="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all opacity-0 group-hover/col:opacity-100"
              @click="openEditColumn(column)"
              title="Editar columna"
            >
              <UIcon name="i-heroicons-pencil-square" class="w-3 h-3" />
            </button>
            <button
              class="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/col:opacity-100"
              @click="handleDeleteColumn(column)"
              title="Eliminar columna"
            >
              <UIcon name="i-heroicons-trash" class="w-3 h-3" />
            </button>
            <button
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
          class="flex-1 space-y-2 bg-gray-50/80 rounded-xl p-2 min-h-[200px] transition-colors"
          :class="dragOverColumn === column.id ? 'ring-2 ring-focusflow-300 bg-focusflow-50/50' : ''"
          @dragover.prevent="dragOverColumn = column.id"
          @dragleave="dragOverColumn = ''"
          @drop="onDrop($event, column.id)"
        >
          <div
            v-for="task in filteredTasksByColumn(column.id)"
            :key="task.id"
            draggable="true"
            class="group/card bg-white rounded-xl p-2.5 sm:p-3.5 cursor-grab active:cursor-grabbing border border-gray-100 hover:border-focusflow-200 transition-all duration-200 shadow-card hover:shadow-card-hover active:scale-[0.98] relative"
            :class="taskAgingClass(task)"
            @dragstart="onDragStart($event, task)"
            @click="openTaskDetail(task)"
          >
            <!-- Pomodoro quick-start button -->
            <button
              class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10"
              :class="pomodoro.activeTask.value?.id === task.id
                ? 'bg-emerald-100 text-emerald-600 opacity-100'
                : 'bg-gray-100 text-gray-400 hover:bg-focusflow-100 hover:text-focusflow-600 opacity-0 group-hover/card:opacity-100'"
              :title="pomodoro.activeTask.value?.id === task.id ? `Pomodoro: ${pomodoro.display.value}` : 'Iniciar Pomodoro'"
              @click.stop="pomodoro.startForTask({ id: task.id, title: task.title }, workspaceId)"
            >
              <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
            </button>
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
                  'bg-gray-300': task.priority === 'low',
                }"
              />
              <p class="text-[13px] font-semibold text-gray-900 leading-snug">{{ localizedTitle(task) }}</p>
            </div>

            <!-- Description preview -->
            <p v-if="localizedDescription(task)" class="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{{ htmlToPlainText(localizedDescription(task)).slice(0, 100) }}</p>

            <!-- Time progress bar -->
            <div v-if="getTaskProgress(task.due_date, task.created_at, task.estimated_hours)" class="mb-2.5">
              <div class="flex items-center gap-2 mb-0.5">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
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
                <span v-else-if="task.due_date" class="text-[10px] flex items-center gap-1 font-medium text-gray-500">
                  <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
                  {{ formatDate(task.due_date) }}
                </span>
                <span
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                  :class="{
                    'bg-red-50 text-red-600': task.priority === 'critical' || task.priority === 'high',
                    'bg-blue-50 text-blue-600': task.priority === 'medium',
                    'bg-gray-50 text-gray-400': task.priority === 'low',
                  }"
                >
                  {{ { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' }[task.priority] || task.priority }}
                </span>
              </div>
              <!-- Assignee avatars -->
              <div v-if="task.assignees?.length" class="flex -space-x-1.5">
                <div
                  v-for="uid in task.assignees.slice(0, 3)"
                  :key="uid"
                  class="w-5 h-5 rounded-full bg-focusflow-100 text-focusflow-700 flex items-center justify-center text-[8px] font-bold ring-2 ring-white"
                  :title="getMemberEmail(uid)"
                >
                  {{ getMemberInitials(uid) }}
                </div>
                <div
                  v-if="task.assignees.length > 3"
                  class="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[8px] font-bold ring-2 ring-white"
                >
                  +{{ task.assignees.length - 3 }}
                </div>
              </div>
            </div>
          </div>

          <!-- Drop hint -->
          <div
            v-if="filteredTasksByColumn(column.id).length === 0"
            class="flex items-center justify-center h-24 border border-dashed border-gray-300 rounded-xl"
          >
            <p class="text-[10px] text-gray-400 font-medium">Arrastra tareas aquí</p>
          </div>
        </div>

        <!-- Quick add -->
        <button
          class="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-focusflow-700 hover:bg-focusflow-50/50 rounded-xl transition-all"
          @click="openAddTask(column.id)"
        >
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      <!-- Add Column button -->
      <div class="flex flex-col w-64 min-w-[256px] md:w-72 md:min-w-[288px] shrink-0">
        <div v-if="!showAddColumn" class="flex-1 flex items-start">
          <button
            class="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-focusflow-300 rounded-xl text-sm font-medium text-gray-400 hover:text-focusflow-700 transition-all cursor-pointer"
            @click="showAddColumn = true"
          >
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            Agregar columna
          </button>
        </div>
        <div v-else class="bg-white rounded-xl p-4 border border-gray-100 shadow-card">
          <form @submit.prevent="handleAddColumn" class="space-y-3">
            <UInput v-model="newColumnTitle" placeholder="Nombre de la columna" required class="w-full" size="sm" autofocus />
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500">Color:</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in columnColors"
                  :key="c"
                  type="button"
                  class="w-5 h-5 rounded-full border-2 transition-all cursor-pointer"
                  :class="newColumnColor === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'"
                  :style="{ backgroundColor: c }"
                  @click="newColumnColor = c"
                />
              </div>
            </div>
            <div class="flex gap-2">
              <UButton type="submit" size="xs" color="primary" :loading="addingColumn" class="font-semibold">Crear</UButton>
              <UButton size="xs" variant="ghost" @click="showAddColumn = false">Cancelar</UButton>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="!loading && viewMode === 'list'" class="animate-fade-up delay-100">
      <div class="bg-white rounded-[15px] border border-gray-100 overflow-hidden">
        <!-- Table header -->
        <div class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 bg-gray-50/50">
          <span>Tarea</span>
          <span class="hidden md:block">Columna</span>
          <span>Deadline</span>
          <span>Prioridad</span>
          <span class="hidden md:block">Tags</span>
          <span class="hidden md:block">Asignados</span>
        </div>
        <!-- Rows grouped by column -->
        <template v-for="column in columns" :key="'list-'+column.id">
          <div
            v-if="filteredTasksByColumn(column.id).length > 0"
            class="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b border-gray-50"
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
            class="grid grid-cols-[2fr_1fr_1fr] md:grid-cols-[2fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr] px-4 py-2.5 text-[12px] border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors cursor-pointer"
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
                  'bg-gray-300': task.priority === 'low',
                }"
              />
              <span class="text-gray-900 font-medium truncate">{{ localizedTitle(task) }}</span>
            </div>
            <!-- Column (hidden mobile) -->
            <span class="text-gray-500 truncate flex items-center gap-1 hidden md:flex">
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
                <span v-else-if="task.due_date" class="font-medium text-gray-500">{{ formatDate(task.due_date) }}</span>
                <span v-else-if="task.estimated_hours" class="text-[10px] font-medium text-gray-500">~{{ task.estimated_hours }}h</span>
                <span v-else class="text-gray-300">—</span>
              </span>
              <div v-if="getTaskProgress(task.due_date, task.created_at, task.estimated_hours)" class="flex items-center gap-1.5">
                <div class="h-1 bg-gray-100 rounded-full overflow-hidden w-full max-w-20">
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
                  'bg-gray-50 text-gray-400': task.priority === 'low',
                }">
                {{ { critical: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja' }[task.priority] || task.priority }}
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
                class="w-5 h-5 rounded-full bg-focusflow-100 text-focusflow-700 flex items-center justify-center text-[8px] font-bold ring-2 ring-white"
                :title="getMemberEmail(uid)"
              >
                {{ getMemberInitials(uid) }}
              </div>
              <span v-if="(task.assignees || []).length > 3" class="text-[9px] text-gray-400 ml-1">+{{ task.assignees!.length - 3 }}</span>
              <span v-if="!(task.assignees || []).length" class="text-[10px] text-gray-300">—</span>
            </div>
          </div>
        </template>
        <div v-if="allFilteredTasks.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
          <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 text-gray-300 mb-2" />
          <p class="text-[12px]">Sin tareas</p>
        </div>
      </div>
    </div>

    <!-- AI Floating Button -->
    <button
      class="fixed bottom-20 md:bottom-6 right-6 w-12 h-12 rounded-full bg-focusflow-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-focusflow-700 hover:scale-105 transition-all duration-200 z-40 cursor-pointer"
      @click="showAiPanel = !showAiPanel"
    >
      <UIcon :name="showAiPanel ? 'i-heroicons-x-mark' : 'i-heroicons-sparkles'" class="w-5 h-5" />
    </button>

    <!-- AI Chat Panel -->
    <transition name="slide">
      <div
        v-if="showAiPanel"
        class="fixed bottom-36 md:bottom-20 inset-x-4 md:inset-x-auto md:right-6 w-auto md:w-96 max-h-[560px] bg-white border border-gray-100 rounded-2xl shadow-card-lg z-40 flex flex-col overflow-hidden"
      >
        <!-- Panel header -->
        <div class="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-focusflow-600 flex items-center justify-center">
            <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">FocusFlow AI</p>
            <p class="text-[10px] text-gray-400">MiniMax M2.5 · Asistente inteligente</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="px-3 py-1.5 border-b border-gray-100 flex gap-1">
          <button
            class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="aiTab === 'chat' ? 'bg-focusflow-50 text-focusflow-700' : 'text-gray-400 hover:text-gray-600'"
            @click="aiTab = 'chat'"
          >Chat</button>
          <button
            class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="aiTab === 'memory' ? 'bg-purple-50 text-purple-700' : 'text-gray-400 hover:text-gray-600'"
            @click="aiTab = 'memory'; loadMemoryAgents()"
          >Memoria</button>
          <button
            class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            :class="aiTab === 'tokens' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:text-gray-600'"
            @click="aiTab = 'tokens'; loadTokenUsage()"
          >Tokens</button>
        </div>

        <!-- Quick actions (chat tab) -->
        <div v-if="aiTab === 'chat'" class="px-3 py-2 border-b border-gray-100 flex gap-1.5 flex-wrap">
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-focusflow-50 text-focusflow-700 hover:bg-focusflow-100 transition-colors cursor-pointer" @click="handleSuggestTasks" :disabled="aiLoading">
            Sugerir tareas
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer" @click="handleDailyPlan" :disabled="aiLoading">
            Plan del día
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer" @click="handleAntiProcrastination" :disabled="aiLoading">
            Anti-Procrastinación
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer" @click="handleDocumentArchitecture" :disabled="aiLoading">
            Documentar Arquitectura
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #3B82F620; color: #3B82F6;" @click="handleDocAgent('doc_backend_architecture')" :disabled="aiLoading">
            Backend Arch
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #F59E0B20; color: #F59E0B;" @click="handleDocAgent('doc_aws_expert')" :disabled="aiLoading">
            AWS Expert
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #EC489920; color: #EC4899;" @click="handleDocAgent('doc_frontend_design')" :disabled="aiLoading">
            Frontend Design
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #8B5CF620; color: #8B5CF6;" @click="handleDocAgent('doc_marketing')" :disabled="aiLoading">
            Marketing
          </button>
          <button class="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" style="background-color: #10B98120; color: #10B981;" @click="handleDocAgent('doc_ai_agents')" :disabled="aiLoading">
            AI Agents Doc
          </button>
        </div>

        <!-- Memory Tab -->
        <div v-if="aiTab === 'memory'" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
          <div v-if="memoryLoading" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
          </div>
          <template v-else>
            <div v-if="memoryAgents.length === 0" class="text-center py-8">
              <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p class="text-xs text-gray-400">Sin memorias aún. Usa el chat para generar contexto.</p>
            </div>
            <div v-for="agent in memoryAgents" :key="agent.type" class="bg-gray-50 rounded-xl p-3">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center" :style="{ backgroundColor: agent.color + '20' }">
                  <UIcon :name="agent.icon" class="w-3.5 h-3.5" :style="{ color: agent.color }" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-gray-900">{{ agent.name }}</p>
                  <p class="text-[10px] text-gray-400">{{ agent.description }}</p>
                </div>
                <span
                  class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  :style="{ backgroundColor: agent.color + '20', color: agent.color }"
                >
                  {{ agent.count }}
                </span>
              </div>
            </div>
            <div class="text-center pt-2">
              <p class="text-[10px] text-gray-400">Total: {{ memoryTotalCount }} memorias vectoriales</p>
            </div>
          </template>
        </div>

        <!-- Tokens Tab -->
        <div v-if="aiTab === 'tokens'" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
          <div v-if="tokenLoading" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400" />
          </div>
          <template v-else-if="tokenStats">
            <!-- Monthly usage bar -->
            <div class="bg-gray-50 rounded-xl p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Uso mensual</p>
                <span class="text-xs font-bold tabular-nums" :class="tokenStats.percentUsed >= 90 ? 'text-red-600' : tokenStats.percentUsed >= 70 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ tokenStats.percentUsed }}%
                </span>
              </div>
              <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="tokenStats.percentUsed >= 90 ? 'bg-red-500' : tokenStats.percentUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'"
                  :style="{ width: `${Math.min(tokenStats.percentUsed, 100)}%` }"
                />
              </div>
              <p class="text-[10px] text-gray-500">{{ formatTokens(tokenStats.totalTokens) }} / {{ formatTokens(tokenStats.limit) }} tokens</p>
            </div>

            <!-- Today stats -->
            <div class="grid grid-cols-2 gap-2">
              <div class="bg-emerald-50 rounded-xl p-3 text-center">
                <p class="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Hoy</p>
                <span class="text-lg font-bold text-emerald-700 tabular-nums">{{ formatTokens(tokenTodayCount) }}</span>
              </div>
              <div class="bg-gray-50 rounded-xl p-3 text-center">
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Este mes</p>
                <span class="text-lg font-bold text-gray-700 tabular-nums">{{ formatTokens(tokenStats.totalTokens) }}</span>
              </div>
            </div>

            <!-- By action breakdown -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Por acción</p>
              <div class="space-y-1.5">
                <div v-for="(tokens, actionName) in tokenStats.byAction" :key="actionName" class="flex items-center gap-2">
                  <span class="text-[10px] text-gray-600 w-24 truncate">{{ actionName }}</span>
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-400 rounded-full" :style="{ width: `${(tokens / tokenStats.totalTokens) * 100}%` }" />
                  </div>
                  <span class="text-[10px] text-gray-500 tabular-nums w-14 text-right">{{ formatTokens(tokens) }}</span>
                </div>
              </div>
            </div>

            <!-- Avg tokens per message -->
            <div class="bg-violet-50 rounded-xl p-3 text-center">
              <p class="text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-1">Promedio por llamada</p>
              <span class="text-lg font-bold text-violet-700 tabular-nums">{{ formatTokens(tokenAvgPerCall) }}</span>
              <p class="text-[10px] text-violet-500">tokens/llamada</p>
            </div>
          </template>
          <div v-else class="text-center py-8">
            <UIcon name="i-heroicons-cpu-chip" class="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p class="text-xs text-gray-400">Sin datos de uso de tokens</p>
          </div>
        </div>

        <!-- Messages (chat tab) -->
        <div v-if="aiTab === 'chat'" ref="chatContainer" class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
          <div v-if="aiMessages.length === 0" class="flex flex-col items-center justify-center h-full text-center py-8">
            <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-gray-300 mb-2" />
            <p class="text-xs text-gray-400">Pregúntame sobre tu proyecto o usa los botones de arriba</p>
          </div>

          <div
            v-for="(msg, i) in aiMessages"
            :key="i"
            class="text-xs leading-relaxed"
            :class="msg.role === 'user' ? 'text-right' : ''"
          >
            <div
              class="inline-block max-w-[90%] rounded-xl px-3 py-2"
              :class="msg.role === 'user'
                ? 'bg-focusflow-50 text-gray-900'
                : 'bg-gray-50 text-gray-700'"
            >
              <!-- Suggestions -->
              <div v-if="msg.role === 'assistant' && msg.type === 'suggestions'" class="space-y-2">
                <p class="font-semibold text-focusflow-700 mb-1">Tareas sugeridas:</p>
                <div
                  v-for="(s, si) in msg.suggestions"
                  :key="si"
                  class="flex items-start gap-2 bg-white rounded-lg p-2 transition-all border border-gray-100"
                  :class="addedSuggestions.has(s.title) ? 'opacity-50' : 'cursor-pointer hover:ring-1 hover:ring-focusflow-300'"
                  @click="!addedSuggestions.has(s.title) && addSuggestedTask(s)"
                >
                  <UIcon
                    :name="addedSuggestions.has(s.title) ? 'i-heroicons-check-circle' : 'i-heroicons-plus-circle'"
                    class="w-3.5 h-3.5 mt-0.5 shrink-0"
                    :class="addedSuggestions.has(s.title) ? 'text-emerald-500' : 'text-focusflow-700'"
                  />
                  <div>
                    <p class="font-medium text-gray-900">{{ s.title }}</p>
                    <p class="text-gray-500 mt-0.5">{{ s.description }}</p>
                  </div>
                </div>
                <button
                  v-if="msg.suggestions?.some((s: any) => !addedSuggestions.has(s.title))"
                  class="mt-1 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-focusflow-50 text-focusflow-700 hover:bg-focusflow-100 transition-colors cursor-pointer"
                  :disabled="aiLoading"
                  @click="addAllSuggestedTasks(msg.suggestions!)"
                >
                  Crear todas en el tablero
                </button>
              </div>

              <!-- Daily plan -->
              <div v-else-if="msg.role === 'assistant' && msg.type === 'daily_plan'">
                <p class="font-semibold text-emerald-700 mb-1">{{ msg.plan.greeting }}</p>
                <div class="space-y-1 mt-2">
                  <div v-for="(t, ti) in msg.plan.focus_tasks" :key="ti" class="flex items-center gap-1.5">
                    <span class="text-gray-400">{{ Number(ti) + 1 }}.</span>
                    <span class="text-gray-900">{{ t }}</span>
                  </div>
                <button
                  class="mt-2 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  @click="addDailyPlanTasks(msg.plan.focus_tasks)"
                  :disabled="aiLoading"
                >
                  Crear todas en el tablero
                </button>
                </div>
                <div v-if="msg.plan.pomodoro_suggestion" class="mt-2 px-2 py-1.5 bg-emerald-50 rounded-lg text-emerald-700 text-[10px] font-medium">
                  {{ msg.plan.pomodoro_suggestion }}
                </div>
                <p v-if="msg.plan.procrastination_tip" class="mt-2 text-amber-700 font-medium">{{ msg.plan.procrastination_tip }}</p>
                <p class="mt-2 text-gray-500 italic">{{ msg.plan.tip }}</p>
              </div>

              <!-- Anti-procrastination -->
              <div v-else-if="msg.role === 'assistant' && msg.type === 'anti_procrastination'" class="space-y-2">
                <div class="flex items-center gap-2 mb-2">
                  <p class="font-semibold text-amber-700">Análisis Anti-Procrastinación</p>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="msg.analysis.score > 60 ? 'bg-red-50 text-red-700' : msg.analysis.score > 30 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">
                    Riesgo: {{ msg.analysis.score }}/100
                  </span>
                </div>
                <p class="text-gray-700">{{ msg.analysis.analysis }}</p>
                <div v-if="msg.analysis.quick_wins?.length" class="mt-2">
                  <p class="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider mb-1">Quick Wins (menos de 15 min):</p>
                  <div v-for="(qw, qi) in msg.analysis.quick_wins" :key="qi" class="text-gray-700">• {{ qw }}</div>
                </div>
                <div v-if="msg.analysis.techniques?.length" class="mt-2 space-y-1">
                  <p class="font-semibold text-focusflow-700 text-[10px] uppercase tracking-wider mb-1">Técnicas recomendadas:</p>
                  <div v-for="(tech, ti) in msg.analysis.techniques" :key="ti" class="bg-white rounded-lg p-2 border border-gray-100">
                    <p class="font-medium text-gray-900">{{ tech.name }}</p>
                    <p class="text-gray-500 mt-0.5">{{ tech.description }}</p>
                  </div>
                </div>
                <p v-if="msg.analysis.motivation" class="mt-2 text-focusflow-700 font-medium italic">{{ msg.analysis.motivation }}</p>
              </div>

              <!-- Document architecture -->
              <div v-else-if="msg.role === 'assistant' && msg.type === 'architecture'" class="space-y-2">
                <p class="font-semibold text-purple-700 mb-1">{{ msg.doc.title }}</p>
                <p class="text-gray-700 italic">{{ msg.doc.summary }}</p>

                <!-- Sections with category badges -->
                <div v-for="(section, si) in msg.doc.sections" :key="si" class="mt-2">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                      :class="sectionCategory(section.heading)"
                    >
                      {{ sectionTag(section.heading) }}
                    </span>
                    <p class="font-semibold text-gray-900 text-[11px] uppercase tracking-wider">{{ section.heading }}</p>
                  </div>
                  <p class="text-gray-700 mt-1 whitespace-pre-line text-[11px] leading-relaxed">{{ section.content }}</p>
                </div>

                <!-- Risks -->
                <div v-if="msg.doc.risks?.length" class="mt-2 bg-red-50 rounded-lg p-2">
                  <p class="font-semibold text-red-700 text-[10px] uppercase tracking-wider mb-1">Riesgos identificados:</p>
                  <div v-for="(risk, ri) in msg.doc.risks" :key="ri" class="text-red-700 text-[11px]">• {{ risk }}</div>
                </div>

                <!-- Recommendations -->
                <div v-if="msg.doc.recommendations?.length" class="mt-2 bg-focusflow-50 rounded-lg p-2">
                  <p class="font-semibold text-focusflow-700 text-[10px] uppercase tracking-wider mb-1">Recomendaciones:</p>
                  <div v-for="(rec, ri) in msg.doc.recommendations" :key="ri" class="text-focusflow-700 text-[11px]">• {{ rec }}</div>
                </div>

                <!-- Tasks created summary -->
                <div v-if="msg.doc.tasksCreated > 0" class="mt-2 bg-emerald-50 rounded-lg p-2">
                  <p class="font-semibold text-emerald-700 text-[10px] uppercase tracking-wider mb-1">{{ msg.doc.tasksCreated }} tareas creadas:</p>
                  <div v-for="(task, ti) in (msg.doc.createdTasks || []).slice(0, 8)" :key="ti" class="flex items-center gap-1.5 text-[11px]">
                    <span
                      class="px-1 py-0.5 rounded text-[9px] font-bold"
                      :class="task.priority === 'high' || task.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'"
                    >{{ task.priority }}</span>
                    <span class="text-emerald-800">{{ task.title }}</span>
                  </div>
                </div>
              </div>

              <!-- Improve task -->
              <div v-else-if="msg.role === 'assistant' && msg.type === 'improve'" class="space-y-1.5">
                <p class="font-semibold text-amber-700 mb-1">Tarea mejorada:</p>
                <p><span class="text-gray-400">Título:</span> <span class="text-gray-900 font-medium">{{ msg.improved.title }}</span></p>
                <p class="text-gray-600">{{ msg.improved.description }}</p>
                <div class="flex gap-1.5 flex-wrap mt-1">
                  <span v-for="tag in msg.improved.tags" :key="tag" class="px-1.5 py-0.5 rounded bg-focusflow-50 text-focusflow-700 text-[10px] font-semibold">{{ tag }}</span>
                </div>
                <button
                  class="mt-2 w-full text-center py-1.5 rounded-lg bg-focusflow-50 text-focusflow-700 font-semibold hover:bg-focusflow-100 transition-colors cursor-pointer"
                  @click="applyImprovedTask(msg.improved)"
                >
                  Aplicar cambios
                </button>
              </div>

              <div v-else>
                <p>{{ msg.text }}</p>
                <button
                  v-if="msg.showRetryAsTasks"
                  class="mt-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                  :disabled="aiLoading"
                  @click="retryAsTaskSuggestions(msg.text!)"
                >
                  Reintentar como tareas
                </button>
              </div>
            </div>
          </div>

          <div v-if="aiLoading" class="flex items-center gap-2 text-xs text-gray-400">
            <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 animate-spin" />
            Pensando...
          </div>
        </div>

        <!-- Chat input (chat tab only) -->
        <div v-if="aiTab === 'chat'" class="px-3 py-2 border-t border-gray-100">
          <form class="flex gap-2" @submit.prevent="handleChat">
            <input
              v-model="chatInput"
              placeholder="Pregunta algo..."
              class="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 outline-none focus:ring-1 focus:ring-focusflow-300 border border-gray-100"
              :disabled="aiLoading"
            />
            <button
              type="submit"
              class="w-8 h-8 rounded-lg bg-focusflow-600 text-white flex items-center justify-center hover:bg-focusflow-700 transition-colors disabled:opacity-50 cursor-pointer"
              :disabled="!chatInput.trim() || aiLoading"
            >
              <UIcon name="i-heroicons-paper-airplane" class="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </transition>

    <!-- Add Task Modal -->
    <TaskCreateModal
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
          <h2 class="text-lg font-bold text-gray-900 mb-5">Editar columna</h2>
          <form class="space-y-4" @submit.prevent="handleUpdateColumn">
            <UFormField label="Nombre">
              <UInput v-model="editColumnData.title" required class="w-full" size="lg" autofocus />
            </UFormField>
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-500">Color:</label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in columnColors"
                  :key="c"
                  type="button"
                  class="w-5 h-5 rounded-full border-2 transition-all cursor-pointer"
                  :class="editColumnData.color === c ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'"
                  :style="{ backgroundColor: c }"
                  @click="editColumnData.color = c"
                />
              </div>
            </div>
            <UFormField label="Límite WIP (opcional)">
              <UInput v-model="editColumnData.wip_limit" type="number" min="0" placeholder="Sin límite" class="w-full" />
            </UFormField>
            <div class="flex justify-end gap-3 pt-2">
              <UButton variant="ghost" @click="showEditColumn = false">Cancelar</UButton>
              <UButton type="submit" color="primary" :loading="savingColumn" class="font-semibold">Guardar</UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Task Detail Slideover -->
    <TaskDetailModal
      v-model:open="showTaskDetail"
      :task="selectedTask"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :workspace-members="workspaceMembers"
      :columns="columns"
      @updated="loadTasks"
      @deleted="loadTasks"
      @improve-with-a-i="handleImproveTask"
    />

    <TaskImportModal
      v-model:open="showImportModal"
      :workspace-id="workspaceId"
      :project-id="(route.params.id as string)"
      :columns="columns.map(c => ({ id: c.id, title: c.title }))"
      @imported="loadProjectData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Project, KanbanColumn, Task, Label, MemoryAgent, TokenUsageStats } from '~/types'
import { format, differenceInDays } from 'date-fns'
import { htmlToPlainText } from '~/utils/richtext'

definePageMeta({ middleware: 'auth' })

const { getDeadlineInfo, getEstimatedLabel, getTaskProgress } = useTaskDeadline()
const { language, setLanguage: setLang, localizedTitle, localizedDescription } = useLanguage()
const pomodoro = usePomodoroTimer()

const route = useRoute()
const store = useWorkspaceStore()

const project = ref<Project | null>(null)
const columns = ref<KanbanColumn[]>([])
const tasks = ref<Task[]>([])
const loading = ref(true)

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

function filteredTasksByColumn(columnId: string) {
  let result = tasks.value.filter(t => t.column_id === columnId)
  if (kanbanFilterPriority.value) {
    result = result.filter(t => t.priority === kanbanFilterPriority.value)
  }
  if (kanbanFilterAssignee.value) {
    result = result.filter(t => (t.assignees || []).includes(kanbanFilterAssignee.value))
  }
  return result
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

// AI state
const showAiPanel = ref(false)
const aiLoading = ref(false)
const chatInput = ref('')
const chatContainer = ref<HTMLElement | null>(null)

// AI tab state
const aiTab = ref<'chat' | 'memory' | 'tokens'>('chat')
const memoryAgents = ref<MemoryAgent[]>([])
const memoryTotalCount = ref(0)
const memoryLoading = ref(false)

async function loadMemoryAgents() {
  if (!workspaceId.value) return
  memoryLoading.value = true
  try {
    const res = await $fetch<{ agents: MemoryAgent[]; totalMemories: number }>(`/api/workspaces/${workspaceId.value}/memory/agents`)
    memoryAgents.value = res.agents
    memoryTotalCount.value = res.totalMemories
  } catch (e: any) {
    console.error('[memory] Load agents error:', e.message)
  } finally {
    memoryLoading.value = false
  }
}

// Token usage state
const tokenStats = ref<TokenUsageStats | null>(null)
const tokenLoading = ref(false)

const tokenTodayCount = computed(() => {
  if (!tokenStats.value?.byDay) return 0
  const today = new Date().toISOString().slice(0, 10)
  return tokenStats.value.byDay.find(d => d.date === today)?.tokens || 0
})

const tokenAvgPerCall = computed(() => {
  if (!tokenStats.value?.byAction) return 0
  const actionCount = Object.keys(tokenStats.value.byAction).length
  if (actionCount === 0) return 0
  return Math.round(tokenStats.value.totalTokens / actionCount)
})

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

async function loadTokenUsage() {
  if (!workspaceId.value) return
  tokenLoading.value = true
  try {
    const data = await $fetch<TokenUsageStats>(`/api/workspaces/${workspaceId.value}/usage`)
    tokenStats.value = data
  } catch (e: any) {
    console.error('[tokens] Load error:', e.message)
  } finally {
    tokenLoading.value = false
  }
}

interface AiMessage {
  role: 'user' | 'assistant'
  text?: string
  type?: 'text' | 'suggestions' | 'daily_plan' | 'improve' | 'anti_procrastination' | 'architecture' | 'doc_agent'
  suggestions?: any[]
  plan?: any
  improved?: any
  analysis?: any
  doc?: any
  showRetryAsTasks?: boolean
}
const aiMessages = ref<AiMessage[]>([])
const addedSuggestions = ref<Set<string>>(new Set())

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
  const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/projects/${route.params.id}`)
  columns.value = (data.columns || []) as KanbanColumn[]
  tasks.value = (data.tasks || []) as Task[]
}

async function loadTasks() {
  if (!store.workspace) return
  const data = await $fetch<any>(`/api/workspaces/${store.workspace.id}/projects/${route.params.id}`)
  tasks.value = (data.tasks || []) as Task[]
}

function tasksByColumn(columnId: string) {
  return tasks.value.filter(t => t.column_id === columnId)
}

function columnBgColor(hex: string) {
  // Return a very light tint of the column color (10% opacity)
  return hex + '10'
}

function sectionCategory(heading: string): string {
  const h = heading.toLowerCase()
  if (h.includes('devops') || h.includes('ci/cd') || h.includes('pipeline') || h.includes('deploy')) return 'bg-orange-100 text-orange-700'
  if (h.includes('infra') || h.includes('hosting') || h.includes('scaling') || h.includes('docker')) return 'bg-cyan-100 text-cyan-700'
  if (h.includes('monitor') || h.includes('observ') || h.includes('logging') || h.includes('health')) return 'bg-yellow-100 text-yellow-700'
  if (h.includes('seguridad') || h.includes('security') || h.includes('auth') || h.includes('rls')) return 'bg-red-100 text-red-700'
  if (h.includes('backend') || h.includes('api') || h.includes('modelo') || h.includes('datos')) return 'bg-blue-100 text-blue-700'
  if (h.includes('testing') || h.includes('test') || h.includes('cobertura')) return 'bg-green-100 text-green-700'
  if (h.includes('flujo') || h.includes('branch') || h.includes('release') || h.includes('git')) return 'bg-purple-100 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

function sectionTag(heading: string): string {
  const h = heading.toLowerCase()
  if (h.includes('devops') || h.includes('ci/cd') || h.includes('pipeline') || h.includes('deploy')) return 'DevOps'
  if (h.includes('infra') || h.includes('hosting') || h.includes('scaling') || h.includes('docker')) return 'Infra'
  if (h.includes('monitor') || h.includes('observ') || h.includes('logging') || h.includes('health')) return 'Ops'
  if (h.includes('seguridad') || h.includes('security') || h.includes('auth') || h.includes('rls')) return 'Security'
  if (h.includes('backend') || h.includes('api')) return 'Backend'
  if (h.includes('modelo') || h.includes('datos') || h.includes('data')) return 'DB'
  if (h.includes('testing') || h.includes('test') || h.includes('cobertura')) return 'Testing'
  if (h.includes('flujo') || h.includes('branch') || h.includes('release') || h.includes('git')) return 'Workflow'
  if (h.includes('visión') || h.includes('vision') || h.includes('general') || h.includes('alcance')) return 'General'
  if (h.includes('recomend') || h.includes('mejora')) return 'Mejoras'
  return 'Doc'
}

function formatDate(d: string) {
  try { return format(new Date(d), 'dd MMM') } catch { return d }
}

function scrollChat() {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  })
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
    alert(`No puedes eliminar "${column.title}" porque tiene ${tasksInColumn} tarea(s). Mueve las tareas primero.`)
    return
  }
  if (!confirm(`¿Eliminar la columna "${column.title}"?`)) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/columns/${column.id}`, { method: 'DELETE' })
    columns.value = columns.value.filter(c => c.id !== column.id)
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

// --- AI Functions ---
async function callAI(action: string, context: Record<string, any>) {
  aiLoading.value = true
  try {
    const res = await $fetch<{ type: string; data: any }>('/api/ai/assist', {
      method: 'POST',
      body: { action, context: { ...context, workspaceId: workspaceId.value } },
    })
    return res
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: `Error: ${e.data?.message || e.message || 'No se pudo conectar con AI'}`, type: 'text' })
    scrollChat()
    return null
  } finally {
    aiLoading.value = false
  }
}

async function handleSuggestTasks() {
  showAiPanel.value = true
  aiMessages.value.push({ role: 'user', text: 'Sugiéreme tareas para este proyecto' })
  scrollChat()
  const res = await callAI('suggest_tasks', {
    projectName: project.value?.name || '',
    projectDescription: project.value?.description || '',
  })
  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

/**
 * Find the best column for a new task based on the board layout.
 * "todo" = second column (first actionable), "progress" = column with "progreso"/"dev"/"desarrollo" in title.
 */
function findColumn(type: 'todo' | 'progress'): string {
  const cols = columns.value
  if (!cols.length) return ''
  if (cols.length <= 2) return cols[0]!.id // simple boards: first column

  if (type === 'todo') {
    // Second column is typically the "To Do" / "Sprint Backlog" / "Listo para Pull"
    return cols[1]?.id || cols[0]!.id
  }

  // "progress" — find column with matching keywords
  const progressKeywords = ['progreso', 'progress', 'dev', 'desarrollo', 'creación', 'diseño ui', 'desarrollo frontend']
  const match = cols.find(c => progressKeywords.some(k => c.title.toLowerCase().includes(k)))
  if (match) return match.id
  // Fallback: middle column
  return cols[Math.floor(cols.length / 2)]?.id || cols[1]?.id || cols[0]!.id
}

async function addSuggestedTask(suggestion: any) {
  const columnId = findColumn('todo')
  if (!columnId) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/tasks`, {
      method: 'POST',
      body: {
        project_id: route.params.id,
        column_id: columnId,
        title: suggestion.title,
        description: suggestion.description || null,
        priority: suggestion.priority || 'medium',
        tags: suggestion.tags || [],
      },
    })
    addedSuggestions.value.add(suggestion.title)
    await loadTasks()
    const colName = columns.value.find(c => c.id === columnId)?.title || ''
    aiMessages.value.push({ role: 'assistant', text: `"${suggestion.title}" agregada a ${colName}`, type: 'text' })
    scrollChat()
  } catch (e: any) {
    aiMessages.value.push({ role: 'assistant', text: `Error al agregar: ${e.message}`, type: 'text' })
    scrollChat()
  }
}

async function addAllSuggestedTasks(suggestions: any[]) {
  const columnId = findColumn('todo')
  if (!columnId) return
  const pending = suggestions.filter(s => !addedSuggestions.value.has(s.title))
  if (!pending.length) return
  let added = 0
  for (const s of pending) {
    try {
      await $fetch(`/api/workspaces/${workspaceId.value}/tasks`, {
        method: 'POST',
        body: {
          project_id: route.params.id,
          column_id: columnId,
          title: s.title,
          description: s.description || null,
          priority: s.priority || 'medium',
          tags: s.tags || [],
        },
      })
      addedSuggestions.value.add(s.title)
      added++
    } catch { /* continue */ }
  }
  await loadTasks()
  const colName = columns.value.find(c => c.id === columnId)?.title || ''
  aiMessages.value.push({ role: 'assistant', text: `${added} tareas creadas en ${colName}`, type: 'text' })
  scrollChat()
}

async function addDailyPlanTasks(focusTasks: string[]) {
  const columnId = findColumn('progress')
  if (!columnId || !focusTasks?.length) return
  let added = 0
  for (const title of focusTasks) {
    try {
      await $fetch(`/api/workspaces/${workspaceId.value}/tasks`, {
        method: 'POST',
        body: {
          project_id: route.params.id,
          column_id: columnId,
          title,
          priority: 'high',
          tags: ['plan-del-día'],
        },
      })
      added++
    } catch { /* continue */ }
  }
  await loadTasks()
  const colName = columns.value.find(c => c.id === columnId)?.title || ''
  aiMessages.value.push({ role: 'assistant', text: `${added} tareas del plan creadas en ${colName}`, type: 'text' })
  scrollChat()
}

async function handleDailyPlan() {
  if (!project.value) return
  showAiPanel.value = true
  aiMessages.value.push({ role: 'user', text: 'Dame un plan para hoy' })
  scrollChat()
  const res = await callAI('daily_plan', { projectId: project.value.id })
  if (res?.type === 'json' && res.data.focus_tasks) {
    aiMessages.value.push({ role: 'assistant', type: 'daily_plan', plan: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleAntiProcrastination() {
  if (!project.value) return
  showAiPanel.value = true
  aiMessages.value.push({ role: 'user', text: 'Analiza mi procrastinación en este proyecto' })
  scrollChat()
  const res = await callAI('anti_procrastination', { projectId: project.value.id, projectName: project.value.name })
  if (res?.type === 'json' && res.data.score !== undefined) {
    aiMessages.value.push({ role: 'assistant', type: 'anti_procrastination', analysis: res.data })
    // Suggest focus music when anti-procrastination analysis completes
    const { suggestFocusMusic } = useLofiPlayer()
    suggestFocusMusic()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleDocumentArchitecture() {
  if (!project.value) return
  showAiPanel.value = true
  aiMessages.value.push({ role: 'user', text: 'Documenta la arquitectura del workspace' })
  scrollChat()
  const res = await callAI('document_architecture', { projectId: project.value.id })
  if (res?.type === 'json' && res.data.title) {
    aiMessages.value.push({ role: 'assistant', type: 'architecture', doc: res.data })

    // Always reload tasks — even if tasksCreated is reported, ensure fresh state
    await loadTasks()

    const parts: string[] = []
    if (res.data.tasksCreated > 0) {
      parts.push(`${res.data.tasksCreated} tareas creadas en el tablero`)
    }
    if (res.data.document) parts.push('documento guardado')
    if (res.data.savedFile) parts.push('archivo .md en Archivos')

    if (parts.length > 0) {
      aiMessages.value.push({
        role: 'assistant',
        text: parts.join(' · '),
        type: 'text',
      })
    }

    // Show error info if tasks failed
    if (res.data.postError) {
      aiMessages.value.push({
        role: 'assistant',
        text: `Nota: hubo un error en post-procesamiento: ${res.data.postError}`,
        type: 'text',
      })
    }
    scrollChat()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

const docAgentNames: Record<string, string> = {
  doc_backend_architecture: 'Backend Senior Architecture',
  doc_aws_expert: 'AWS Senior Expert',
  doc_frontend_design: 'Frontend Design (Context7)',
  doc_marketing: 'Marketing Documentation',
  doc_ai_agents: 'AI Agents Documentation',
}

async function handleDocAgent(action: string) {
  if (!project.value) return
  showAiPanel.value = true
  const agentName = docAgentNames[action] || action
  aiMessages.value.push({ role: 'user', text: `Genera documentación: ${agentName}` })
  scrollChat()
  const res = await callAI(action, { projectId: project.value.id })
  if (res?.type === 'json' && res.data.title) {
    // Reuse architecture rendering (same schema)
    aiMessages.value.push({ role: 'assistant', type: 'architecture', doc: res.data })

    await loadTasks()

    const parts: string[] = []
    if (res.data.tasksCreated > 0) parts.push(`${res.data.tasksCreated} tareas creadas`)
    if (res.data.document) parts.push('documento guardado')
    if (res.data.savedFile) parts.push('archivo .md generado')
    if (res.data.sessionId) parts.push(`session: ${res.data.sessionId.slice(0, 8)}`)

    if (parts.length > 0) {
      aiMessages.value.push({ role: 'assistant', text: parts.join(' · '), type: 'text' })
    }
    if (res.data.postError) {
      aiMessages.value.push({ role: 'assistant', text: `Nota: ${res.data.postError}`, type: 'text' })
    }
    scrollChat()
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function handleImproveTask() {
  if (!selectedTask.value) return
  showAiPanel.value = true
  aiMessages.value.push({ role: 'user', text: `Mejora la tarea: "${selectedTask.value.title}"` })
  scrollChat()
  const res = await callAI('improve_task', {
    taskTitle: selectedTask.value.title,
    taskDescription: selectedTask.value.description || '',
    priority: selectedTask.value.priority,
  })
  if (res?.type === 'json' && res.data.title) {
    aiMessages.value.push({ role: 'assistant', type: 'improve', improved: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}

async function applyImprovedTask(improved: any) {
  if (!selectedTask.value) return
  // Apply improved data directly to the task via PATCH
  try {
    const updates: Record<string, unknown> = {}
    if (improved.title) updates.title = improved.title
    if (improved.description) updates.description = improved.description
    if (improved.priority_suggestion) updates.priority = improved.priority_suggestion
    if (improved.estimated_hours) updates.estimated_hours = improved.estimated_hours
    if (improved.tags?.length) updates.tags = improved.tags

    await $fetch(`/api/workspaces/${workspaceId.value}/tasks/${selectedTask.value.id}`, {
      method: 'PATCH',
      body: updates,
    })
    await loadTasks()
    aiMessages.value.push({ role: 'assistant', text: 'Mejoras aplicadas a la tarea.', type: 'text' })
  } catch {
    aiMessages.value.push({ role: 'assistant', text: 'Error al aplicar mejoras.', type: 'text' })
  }
  scrollChat()
}

async function handleChat() {
  if (!chatInput.value.trim() || !project.value) return
  const message = chatInput.value.trim()
  chatInput.value = ''
  aiMessages.value.push({ role: 'user', text: message })
  scrollChat()

  // Build conversation history for context continuity (last 10 messages)
  const history = aiMessages.value.slice(-10).map(m => ({
    role: m.role,
    text: m.text || (m.type === 'suggestions' ? 'Sugerí tareas' : m.type === 'architecture' ? 'Generé documento de arquitectura' : ''),
  }))

  const res = await callAI('chat', {
    message,
    projectId: project.value.id,
    projectName: project.value.name,
    projectDescription: project.value.description || '',
    history,
  })

  const taskKeywords = ['crea', 'sugiere', 'genera', 'tareas', 'backlog', 'necesito', 'lista', 'pasos', 'descompón', 'descompon']

  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    const wasTaskRequest = taskKeywords.some(k => message.toLowerCase().includes(k))
    const responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
    aiMessages.value.push({
      role: 'assistant',
      text: responseText,
      type: 'text',
      showRetryAsTasks: wasTaskRequest && res.type === 'text',
    })
  }
  scrollChat()
}

async function retryAsTaskSuggestions(originalText: string) {
  if (!project.value) return
  const retryMessage = `Genera exactamente 5 tareas en JSON array para: ${originalText}`
  aiMessages.value.push({ role: 'user', text: retryMessage })
  scrollChat()

  const res = await callAI('chat', {
    message: retryMessage,
    projectId: project.value.id,
    projectName: project.value.name,
    projectDescription: project.value.description || '',
    history: [],
  })

  if (res?.type === 'json' && Array.isArray(res.data)) {
    aiMessages.value.push({ role: 'assistant', type: 'suggestions', suggestions: res.data })
  } else if (res) {
    aiMessages.value.push({ role: 'assistant', text: typeof res.data === 'string' ? res.data : JSON.stringify(res.data), type: 'text' })
  }
  scrollChat()
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
</style>
