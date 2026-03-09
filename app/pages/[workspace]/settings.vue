<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-8 animate-fade-up">{{ t.settingsTitle }}</h1>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">{{ t.loading }}</span>
      </div>
    </div>

    <div v-else class="space-y-6 max-w-2xl animate-fade-up delay-100">
      <!-- Workspace settings -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-200/80 dark:border-white/10">
          <h2 class="font-bold text-gray-900 dark:text-white">Workspace</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t.workspaceConfig }}</p>
        </div>
        <div class="p-6 space-y-4">
          <UFormField :label="t.name">
            <UInput v-model="wsName" class="w-full" size="lg" />
          </UFormField>
          <UFormField :label="t.slugUrl">
            <UInput :model-value="wsSlug" disabled class="w-full opacity-60" />
          </UFormField>
          <div class="flex justify-end">
            <UButton color="primary" :loading="savingWs" class="font-semibold" @click="saveWorkspace">
              {{ t.saveChanges }}
            </UButton>
          </div>
          <p v-if="wsSaved" class="text-sm text-emerald-700 dark:text-emerald-400">{{ t.savedSuccess }}</p>
        </div>
      </div>

      <!-- Profile -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-200/80 dark:border-white/10">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ t.yourProfile }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t.accountInfo }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full bg-focusflow-100 dark:bg-focusflow-500/20 text-focusflow-800 dark:text-focusflow-300 flex items-center justify-center font-bold text-xl">
              {{ userInitials }}
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">{{ currentUser?.email }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ memberRole }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Translations -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-200/80 dark:border-white/10">
          <h2 class="font-bold text-gray-900 dark:text-white">{{ lang.language.value === 'en' ? 'Auto-Translate Tasks' : lang.language.value === 'ur' ? 'ٹاسک خودکار ترجمہ' : 'Auto-Traducir Tareas' }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ lang.language.value === 'en' ? 'Translate all existing tasks that are missing translations (EN/UR)' : lang.language.value === 'ur' ? 'تمام موجودہ ٹاسک جن میں ترجمہ نہیں ہے ان کا ترجمہ کریں' : 'Traducir todas las tareas existentes sin traduccion (EN/UR)' }}</p>
        </div>
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p v-if="translateResult" class="text-sm text-emerald-600 dark:text-emerald-400">
                {{ lang.language.value === 'en' ? `Translated ${translateResult.translated} tasks. ${translateResult.remaining} remaining.` : `${translateResult.translated} tareas traducidas. ${translateResult.remaining} pendientes.` }}
              </p>
              <p v-if="translateError" class="text-sm text-red-500">{{ translateError }}</p>
            </div>
            <UButton color="primary" variant="soft" size="sm" :loading="translating" @click="batchTranslate">
              <UIcon name="i-heroicons-language" class="w-4 h-4 mr-1" />
              {{ lang.language.value === 'en' ? 'Translate All' : lang.language.value === 'ur' ? 'سب ترجمہ کریں' : 'Traducir Todo' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- API Tokens / MCP -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-gray-200/80 dark:border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-key" class="w-5 h-5 text-focusflow-500" />
              <h2 class="font-bold text-gray-900 dark:text-white">API Tokens (MCP)</h2>
            </div>
            <NuxtLink :to="`/${store.slug}/integrations`" class="text-xs text-focusflow-600 dark:text-focusflow-400 hover:underline flex items-center gap-1">
              <UIcon name="i-heroicons-puzzle-piece" class="w-3.5 h-3.5" />
              {{ lang.language.value === 'en' ? 'Full setup guide' : 'Guia completa' }}
              <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
            </NuxtLink>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ lang.language.value === 'en' ? 'Create tokens to connect Claude, Cursor, Windsurf, Cline, Gemini or other MCP clients' : 'Crea tokens para conectar Claude, Cursor, Windsurf, Cline, Gemini u otros clientes MCP' }}
          </p>
        </div>
        <div class="p-6 space-y-4">
          <!-- Create new token -->
          <div class="flex flex-col sm:flex-row gap-2">
            <UInput v-model="newTokenName" :placeholder="lang.language.value === 'en' ? 'Token name (e.g. Cursor IDE)' : 'Nombre del token (ej. Cursor IDE)'" class="flex-1" size="sm" />
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" v-model="newTokenWrite" class="rounded border-gray-300 dark:border-gray-600 text-focusflow-500 focus:ring-focusflow-500" />
                {{ lang.language.value === 'en' ? 'Write' : 'Escritura' }}
              </label>
              <UButton color="primary" size="sm" :loading="creatingToken" :disabled="!newTokenName.trim()" @click="createToken">
                <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1" />
                {{ lang.language.value === 'en' ? 'Create' : 'Crear' }}
              </UButton>
            </div>
          </div>

          <!-- Show newly created token + ALL client configs -->
          <div v-if="createdToken" class="space-y-3">
            <div class="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
              <p class="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                {{ lang.language.value === 'en' ? 'Token created! Copy it now — it won\'t be shown again.' : 'Token creado! Copialo ahora — no se mostrara de nuevo.' }}
              </p>
              <div class="flex items-center gap-2">
                <code class="flex-1 text-xs bg-white dark:bg-black/30 rounded-lg px-3 py-2 font-mono text-gray-900 dark:text-gray-100 break-all select-all border border-emerald-200 dark:border-emerald-500/20">{{ createdToken }}</code>
                <UButton variant="soft" size="xs" @click="copyToClipboard(createdToken)">
                  <UIcon name="i-heroicons-clipboard-document" class="w-4 h-4" />
                </UButton>
              </div>
            </div>

            <!-- Client configs grid -->
            <div class="grid grid-cols-1 gap-2">
              <div v-for="client in mcpClientConfigs" :key="client.key"
                class="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-xl p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 rounded flex items-center justify-center" :class="client.iconBg">
                      <UIcon :name="client.icon" class="w-3 h-3" :class="client.iconColor" />
                    </div>
                    <span class="text-xs font-semibold text-gray-900 dark:text-white">{{ client.name }}</span>
                    <span class="text-[9px] text-gray-500 dark:text-gray-400 font-mono">{{ client.file }}</span>
                  </div>
                  <button
                    class="w-6 h-6 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                    @click="copyToClipboard(client.config, client.key)"
                  >
                    <UIcon :name="copiedKey === client.key ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <pre class="bg-gray-900 dark:bg-black/50 text-emerald-400 text-[10px] leading-relaxed rounded-lg px-3 py-2 overflow-x-auto font-mono select-all">{{ client.config }}</pre>
              </div>
            </div>
          </div>

          <!-- Token list -->
          <div v-if="apiTokens.length > 0" class="space-y-2">
            <div
              v-for="tk in apiTokens" :key="tk.id"
              class="flex items-center justify-between bg-gray-50 dark:bg-white/[0.03] rounded-xl px-4 py-3 border border-gray-100 dark:border-white/[0.06]"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded-lg bg-focusflow-100 dark:bg-focusflow-500/20 flex items-center justify-center shrink-0">
                  <UIcon name="i-heroicons-key" class="w-4 h-4 text-focusflow-600 dark:text-focusflow-400" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ tk.name }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <code class="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{{ tk.token_prefix }}...</code>
                    <span v-for="s in tk.scopes" :key="s" class="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                      :class="s === 'write' || s === 'admin' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'">
                      {{ s }}
                    </span>
                    <span v-if="tk.last_used_at" class="text-[9px] text-gray-500 dark:text-gray-400">
                      {{ lang.language.value === 'en' ? 'Last used' : 'Ultimo uso' }}: {{ new Date(tk.last_used_at).toLocaleDateString() }}
                    </span>
                  </div>
                </div>
              </div>
              <UButton variant="ghost" color="error" size="xs" @click="deleteToken(tk.id)">
                <UIcon name="i-heroicons-trash" class="w-4 h-4" />
              </UButton>
            </div>
          </div>

          <div v-else-if="!createdToken" class="text-center py-4">
            <UIcon name="i-heroicons-key" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ lang.language.value === 'en' ? 'No API tokens yet' : 'Sin tokens API aun' }}</p>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="bg-white dark:bg-[#1b1b1b] rounded-2xl border border-red-200 dark:border-red-500/30 overflow-hidden shadow-card">
        <div class="px-6 py-4 border-b border-red-200 dark:border-red-500/20">
          <h2 class="font-bold text-red-600">{{ t.dangerZone }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ t.irreversibleActions }}</p>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-sm text-gray-900 dark:text-white">{{ t.logout }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.logoutDesc }}</p>
            </div>
            <UButton variant="outline" color="error" size="sm" @click="handleLogout">
              {{ t.logout }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const lang = useLanguage()
const t = lang.labels
const router = useRouter()
const store = useWorkspaceStore()
const auth = useAuthStore()
const currentUser = useSupabaseUser()
const supabase = useSupabaseClient()

const loading = ref(true)
const wsName = ref('')
const wsSlug = ref('')
const savingWs = ref(false)
const wsSaved = ref(false)
const memberRole = ref('member')

const userInitials = computed(() => auth.userInitials)
const translating = ref(false)
const translateResult = ref<{ translated: number; remaining: number } | null>(null)
const translateError = ref('')

// ── API Tokens ──
const apiTokens = ref<any[]>([])
const newTokenName = ref('')
const newTokenWrite = ref(false)
const creatingToken = ref(false)
const createdToken = ref('')

const appUrl = computed(() => {
  if (import.meta.client) return window.location.origin
  return ''
})

const copiedKey = ref('')
function copyToClipboard(text: string, key = '') {
  navigator.clipboard.writeText(text)
  copiedKey.value = key
  setTimeout(() => { copiedKey.value = '' }, 2000)
}

const mcpClientConfigs = computed(() => {
  const token = createdToken.value
  const url = `${appUrl.value}/api/mcp`
  if (!token) return []

  const httpConfig = (name: string) => JSON.stringify({
    mcpServers: { focusflow: { url, headers: { Authorization: `Bearer ${token}` } } }
  }, null, 2)

  const npxConfig = () => JSON.stringify({
    mcpServers: {
      focusflow: {
        command: 'npx',
        args: ['-y', 'mcp-remote', url, '--header', `Authorization:Bearer ${token}`],
      },
    },
  }, null, 2)

  return [
    {
      key: 'claude-code',
      name: 'Claude Code',
      file: 'Terminal',
      icon: 'i-heroicons-command-line',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      config: `claude mcp add focusflow --transport http ${url} --header "Authorization: Bearer ${token}"`,
    },
    {
      key: 'claude-desktop',
      name: 'Claude Desktop',
      file: 'claude_desktop_config.json',
      icon: 'i-heroicons-window',
      iconBg: 'bg-violet-100 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      config: npxConfig(),
    },
    {
      key: 'cursor',
      name: 'Cursor',
      file: '.cursor/mcp.json',
      icon: 'i-heroicons-cursor-arrow-rays',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      config: httpConfig('cursor'),
    },
    {
      key: 'windsurf',
      name: 'Windsurf',
      file: '~/.codeium/windsurf/mcp_config.json',
      icon: 'i-heroicons-globe-alt',
      iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      config: npxConfig(),
    },
    {
      key: 'cline',
      name: 'Cline',
      file: 'VS Code → Cline → MCP Servers',
      icon: 'i-heroicons-code-bracket',
      iconBg: 'bg-green-100 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
      config: npxConfig(),
    },
    {
      key: 'gemini',
      name: 'Gemini CLI',
      file: '~/.gemini/settings.json',
      icon: 'i-heroicons-sparkles',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      config: npxConfig(),
    },
  ]
})

async function loadTokens() {
  if (!store.workspace) return
  try {
    apiTokens.value = await $fetch<any[]>(`/api/workspaces/${store.workspace.id}/api-tokens`)
  } catch {}
}

async function createToken() {
  if (!store.workspace || !newTokenName.value.trim()) return
  creatingToken.value = true
  createdToken.value = ''
  try {
    const scopes = newTokenWrite.value ? ['read', 'write'] : ['read']
    const result = await $fetch<any>(`/api/workspaces/${store.workspace.id}/api-tokens`, {
      method: 'POST',
      body: { name: newTokenName.value.trim(), scopes },
    })
    createdToken.value = result.token
    newTokenName.value = ''
    newTokenWrite.value = false
    await loadTokens()
  } catch (e: any) {
    console.error('Error creating token:', e)
  } finally {
    creatingToken.value = false
  }
}

async function deleteToken(tokenId: string) {
  if (!store.workspace) return
  const msg = lang.language.value === 'en' ? 'Delete this API token? Any integrations using it will stop working.' : 'Eliminar este token? Las integraciones que lo usen dejaran de funcionar.'
  if (!confirm(msg)) return
  try {
    await $fetch(`/api/workspaces/${store.workspace.id}/api-tokens`, {
      method: 'DELETE',
      body: { id: tokenId },
    })
    apiTokens.value = apiTokens.value.filter(t => t.id !== tokenId)
  } catch {}
}


onMounted(async () => {
  try {
    if (!store.workspace) return
    wsName.value = store.workspace.name
    wsSlug.value = store.workspace.slug

    const members = await $fetch<any[]>(`/api/workspaces/${store.workspace.id}/members`)
    const me = members?.find(m => m.user_id === currentUser.value?.id)
    if (me) memberRole.value = me.role
    loadTokens()
  } catch { } finally {
    loading.value = false
  }
})

async function saveWorkspace() {
  savingWs.value = true
  wsSaved.value = false
  try {
    await $fetch(`/api/workspaces/${store.workspace!.id}`, {
      method: 'PATCH',
      body: { name: wsName.value },
    })
    wsSaved.value = true
    setTimeout(() => { wsSaved.value = false }, 3000)
  } catch { } finally {
    savingWs.value = false
  }
}

async function batchTranslate() {
  translating.value = true
  translateResult.value = null
  translateError.value = ''
  try {
    const result = await $fetch<{ translated: number; remaining: number }>(`/api/workspaces/${store.workspace!.id}/tasks/batch-translate`, {
      method: 'POST',
      body: { limit: 20 },
    })
    translateResult.value = result
  } catch (e: any) {
    translateError.value = e.message || 'Error translating'
  } finally {
    translating.value = false
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  await router.push('/auth/login')
}
</script>
