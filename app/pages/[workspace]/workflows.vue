<template>
  <div class="min-h-screen">
    <!-- Hero Header -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-amber-500 p-6 sm:p-8 mb-6 sm:mb-8 shadow-xl">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9zdmc+')] opacity-60"></div>
      <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl"></div>
      <div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4 sm:gap-5">
          <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-lg">
            <UIcon name="i-heroicons-bolt" class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">{{ t.workflowBuilder }}</h1>
            <p class="text-xs sm:text-sm text-white/70 mt-1 max-w-lg">{{ t.workflowBuilderDesc }}</p>
          </div>
        </div>
        <UButton v-if="!editingWorkflow" color="white" icon="i-heroicons-plus" class="font-semibold w-full sm:w-auto" @click="showCreateModal = true">
          {{ t.newWorkflow }}
        </UButton>
        <UButton v-else variant="soft" color="white" icon="i-heroicons-arrow-left" class="w-full sm:w-auto" @click="editingWorkflow = null">
          {{ t.close }}
        </UButton>
      </div>
    </div>

    <!-- Create Modal -->
    <UModal :open="showCreateModal" @update:open="(v: boolean) => showCreateModal = v" class="sm:max-w-lg w-full">
      <template #content>
        <div class="flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.newWorkflow }}</h2>
            <UButton variant="ghost" size="xs" icon="i-heroicons-x-mark" @click="showCreateModal = false" />
          </div>
          <div class="px-6 py-5 space-y-4">
            <UFormField :label="t.workflowName">
              <UInput v-model="createForm.name" placeholder="Mi workflow..." class="w-full" size="lg" autofocus />
            </UFormField>
            <UFormField :label="t.description">
              <textarea v-model="createForm.description" rows="2" class="w-full text-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </UFormField>
            <div>
              <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.workflowType }}</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="wt in workflowTypes"
                  :key="wt.value"
                  type="button"
                  class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer"
                  :class="createForm.type === wt.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                    : 'border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'"
                  @click="createForm.type = wt.value"
                >
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="wt.bg">
                    <UIcon :name="wt.icon" class="w-5 h-5 text-white" />
                  </div>
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">{{ wt.label }}</span>
                </button>
              </div>
            </div>

            <!-- Templates -->
            <div>
              <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">{{ t.useTemplate }}</label>
              <div class="space-y-2">
                <button
                  v-for="tmpl in filteredTemplates"
                  :key="tmpl.id"
                  type="button"
                  class="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all cursor-pointer text-left"
                  @click="applyTemplate(tmpl)"
                >
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="tmpl.bg">
                    <UIcon :name="tmpl.icon" class="w-4 h-4 text-white" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ tmpl.name }}</p>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500 truncate">{{ tmpl.desc }}</p>
                  </div>
                  <span class="text-[10px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">{{ tmpl.nodes.length }} nodos</span>
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-3 border-t border-gray-100 dark:border-white/10">
            <UButton variant="ghost" @click="showCreateModal = false">{{ t.cancel }}</UButton>
            <UButton color="primary" :disabled="!createForm.name.trim()" :loading="creating" class="font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600" @click="handleCreate">
              {{ t.create }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Workflow List (when not editing) -->
    <div v-if="!editingWorkflow">
      <!-- Stats bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div v-for="stat in stats" :key="stat.label" class="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-3 sm:p-4">
          <p class="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ stat.label }}</p>
          <p class="text-xl sm:text-2xl font-bold mt-1" :class="stat.color">{{ stat.value }}</p>
        </div>
      </div>

      <!-- API Keys Panel -->
      <div class="mb-6">
        <button
          class="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
          @click="showApiKeys = !showApiKeys"
        >
          <div class="w-6 h-6 rounded-md bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <UIcon name="i-heroicons-key" class="w-3.5 h-3.5" />
          </div>
          {{ t.configureKeys }}
          <UIcon
            name="i-heroicons-chevron-right-20-solid"
            class="w-3.5 h-3.5 transition-transform"
            :class="showApiKeys ? 'rotate-90' : ''"
          />
        </button>
        <Transition name="fade">
          <div v-if="showApiKeys" class="mt-3 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-4 sm:p-5">
            <div class="flex items-center gap-2 mb-4">
              <UIcon name="i-heroicons-key" class="w-4 h-4 text-violet-500" />
              <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ t.apiKeys }}</h3>
              <span class="text-[10px] text-gray-400 hidden sm:inline">{{ t.apiKeysDesc }}</span>
            </div>
            <!-- n8n Connection -->
            <div class="mb-5 p-4 rounded-xl border-2 transition-colors" :class="n8nStatus?.connected ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5' : 'border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]'">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-[#FF6D5A] flex items-center justify-center">
                    <span class="text-white font-bold text-xs">n8n</span>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-gray-900 dark:text-white">n8n</p>
                    <p class="text-[10px] text-gray-400">{{ t.n8nDesc }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="n8nStatus?.connected" class="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {{ t.n8nConnected }}
                  </span>
                  <span v-else-if="n8nStatus" class="text-[10px] font-bold text-gray-400">{{ t.n8nNotConfigured }}</span>
                  <button class="text-[10px] text-violet-500 hover:text-violet-600 font-semibold cursor-pointer" @click="checkN8n">
                    {{ t.checkConnection }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{{ t.n8nUrl }}</label>
                  <UInput v-model="apiKeys.n8n_url" size="sm" placeholder="http://localhost:5678" class="w-full" />
                </div>
                <div>
                  <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{{ t.n8nApiKey }}</label>
                  <UInput v-model="apiKeys.n8n_api_key" size="sm" type="password" :placeholder="t.apiKeysPlaceholder" class="w-full" />
                </div>
              </div>
              <p v-if="n8nStatus?.connected && n8nStatus.workflowCount != null" class="text-[10px] text-emerald-600 mt-2 font-medium">
                {{ n8nStatus.workflowCount }} {{ t.n8nWorkflows }}
              </p>
            </div>

            <!-- Service API Keys -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="key in apiKeyFields" :key="key.field">
                <label class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">{{ key.label }}</label>
                <div class="flex gap-2">
                  <UInput
                    v-model="apiKeys[key.field]"
                    :type="key.visible ? 'text' : 'password'"
                    size="sm"
                    :placeholder="t.apiKeysPlaceholder"
                    class="flex-1"
                  />
                  <button
                    class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                    @click="key.visible = !key.visible"
                  >
                    <UIcon :name="key.visible ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div class="flex justify-end mt-4">
              <UButton size="sm" color="primary" :loading="savingKeys" @click="saveApiKeys">
                <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 mr-1" />
                {{ t.save }}
              </UButton>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && workflows.length === 0" class="text-center py-16 sm:py-20">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100 dark:ring-violet-500/20">
          <UIcon name="i-heroicons-bolt" class="w-8 h-8 sm:w-10 sm:h-10 text-violet-300" />
        </div>
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-200">{{ t.noWorkflows }}</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">{{ t.createFirst }}</p>
        <UButton color="primary" class="mt-4 font-semibold" @click="showCreateModal = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          {{ t.newWorkflow }}
        </UButton>
      </div>

      <!-- Workflow cards -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="wf in workflows"
          :key="wf.id"
          class="group bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all cursor-pointer overflow-hidden"
          @click="editingWorkflow = wf"
        >
          <div class="h-1.5" :class="typeGradient(wf.type)"></div>
          <div class="p-4 sm:p-5">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="typeConfig(wf.type).bg">
                  <UIcon :name="typeConfig(wf.type).icon" class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-bold text-gray-900 dark:text-white text-sm">{{ wf.name }}</h3>
                  <p class="text-[11px] text-gray-400">{{ typeConfig(wf.type).label }}</p>
                </div>
              </div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="statusBadge(wf.status)">{{ statusLabel(wf.status) }}</span>
            </div>
            <p v-if="wf.description" class="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{{ wf.description }}</p>
            <div class="flex flex-wrap gap-1 mb-3">
              <span
                v-for="node in (wf.nodes || []).slice(0, 5)"
                :key="node.id"
                class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10"
              >{{ node.label }}</span>
              <span v-if="(wf.nodes || []).length > 5" class="text-[10px] text-gray-400">+{{ (wf.nodes || []).length - 5 }}</span>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
              <div class="flex items-center gap-3 text-[11px] text-gray-400">
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-play" class="w-3 h-3" />
                  {{ wf.run_count || 0 }} {{ t.totalRuns.toLowerCase() }}
                </span>
                <span v-if="wf.last_run_at" class="flex items-center gap-1">
                  <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                  {{ timeAgo(wf.last_run_at) }}
                </span>
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-300 hover:text-red-500 transition-colors" @click.stop="handleDelete(wf)">
                  <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Workflow Editor (when editing) ═══ -->
    <div v-else class="space-y-4 sm:space-y-6">
      <!-- Editor toolbar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 px-4 sm:px-5 py-3">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="typeConfig(editingWorkflow.type).bg">
            <UIcon :name="typeConfig(editingWorkflow.type).icon" class="w-4.5 h-4.5 text-white" />
          </div>
          <div class="min-w-0 flex-1">
            <input
              v-model="editingWorkflow.name"
              class="font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none text-sm w-full"
              @blur="saveWorkflow"
            />
            <p class="text-[11px] text-gray-400">{{ typeConfig(editingWorkflow.type).label }} &middot; {{ (editingWorkflow.nodes || []).length }} nodos</p>
          </div>
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <select
            v-model="editingWorkflow.status"
            class="text-xs font-semibold border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1b1b1b] text-gray-700 dark:text-gray-200 rounded-lg px-3 py-1.5 cursor-pointer flex-1 sm:flex-none"
            @change="saveWorkflow"
          >
            <option value="draft">{{ t.workflowDraft }}</option>
            <option value="active">{{ t.workflowActive }}</option>
            <option value="paused">{{ t.workflowPaused }}</option>
          </select>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-play"
            :loading="executing"
            :disabled="(editingWorkflow.nodes || []).length === 0"
            class="font-semibold"
            @click="handleExecute"
          >
            <span class="hidden sm:inline">{{ t.runWorkflow }}</span>
          </UButton>
          <UButton variant="soft" size="sm" icon="i-heroicons-check" @click="saveWorkflow">
            <span class="hidden sm:inline">{{ t.save }}</span>
          </UButton>
          <!-- Engine indicator -->
          <span
            class="hidden sm:flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg"
            :class="n8nStatus?.connected
              ? 'bg-[#FF6D5A]/10 text-[#FF6D5A]'
              : 'bg-gray-100 dark:bg-white/10 text-gray-500'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="n8nStatus?.connected ? 'bg-[#FF6D5A]' : 'bg-gray-400'"></span>
            {{ n8nStatus?.connected ? t.engineN8n : t.engineBuiltin }}
          </span>
        </div>
      </div>

      <!-- Execution result -->
      <div v-if="lastRunResult" class="rounded-xl border p-4" :class="lastRunResult.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'">
        <div class="flex items-center gap-2 mb-2">
          <UIcon
            :name="lastRunResult.status === 'completed' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
            class="w-5 h-5"
            :class="lastRunResult.status === 'completed' ? 'text-emerald-600' : 'text-red-600'"
          />
          <span class="text-sm font-bold" :class="lastRunResult.status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'">
            {{ lastRunResult.status === 'completed' ? t.workflowExecutedOk : t.workflowExecutedError }}
          </span>
          <span v-if="lastRunResult.results?.engine" class="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" :class="lastRunResult.results.engine === 'n8n' ? 'bg-[#FF6D5A]/10 text-[#FF6D5A]' : 'bg-gray-100 dark:bg-white/10 text-gray-500'">
            {{ lastRunResult.results.engine === 'n8n' ? 'n8n' : 'built-in' }}
          </span>
        </div>
        <p v-if="lastRunResult.error" class="text-xs text-red-600 dark:text-red-400">{{ lastRunResult.error }}</p>
        <div v-if="lastRunResult.results" class="mt-2 max-h-48 overflow-auto">
          <pre class="text-[11px] text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/20 rounded-lg p-3">{{ JSON.stringify(lastRunResult.results, null, 2) }}</pre>
        </div>
      </div>

      <!-- Main editor: two-panel layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <!-- Left: Node pipeline canvas -->
        <div class="lg:col-span-3">
          <div class="relative bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 min-h-[400px] sm:min-h-[500px] overflow-hidden">
            <div class="absolute inset-0 opacity-30 dark:opacity-10" style="background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px); background-size: 24px 24px;"></div>

            <div class="relative p-4 sm:p-6">
              <!-- Empty state with node picker -->
              <div v-if="(editingWorkflow.nodes || []).length === 0" class="flex flex-col items-center justify-center py-8 sm:py-14">
                <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-4 ring-1 ring-violet-100 dark:ring-violet-500/20">
                  <UIcon name="i-heroicons-plus" class="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
                </div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1 text-center px-4">{{ t.addNode }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mb-5 text-center max-w-sm">{{ t.workflowAssistantDesc }}</p>

                <!-- Categorized node picker grid (always visible when empty) -->
                <div class="w-full max-w-md space-y-3">
                  <div v-for="cat in nodeCategories" :key="cat.key">
                    <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">{{ cat.label }}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        v-for="nt in cat.nodes"
                        :key="nt.type"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/10 text-left hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all cursor-pointer"
                        @click="addNode(nt.type)"
                      >
                        <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="nt.bg">
                          <UIcon :name="nt.icon" class="w-3.5 h-3.5 text-white" />
                        </div>
                        <div class="min-w-0">
                          <p class="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">{{ nt.label }}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Node flow -->
              <div v-else class="space-y-2">
                <div
                  v-for="(node, idx) in editingWorkflow.nodes"
                  :key="node.id"
                  class="group relative"
                >
                  <!-- Connection line -->
                  <div v-if="idx > 0" class="flex justify-center -mt-0.5 mb-0.5">
                    <div class="w-0.5 h-5 bg-gradient-to-b from-violet-300 to-violet-400 dark:from-violet-500/40 dark:to-violet-500/60 rounded-full"></div>
                  </div>

                  <!-- Node card -->
                  <div
                    class="relative flex items-start gap-3 bg-white dark:bg-[#1b1b1b] rounded-xl border-2 transition-all p-3 sm:p-4 max-w-2xl mx-auto"
                    :class="selectedNodeId === node.id
                      ? 'border-violet-400 dark:border-violet-500 shadow-lg shadow-violet-500/10'
                      : 'border-gray-100 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/20'"
                    @click="selectedNodeId = selectedNodeId === node.id ? null : node.id"
                  >
                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" :class="nodeTypeConfig(node.type).bg">
                      <UIcon :name="nodeTypeConfig(node.type).icon" class="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1 gap-2">
                        <input
                          v-model="node.label"
                          class="font-semibold text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none w-full min-w-0"
                          @blur="saveWorkflow"
                          @click.stop
                        />
                        <div class="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors" @click.stop="moveNode(idx, -1)" :disabled="idx === 0">
                            <UIcon name="i-heroicons-arrow-up" class="w-3.5 h-3.5" />
                          </button>
                          <button class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors" @click.stop="moveNode(idx, 1)" :disabled="idx === editingWorkflow!.nodes.length - 1">
                            <UIcon name="i-heroicons-arrow-down" class="w-3.5 h-3.5" />
                          </button>
                          <button class="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" @click.stop="removeNode(idx)">
                            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" :class="nodeTypeConfig(node.type).badge">
                        {{ nodeTypeConfig(node.type).label }}
                      </span>

                      <!-- Inline node config (collapsed by default) -->
                      <div v-if="selectedNodeId === node.id" class="mt-3 space-y-2.5 border-t border-gray-50 dark:border-white/5 pt-3" @click.stop>
                        <!-- AI Prompt / Agent config -->
                        <template v-if="node.type === 'ai_prompt' || node.type === 'ai_agent'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.model }}</label>
                            <select v-model="node.config.model" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                              <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                              <option value="openai/gpt-4o">GPT-4o</option>
                              <option value="anthropic/claude-sonnet-4">Claude Sonnet 4</option>
                              <option value="anthropic/claude-haiku-4">Claude Haiku 4</option>
                              <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="qwen/qwen3-235b-a22b">Qwen3 235B</option>
                            </select>
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.prompt }}</label>
                            <textarea v-model="node.config.prompt" rows="3" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none" :placeholder="node.type === 'ai_agent' ? t.placeholderAgentTask : t.placeholderPrompt" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Social Post config -->
                        <template v-if="node.type === 'social_post'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.platform }}</label>
                            <div class="flex flex-wrap gap-2 mt-1">
                              <button
                                v-for="sp in socialPlatforms"
                                :key="sp.value"
                                type="button"
                                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                                :class="node.config.platform === sp.value
                                  ? 'border-violet-300 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                                  : 'border-gray-100 dark:border-white/10 text-gray-500 hover:border-gray-200'"
                                @click="node.config.platform = sp.value; saveWorkflow()"
                              >
                                <UIcon :name="sp.icon" class="w-3.5 h-3.5" />
                                {{ sp.label }}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.caption }}</label>
                            <textarea v-model="node.config.caption" rows="2" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none" :placeholder="t.placeholderPostContent" @blur="saveWorkflow" />
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.hashtags }}</label>
                            <UInput v-model="node.config.hashtags" size="sm" placeholder="#focusflow #productivity" class="mt-1" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Video Generate config -->
                        <template v-if="node.type === 'video_generate'">
                          <div class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-lg px-3 py-2 flex items-center gap-2 mb-2">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#111"/><path d="M7 8h10v8H7z" fill="#fff"/><path d="M12 10l3 2-3 2v-4z" fill="#111"/></svg>
                            <span class="text-xs font-bold text-amber-700 dark:text-amber-300">Runway AI</span>
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.runwayModel }}</label>
                            <select v-model="node.config.runway_model" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                              <option value="gen3a_turbo">Gen-3 Alpha Turbo</option>
                              <option value="gen3a">Gen-3 Alpha</option>
                              <option value="gen4_turbo">Gen-4 Turbo</option>
                            </select>
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.prompt }}</label>
                            <textarea v-model="node.config.prompt" rows="3" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none" :placeholder="t.placeholderVideoPrompt" @blur="saveWorkflow" />
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <div>
                              <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.videoDuration }}</label>
                              <select v-model="node.config.duration" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                                <option :value="5">{{ t.seconds5 }}</option>
                                <option :value="10">{{ t.seconds10 }}</option>
                              </select>
                            </div>
                            <div>
                              <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.videoStyle }}</label>
                              <select v-model="node.config.style" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                                <option value="cinematic">Cinematic</option>
                                <option value="anime">Anime</option>
                                <option value="3d_render">3D Render</option>
                                <option value="photorealistic">Photorealistic</option>
                                <option value="watercolor">Watercolor</option>
                              </select>
                            </div>
                          </div>
                        </template>

                        <!-- Image Generate config -->
                        <template v-if="node.type === 'image_generate'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.prompt }}</label>
                            <textarea v-model="node.config.prompt" rows="2" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none" :placeholder="t.placeholderImagePrompt" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Send Email config -->
                        <template v-if="node.type === 'send_email'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.emailTo }}</label>
                            <UInput v-model="node.config.to" size="sm" :placeholder="t.placeholderEmail" class="mt-1" @blur="saveWorkflow" />
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.emailSubject }}</label>
                            <UInput v-model="node.config.subject" size="sm" :placeholder="t.placeholderSubject" class="mt-1" @blur="saveWorkflow" />
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.emailBody }}</label>
                            <textarea v-model="node.config.body" rows="3" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none" :placeholder="t.placeholderEmailBody" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Webhook config -->
                        <template v-if="node.type === 'webhook'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.webhookUrl }}</label>
                            <UInput v-model="node.config.url" size="sm" placeholder="https://..." class="mt-1" @blur="saveWorkflow" />
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.httpMethod }}</label>
                            <select v-model="node.config.method" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                              <option value="POST">POST</option>
                              <option value="GET">GET</option>
                              <option value="PUT">PUT</option>
                            </select>
                          </div>
                        </template>

                        <!-- HTTP Request config -->
                        <template v-if="node.type === 'http_request'">
                          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.httpMethod }}</label>
                              <select v-model="node.config.method" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 cursor-pointer" @change="saveWorkflow">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="PATCH">PATCH</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div class="sm:col-span-2">
                              <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.httpUrl }}</label>
                              <UInput v-model="node.config.url" size="sm" placeholder="https://api.example.com/..." class="mt-1" @blur="saveWorkflow" />
                            </div>
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.httpHeaders }}</label>
                            <textarea v-model="node.config.headers" rows="2" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none font-mono" placeholder='{ "Authorization": "Bearer ..." }' @blur="saveWorkflow" />
                          </div>
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.httpBody }}</label>
                            <textarea v-model="node.config.request_body" rows="2" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none font-mono" placeholder='{ "key": "value" }' @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Delay config -->
                        <template v-if="node.type === 'delay'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.delayNode }} (s)</label>
                            <UInput v-model="node.config.seconds" type="number" size="sm" class="mt-1" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Condition config -->
                        <template v-if="node.type === 'condition'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.conditionNode }}</label>
                            <UInput v-model="node.config.expression" size="sm" placeholder="output.status === 'success'" class="mt-1" @blur="saveWorkflow" />
                          </div>
                        </template>

                        <!-- Transform config -->
                        <template v-if="node.type === 'transform'">
                          <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase">{{ t.transformNode }}</label>
                            <textarea v-model="node.config.template" rows="2" class="w-full text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 mt-1 resize-none font-mono" placeholder="{ result: {{prev.output}} }" @blur="saveWorkflow" />
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add node button at the end -->
                <div class="flex justify-center pt-2">
                  <div v-if="(editingWorkflow!.nodes || []).length > 0" class="w-0.5 h-4 bg-violet-200 dark:bg-violet-500/30 rounded-full mb-2"></div>
                </div>
                <div class="flex justify-center">
                  <div class="relative" data-node-picker>
                    <button
                      class="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-500/30 text-violet-500 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all cursor-pointer text-xs font-semibold"
                      @click.stop="showNodePicker = !showNodePicker"
                    >
                      <UIcon name="i-heroicons-plus-circle" class="w-4 h-4" />
                      {{ t.addNode }}
                    </button>
                    <!-- Node picker dropdown - categorized -->
                    <Transition name="fade">
                      <div v-if="showNodePicker" class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl shadow-black/10 p-3 z-30 w-[320px] sm:w-[380px] max-h-[400px] overflow-y-auto">
                        <div v-for="cat in nodeCategories" :key="cat.key" class="mb-3 last:mb-0">
                          <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-1.5">{{ cat.label }}</p>
                          <div class="grid grid-cols-2 gap-1">
                            <button
                              v-for="nt in cat.nodes"
                              :key="nt.type"
                              class="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                              @click="addNode(nt.type); showNodePicker = false"
                            >
                              <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="nt.bg">
                                <UIcon :name="nt.icon" class="w-3.5 h-3.5 text-white" />
                              </div>
                              <div class="min-w-0">
                                <p class="text-[11px] font-semibold text-gray-700 dark:text-gray-200 truncate">{{ nt.label }}</p>
                                <p class="text-[9px] text-gray-400 truncate">{{ nt.desc }}</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: AI Chat Assistant Panel -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 flex flex-col h-[500px] sm:h-[600px] relative overflow-hidden">
            <!-- Chat header -->
            <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-gray-900 dark:text-white">{{ t.workflowAssistant }}</h3>
                <p class="text-[10px] text-gray-400 truncate">
                  {{ chatSessionId ? t.sessionActive : t.workflowAssistantDesc }}
                </p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                  :title="t.newSession"
                  @click="startNewSession()"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4" />
                </button>
                <button
                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  :class="showSessionList ? 'text-violet-600 bg-violet-50 dark:bg-violet-500/10' : 'text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10'"
                  :title="t.chatHistory"
                  @click="showSessionList = !showSessionList"
                >
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Session list overlay -->
            <div v-if="showSessionList" class="absolute inset-x-0 top-[52px] bottom-0 z-10 bg-white dark:bg-[#1b1b1b] flex flex-col">
              <div class="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <span class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t.chatHistory }}</span>
                <button class="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline" @click="showSessionList = false">{{ t.close }}</button>
              </div>
              <div class="flex-1 overflow-y-auto">
                <div v-if="loadingSessions" class="p-4 text-center text-xs text-gray-400">{{ t.loading }}...</div>
                <div v-else-if="chatSessions.length === 0" class="p-6 text-center text-xs text-gray-400">{{ t.noSessions }}</div>
                <button
                  v-for="session in chatSessions"
                  :key="session.id"
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                  :class="chatSessionId === session.id ? 'bg-violet-50 dark:bg-violet-500/10' : ''"
                  @click="loadSession(session)"
                >
                  <UIcon name="i-heroicons-chat-bubble-left-right" class="w-4 h-4 text-gray-400 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{{ session.title }}</p>
                    <p class="text-[10px] text-gray-400">{{ new Date(session.updated_at).toLocaleDateString() }}</p>
                  </div>
                  <button
                    class="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    @click.stop="deleteSession(session.id)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                  </button>
                </button>
              </div>
            </div>

            <!-- Chat messages -->
            <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
              <!-- Welcome message -->
              <div v-if="chatMessages.length === 0" class="space-y-3">
                <div class="flex gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5">
                    <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-white" />
                  </div>
                  <div class="bg-gray-50 dark:bg-white/5 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                    <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{{ t.workflowChatWelcome }}</p>
                  </div>
                </div>
                <!-- Quick suggestions -->
                <div class="flex flex-wrap gap-2 pl-9">
                  <button
                    v-for="(sug, i) in chatSuggestions"
                    :key="i"
                    class="text-[11px] font-medium px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors cursor-pointer"
                    @click="sendChatMessage(sug)"
                  >
                    {{ sug }}
                  </button>
                </div>
              </div>

              <!-- Messages -->
              <template v-for="(msg, i) in chatMessages" :key="i">
                <!-- User message -->
                <div v-if="msg.role === 'user'" class="flex justify-end">
                  <div class="bg-violet-600 text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%]">
                    <p class="text-xs leading-relaxed">{{ msg.content }}</p>
                  </div>
                </div>
                <!-- Assistant message -->
                <div v-else class="flex gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5">
                    <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-white" />
                  </div>
                  <div class="space-y-2 max-w-[85%]">
                    <div class="bg-gray-50 dark:bg-white/5 rounded-xl rounded-tl-sm px-3.5 py-2.5">
                      <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
                    </div>
                    <!-- Action indicator -->
                    <div v-if="msg.actionsApplied" class="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
                      {{ t.workflowNodesApplied }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- Typing indicator -->
              <div v-if="chatLoading" class="flex gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0 mt-0.5">
                  <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div class="bg-gray-50 dark:bg-white/5 rounded-xl rounded-tl-sm px-3.5 py-2.5">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat input -->
            <div class="border-t border-gray-100 dark:border-white/10 p-3 shrink-0">
              <div class="flex gap-2">
                <input
                  v-model="chatInput"
                  class="flex-1 text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-violet-300 dark:focus:ring-violet-500/40 placeholder:text-gray-400"
                  :placeholder="t.workflowChatPlaceholder"
                  @keydown.enter.prevent="sendChatMessage(chatInput)"
                />
                <button
                  class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                  :disabled="!chatInput.trim() || chatLoading"
                  @click="sendChatMessage(chatInput)"
                >
                  <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workflow, WorkflowType, WorkflowStatus, WorkflowNodeType, WorkflowNode } from '~/types'

const store = useWorkspaceStore()
const { labels: tRef } = useLanguage()
const t = tRef
const { canUseWorkflows, canManageWorkflows } = usePermissions()

const workflows = ref<Workflow[]>([])
const loading = ref(true)
const creating = ref(false)
const executing = ref(false)
const showCreateModal = ref(false)
const editingWorkflow = ref<Workflow | null>(null)
const selectedNodeId = ref<string | null>(null)
const showNodePicker = ref(false)
const showApiKeys = ref(false)
const savingKeys = ref(false)
const n8nStatus = ref<{ connected: boolean; reason?: string; url?: string; workflowCount?: number } | null>(null)

// Chat assistant state
const chatContainer = ref<HTMLElement | null>(null)
const chatInput = ref('')
const chatLoading = ref(false)
const chatMessages = ref<{ role: 'user' | 'assistant'; content: string; actionsApplied?: boolean }[]>([])
const chatSessionId = ref<string | null>(null)
const chatSessions = ref<{ id: string; title: string; updated_at: string }[]>([])
const showSessionList = ref(false)
const loadingSessions = ref(false)

const chatSuggestions = computed(() => [
  t.value.workflowSuggestion1,
  t.value.workflowSuggestion2,
  t.value.workflowSuggestion3,
])

const apiKeyFields = reactive([
  { field: 'openrouter', label: 'OpenRouter', visible: false },
  { field: 'runway', label: 'Runway AI', visible: false },
  { field: 'instagram', label: 'Instagram', visible: false },
  { field: 'twitter', label: 'Twitter / X', visible: false },
  { field: 'linkedin', label: 'LinkedIn', visible: false },
  { field: 'tiktok', label: 'TikTok', visible: false },
])

const apiKeys = reactive<Record<string, string>>({
  openrouter: '',
  runway: '',
  instagram: '',
  twitter: '',
  linkedin: '',
  tiktok: '',
  n8n_url: '',
  n8n_api_key: '',
})
const lastRunResult = ref<{ status: string; error?: string; results?: Record<string, unknown> } | null>(null)

const createForm = reactive({
  name: '',
  description: '',
  type: 'ai_agent' as WorkflowType,
  templateNodes: [] as any[],
})

// ── Workflow type configs ──

const workflowTypes = computed(() => [
  { value: 'ai_agent' as WorkflowType, label: t.value.aiAgentWorkflow, icon: 'i-heroicons-cpu-chip', bg: 'bg-gradient-to-br from-violet-500 to-indigo-600' },
  { value: 'social_media' as WorkflowType, label: t.value.socialMediaWorkflow, icon: 'i-heroicons-megaphone', bg: 'bg-gradient-to-br from-pink-500 to-rose-600' },
  { value: 'video_creation' as WorkflowType, label: t.value.videoCreationWorkflow, icon: 'i-heroicons-film', bg: 'bg-gradient-to-br from-amber-500 to-orange-600' },
])

function typeConfig(type: WorkflowType) {
  return workflowTypes.value.find(w => w.value === type) || workflowTypes.value[0]
}

function typeGradient(type: WorkflowType) {
  const map: Record<WorkflowType, string> = {
    ai_agent: 'bg-gradient-to-r from-violet-500 to-indigo-500',
    social_media: 'bg-gradient-to-r from-pink-500 to-rose-500',
    video_creation: 'bg-gradient-to-r from-amber-500 to-orange-500',
  }
  return map[type] || map.ai_agent
}

function statusBadge(status: WorkflowStatus) {
  const map: Record<WorkflowStatus, string> = {
    draft: 'bg-gray-100 dark:bg-white/10 text-gray-500',
    active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
    paused: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
    completed: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    failed: 'bg-red-50 dark:bg-red-500/10 text-red-600',
  }
  return map[status] || map.draft
}

function statusLabel(status: WorkflowStatus) {
  const map: Record<string, string> = {
    draft: t.value.workflowDraft,
    active: t.value.workflowActive,
    paused: t.value.workflowPaused,
    completed: t.value.workflowCompleted,
    failed: t.value.workflowFailed,
  }
  return map[status] || status
}

// ── Node type configs ──

const nodeTypesMap = computed<Record<WorkflowNodeType, { label: string; icon: string; bg: string; badge: string; desc: string }>>(() => ({
  trigger: { label: t.value.triggerNode, icon: 'i-heroicons-bolt', bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600', desc: t.value.triggerNodeDesc },
  ai_prompt: { label: t.value.aiPromptNode, icon: 'i-heroicons-sparkles', bg: 'bg-gradient-to-br from-violet-500 to-purple-600', badge: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600', desc: t.value.aiPromptNodeDesc },
  ai_agent: { label: t.value.aiAgentNode, icon: 'i-heroicons-cpu-chip', bg: 'bg-gradient-to-br from-indigo-500 to-blue-600', badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600', desc: t.value.aiAgentNodeDesc },
  social_post: { label: t.value.socialPostNode, icon: 'i-heroicons-megaphone', bg: 'bg-gradient-to-br from-pink-500 to-rose-600', badge: 'bg-pink-50 dark:bg-pink-500/10 text-pink-600', desc: t.value.socialPostNodeDesc },
  video_generate: { label: t.value.videoGenerateNode, icon: 'i-heroicons-film', bg: 'bg-gradient-to-br from-amber-500 to-orange-600', badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600', desc: t.value.videoGenerateNodeDesc },
  image_generate: { label: t.value.imageGenerateNode, icon: 'i-heroicons-photo', bg: 'bg-gradient-to-br from-cyan-500 to-teal-600', badge: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600', desc: t.value.imageGenerateNodeDesc },
  send_email: { label: t.value.sendEmailNode, icon: 'i-heroicons-envelope', bg: 'bg-gradient-to-br from-sky-500 to-blue-600', badge: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600', desc: t.value.sendEmailNodeDesc },
  webhook: { label: t.value.webhookNode, icon: 'i-heroicons-globe-alt', bg: 'bg-gradient-to-br from-orange-500 to-red-600', badge: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600', desc: t.value.webhookNodeDesc },
  http_request: { label: t.value.httpRequestNode, icon: 'i-heroicons-arrow-path', bg: 'bg-gradient-to-br from-teal-500 to-cyan-600', badge: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600', desc: t.value.httpRequestNodeDesc },
  condition: { label: t.value.conditionNode, icon: 'i-heroicons-arrows-right-left', bg: 'bg-gradient-to-br from-gray-500 to-gray-600', badge: 'bg-gray-100 dark:bg-white/10 text-gray-600', desc: t.value.conditionNodeDesc },
  delay: { label: t.value.delayNode, icon: 'i-heroicons-clock', bg: 'bg-gradient-to-br from-slate-400 to-slate-500', badge: 'bg-slate-50 dark:bg-slate-500/10 text-slate-600', desc: t.value.delayNodeDesc },
  transform: { label: t.value.transformNode, icon: 'i-heroicons-arrows-pointing-in', bg: 'bg-gradient-to-br from-emerald-500 to-green-600', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600', desc: t.value.transformNodeDesc },
  output: { label: t.value.outputNode, icon: 'i-heroicons-arrow-down-tray', bg: 'bg-gradient-to-br from-blue-500 to-sky-600', badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600', desc: t.value.outputNodeDesc },
}))

function nodeTypeConfig(type: WorkflowNodeType) {
  return nodeTypesMap.value[type] || nodeTypesMap.value.output
}

const availableNodeTypes = computed(() =>
  Object.entries(nodeTypesMap.value).map(([type, cfg]) => ({ type: type as WorkflowNodeType, ...cfg }))
)

// Categorized node types for responsive picker
const nodeCategories = computed(() => {
  const all = availableNodeTypes.value
  const byType = (types: WorkflowNodeType[]) => all.filter(n => types.includes(n.type))
  return [
    { key: 'ai', label: t.value.catAI, nodes: byType(['trigger', 'ai_prompt', 'ai_agent']) },
    { key: 'social', label: t.value.catSocial, nodes: byType(['social_post']) },
    { key: 'media', label: t.value.catMedia, nodes: byType(['video_generate', 'image_generate']) },
    { key: 'integrations', label: t.value.catIntegrations, nodes: byType(['send_email', 'webhook', 'http_request']) },
    { key: 'logic', label: t.value.catLogic, nodes: byType(['condition', 'delay', 'transform', 'output']) },
  ]
})

const socialPlatforms = [
  { value: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { value: 'twitter', label: 'X / Twitter', icon: 'i-simple-icons-x' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  { value: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
]

// ── Templates ──

const templates = computed(() => [
  {
    id: 'content-calendar',
    name: t.value.templateContentCalendar,
    desc: t.value.templateContentDesc,
    type: 'social_media' as WorkflowType,
    icon: 'i-heroicons-calendar-days',
    bg: 'bg-gradient-to-br from-pink-500 to-rose-600',
    nodes: [
      { id: 'n1', type: 'ai_prompt' as WorkflowNodeType, label: 'Generar contenido', config: { model: 'openai/gpt-4o-mini', prompt: 'Generate a professional social media post about productivity tips. Include emojis and hashtags.' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'image_generate' as WorkflowNodeType, label: 'Generar imagen', config: { prompt: 'A clean, modern productivity workspace with a laptop and coffee' }, position: { x: 0, y: 1 } },
      { id: 'n3', type: 'social_post' as WorkflowNodeType, label: 'Publicar en Instagram', config: { platform: 'instagram', caption: '', hashtags: '#productivity #focusflow' }, position: { x: 0, y: 2 } },
      { id: 'n4', type: 'social_post' as WorkflowNodeType, label: 'Publicar en Twitter', config: { platform: 'twitter', caption: '', hashtags: '' }, position: { x: 0, y: 3 } },
    ],
  },
  {
    id: 'video-series',
    name: t.value.templateVideoSeries,
    desc: t.value.templateVideoDesc,
    type: 'video_creation' as WorkflowType,
    icon: 'i-heroicons-film',
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    nodes: [
      { id: 'n1', type: 'ai_prompt' as WorkflowNodeType, label: 'Escribir script', config: { model: 'openai/gpt-4o', prompt: 'Write a 10-second video script for a product showcase. Be visual and cinematic.' }, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'video_generate' as WorkflowNodeType, label: 'Generar video', config: { runway_model: 'gen3a_turbo', prompt: '', duration: 10, style: 'cinematic' }, position: { x: 0, y: 1 } },
      { id: 'n3', type: 'social_post' as WorkflowNodeType, label: 'Publicar en TikTok', config: { platform: 'tiktok', caption: '', hashtags: '#viral #ai' }, position: { x: 0, y: 2 } },
    ],
  },
  {
    id: 'agent-pipeline',
    name: t.value.templateAgentPipeline,
    desc: t.value.templateAgentDesc,
    type: 'ai_agent' as WorkflowType,
    icon: 'i-heroicons-cpu-chip',
    bg: 'bg-gradient-to-br from-violet-500 to-indigo-600',
    nodes: [
      { id: 'n1', type: 'trigger' as WorkflowNodeType, label: 'Inicio', config: {}, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'ai_agent' as WorkflowNodeType, label: 'Agente investigador', config: { model: 'openai/gpt-4o', prompt: 'Research and analyze the latest trends in AI automation for project management.' }, position: { x: 0, y: 1 } },
      { id: 'n3', type: 'transform' as WorkflowNodeType, label: 'Formatear resultados', config: { template: '' }, position: { x: 0, y: 2 } },
      { id: 'n4', type: 'ai_prompt' as WorkflowNodeType, label: 'Generar resumen', config: { model: 'openai/gpt-4o-mini', prompt: 'Summarize the following research into a concise executive brief.' }, position: { x: 0, y: 3 } },
      { id: 'n5', type: 'output' as WorkflowNodeType, label: 'Resultado final', config: {}, position: { x: 0, y: 4 } },
    ],
  },
])

const filteredTemplates = computed(() =>
  templates.value.filter(tmpl => tmpl.type === createForm.type)
)

// ── Stats ──

const stats = computed(() => [
  { label: 'Total', value: workflows.value.length, color: 'text-gray-900 dark:text-white' },
  { label: t.value.workflowActive, value: workflows.value.filter(w => w.status === 'active').length, color: 'text-emerald-600' },
  { label: t.value.workflowDraft, value: workflows.value.filter(w => w.status === 'draft').length, color: 'text-gray-500' },
  { label: t.value.totalRuns, value: workflows.value.reduce((sum, w) => sum + (w.run_count || 0), 0), color: 'text-violet-600' },
])

// ── Helpers ──

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function generateId() {
  return 'n_' + Math.random().toString(36).slice(2, 10)
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

// ── API Keys ──

function loadApiKeys() {
  const cfg = (store.workspace as any)?.ai_config || {}
  const keys = cfg.workflow_api_keys || {}
  for (const k of Object.keys(apiKeys)) {
    apiKeys[k] = keys[k] || ''
  }
  // Also load n8n config from workspace level
  apiKeys.n8n_url = (cfg.n8n_url as string) || ''
  apiKeys.n8n_api_key = (cfg.n8n_api_key as string) || ''
}

async function saveApiKeys() {
  if (!store.workspace?.id) return
  savingKeys.value = true
  try {
    const currentConfig = (store.workspace as any)?.ai_config || {}
    const { n8n_url, n8n_api_key, ...serviceKeys } = apiKeys
    await $fetch(`/api/workspaces/${store.workspace.id}`, {
      method: 'PATCH',
      body: {
        ai_config: {
          ...currentConfig,
          workflow_api_keys: { ...serviceKeys },
          n8n_url: n8n_url || null,
          n8n_api_key: n8n_api_key || null,
        },
      },
    })
    await store.loadWorkspace(store.slug)
    // Re-check n8n after saving
    await checkN8n()
  } catch {}
  finally { savingKeys.value = false }
}

async function checkN8n() {
  if (!store.workspace?.id) return
  try {
    n8nStatus.value = await $fetch(`/api/workspaces/${store.workspace.id}/workflows/n8n-status`)
  } catch {
    n8nStatus.value = { connected: false, reason: 'error' }
  }
}

async function loadWorkflows() {
  if (!store.workspace?.id) return
  loading.value = true
  try {
    workflows.value = await $fetch<Workflow[]>(`/api/workspaces/${store.workspace.id}/workflows`)
  } catch { workflows.value = [] }
  finally { loading.value = false }
}

onMounted(() => { loadWorkflows(); loadApiKeys(); checkN8n() })
watch(() => store.workspace?.id, () => { loadWorkflows(); loadApiKeys(); checkN8n() })

// Reset chat when switching workflows
watch(editingWorkflow, (wf) => {
  chatMessages.value = []
  chatInput.value = ''
  chatSessionId.value = null
  showSessionList.value = false
  selectedNodeId.value = null
  showNodePicker.value = false
  lastRunResult.value = null
  if (wf) loadChatSessions(wf.id)
})

// Close node picker on click outside
function onClickOutsideNodePicker(e: MouseEvent) {
  if (showNodePicker.value) {
    const target = e.target as HTMLElement
    if (!target.closest('[data-node-picker]')) {
      showNodePicker.value = false
    }
  }
}
onMounted(() => document.addEventListener('click', onClickOutsideNodePicker))
onUnmounted(() => document.removeEventListener('click', onClickOutsideNodePicker))

// ── CRUD ──

async function handleCreate() {
  if (!store.workspace?.id || !createForm.name.trim()) return
  creating.value = true
  try {
    const wf = await $fetch<Workflow>(`/api/workspaces/${store.workspace.id}/workflows`, {
      method: 'POST',
      body: {
        name: createForm.name,
        description: createForm.description || null,
        type: createForm.type,
        nodes: createForm.templateNodes.length > 0 ? createForm.templateNodes : [],
      },
    })
    workflows.value.unshift(wf)
    showCreateModal.value = false
    editingWorkflow.value = wf
    createForm.name = ''
    createForm.description = ''
    createForm.type = 'ai_agent'
    createForm.templateNodes = []
  } catch {}
  finally { creating.value = false }
}

function applyTemplate(tmpl: typeof templates.value[0]) {
  createForm.name = tmpl.name
  createForm.type = tmpl.type
  createForm.templateNodes = tmpl.nodes
}

async function saveWorkflow() {
  if (!store.workspace?.id || !editingWorkflow.value) return
  try {
    await $fetch(`/api/workspaces/${store.workspace.id}/workflows/${editingWorkflow.value.id}`, {
      method: 'PATCH',
      body: {
        name: editingWorkflow.value.name,
        description: editingWorkflow.value.description,
        status: editingWorkflow.value.status,
        nodes: editingWorkflow.value.nodes,
      },
    })
    const idx = workflows.value.findIndex(w => w.id === editingWorkflow.value!.id)
    if (idx !== -1) workflows.value[idx] = { ...editingWorkflow.value }
  } catch {}
}

async function handleDelete(wf: Workflow) {
  if (!store.workspace?.id) return
  if (!confirm(`${t.value.delete} "${wf.name}"?`)) return
  try {
    await $fetch(`/api/workspaces/${store.workspace.id}/workflows/${wf.id}`, { method: 'DELETE' })
    workflows.value = workflows.value.filter(w => w.id !== wf.id)
    if (editingWorkflow.value?.id === wf.id) editingWorkflow.value = null
  } catch {}
}

async function handleExecute() {
  if (!store.workspace?.id || !editingWorkflow.value) return
  executing.value = true
  lastRunResult.value = null
  try {
    const result = await $fetch<{ status: string; error?: string; results?: Record<string, unknown> }>(
      `/api/workspaces/${store.workspace.id}/workflows/${editingWorkflow.value.id}/execute`,
      { method: 'POST' }
    )
    lastRunResult.value = result
    editingWorkflow.value.run_count = (editingWorkflow.value.run_count || 0) + 1
    editingWorkflow.value.last_run_at = new Date().toISOString()
  } catch (e: any) {
    lastRunResult.value = { status: 'failed', error: e.data?.message || t.value.executionFailed }
  } finally { executing.value = false }
}

// ── Node operations ──

function getDefaultConfig(type: WorkflowNodeType): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    ai_prompt: { model: 'openai/gpt-4o-mini', prompt: '' },
    ai_agent: { model: 'openai/gpt-4o-mini', prompt: '' },
    social_post: { platform: 'twitter', caption: '', hashtags: '' },
    video_generate: { runway_model: 'gen3a_turbo', prompt: '', duration: 5, style: 'cinematic' },
    image_generate: { prompt: '' },
    send_email: { to: '', subject: '', body: '' },
    webhook: { url: '', method: 'POST' },
    http_request: { method: 'GET', url: '', headers: '', request_body: '' },
    delay: { seconds: 5 },
    condition: { expression: '' },
    transform: { template: '' },
  }
  return { ...(defaults[type] || {}) }
}

function addNode(type: WorkflowNodeType) {
  if (!editingWorkflow.value) return
  if (!editingWorkflow.value.nodes) editingWorkflow.value.nodes = []

  const cfg = nodeTypeConfig(type)
  const node: WorkflowNode = {
    id: generateId(),
    type,
    label: cfg.label,
    config: getDefaultConfig(type),
    position: { x: 0, y: editingWorkflow.value.nodes.length },
  }

  editingWorkflow.value.nodes = [...editingWorkflow.value.nodes, node]
  selectedNodeId.value = node.id
  saveWorkflow()
}

function addNodeFromAI(type: WorkflowNodeType, label: string, config: Record<string, unknown>) {
  if (!editingWorkflow.value) return
  if (!editingWorkflow.value.nodes) editingWorkflow.value.nodes = []

  const defaults = getDefaultConfig(type)
  const node: WorkflowNode = {
    id: generateId(),
    type,
    label: label || nodeTypeConfig(type).label,
    config: { ...defaults, ...config },
    position: { x: 0, y: editingWorkflow.value.nodes.length },
  }

  editingWorkflow.value.nodes = [...editingWorkflow.value.nodes, node]
}

function removeNode(idx: number) {
  if (!editingWorkflow.value) return
  const node = editingWorkflow.value.nodes[idx]
  if (selectedNodeId.value === node.id) selectedNodeId.value = null
  editingWorkflow.value.nodes = editingWorkflow.value.nodes.filter((_, i) => i !== idx)
  saveWorkflow()
}

function moveNode(idx: number, dir: number) {
  if (!editingWorkflow.value) return
  const nodes = [...editingWorkflow.value.nodes]
  const targetIdx = idx + dir
  if (targetIdx < 0 || targetIdx >= nodes.length) return
  ;[nodes[idx], nodes[targetIdx]] = [nodes[targetIdx], nodes[idx]]
  editingWorkflow.value.nodes = nodes
  saveWorkflow()
}

// ── Chat assistant ──

async function sendChatMessage(message: string) {
  if (!message.trim() || chatLoading.value || !store.workspace?.id || !editingWorkflow.value) return

  const userMsg = message.trim()
  chatInput.value = ''
  chatMessages.value.push({ role: 'user', content: userMsg })
  scrollChatToBottom()

  chatLoading.value = true
  try {
    const result = await $fetch<{ message?: string; actions?: any[]; sessionId?: string }>(
      `/api/workspaces/${store.workspace.id}/workflows/assist`,
      {
        method: 'POST',
        body: {
          message: userMsg,
          currentNodes: editingWorkflow.value.nodes || [],
          workflowType: editingWorkflow.value.type,
          workflowId: editingWorkflow.value.id,
          sessionId: chatSessionId.value,
          history: chatMessages.value.slice(-10).map(m => ({ role: m.role, content: m.content })),
        },
      }
    )

    // Track session ID
    if (result.sessionId) chatSessionId.value = result.sessionId

    let actionsApplied = false

    if (result.actions && Array.isArray(result.actions) && result.actions.length > 0) {
      for (const action of result.actions) {
        if (action.action === 'add' && action.node) {
          addNodeFromAI(
            action.node.type as WorkflowNodeType,
            action.node.label || '',
            action.node.config || {}
          )
          actionsApplied = true
        } else if (action.action === 'remove' && typeof action.index === 'number') {
          if (editingWorkflow.value.nodes[action.index]) {
            editingWorkflow.value.nodes = editingWorkflow.value.nodes.filter((_, i) => i !== action.index)
            actionsApplied = true
          }
        } else if (action.action === 'update' && typeof action.index === 'number' && action.changes) {
          const node = editingWorkflow.value.nodes[action.index]
          if (node) {
            if (action.changes.label) node.label = action.changes.label
            if (action.changes.config) node.config = { ...node.config, ...action.changes.config }
            editingWorkflow.value.nodes = [...editingWorkflow.value.nodes]
            actionsApplied = true
          }
        } else if (action.action === 'replace_all' && Array.isArray(action.nodes)) {
          editingWorkflow.value.nodes = action.nodes.map((n: any, i: number) => ({
            id: generateId(),
            type: n.type || 'output',
            label: n.label || nodeTypeConfig(n.type || 'output').label,
            config: { ...getDefaultConfig(n.type || 'output'), ...(n.config || {}) },
            position: { x: 0, y: i },
          }))
          actionsApplied = true
        }
      }

      if (actionsApplied) {
        await saveWorkflow()
      }
    }

    chatMessages.value.push({
      role: 'assistant',
      content: result.message || 'OK',
      actionsApplied,
    })
  } catch (e: any) {
    chatMessages.value.push({
      role: 'assistant',
      content: e.data?.message || 'Error al procesar la solicitud',
    })
  } finally {
    chatLoading.value = false
    scrollChatToBottom()
  }
}

// ── Chat Sessions ──

async function loadChatSessions(workflowId?: string) {
  if (!store.workspace?.id) return
  loadingSessions.value = true
  try {
    const params = workflowId ? `?workflow_id=${workflowId}` : ''
    chatSessions.value = await $fetch(`/api/workspaces/${store.workspace.id}/chat-sessions${params}`)
  } catch { chatSessions.value = [] }
  finally { loadingSessions.value = false }
}

async function loadSession(session: { id: string; title: string }) {
  if (!store.workspace?.id) return
  try {
    const data = await $fetch<{ id: string; messages: any[] }>(
      `/api/workspaces/${store.workspace.id}/chat-sessions/${session.id}`
    )
    chatSessionId.value = data.id
    chatMessages.value = (data.messages || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
      actionsApplied: m.hasActions || false,
    }))
    showSessionList.value = false
    nextTick(() => scrollChatToBottom())
  } catch {}
}

function startNewSession() {
  chatSessionId.value = null
  chatMessages.value = []
  chatInput.value = ''
  showSessionList.value = false
}

async function deleteSession(sessionId: string) {
  if (!store.workspace?.id) return
  try {
    await $fetch(`/api/workspaces/${store.workspace.id}/chat-sessions/${sessionId}`, { method: 'DELETE' })
    chatSessions.value = chatSessions.value.filter(s => s.id !== sessionId)
    if (chatSessionId.value === sessionId) startNewSession()
  } catch {}
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
