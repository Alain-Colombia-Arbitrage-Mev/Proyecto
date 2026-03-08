<template>
  <div class="animate-fade-up max-w-4xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon name="i-heroicons-puzzle-piece" class="w-7 h-7 text-purple-600 dark:text-purple-400" />
        {{ lang.language.value === 'en' ? 'MCP Integration' : 'Integracion MCP' }}
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ lang.language.value === 'en' ? 'Connect FocusFlow to Claude, Cursor, and other AI tools via MCP' : 'Conecta FocusFlow a Claude, Cursor y otras herramientas AI via MCP' }}
      </p>
    </div>

    <!-- Quick Install Commands -->
    <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-5 mb-5">
      <h2 class="text-xs font-bold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide mb-4">
        {{ lang.language.value === 'en' ? 'Quick Install' : 'Instalacion Rapida' }}
      </h2>

      <div v-if="!activeToken" class="text-center py-6">
        <UIcon name="i-heroicons-key" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {{ lang.language.value === 'en' ? 'Create an API token first to get your install commands' : 'Crea un token API primero para obtener los comandos' }}
        </p>
        <UButton color="primary" size="sm" class="bg-purple-600 hover:bg-purple-700" @click="showCreateToken = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          {{ lang.language.value === 'en' ? 'Create Token' : 'Crear Token' }}
        </UButton>
      </div>

      <div v-else class="space-y-4">
        <!-- Claude Code -->
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-command-line" class="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <span class="text-xs font-semibold text-gray-900 dark:text-white">Claude Code</span>
          </div>
          <div class="relative group">
            <pre class="bg-gray-900 dark:bg-black/50 text-emerald-400 text-[11px] leading-relaxed rounded-lg px-3 py-2.5 overflow-x-auto font-mono">claude mcp add focusflow --transport http {{ host }}/api/mcp --header "Authorization: Bearer {{ activeToken }}"</pre>
            <button
              class="absolute top-1.5 right-1.5 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="copyCmd(`claude mcp add focusflow --transport http ${host}/api/mcp --header &quot;Authorization: Bearer ${activeToken}&quot;`)"
            >
              <UIcon :name="copied === 'claude' ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <!-- Claude Desktop -->
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-window" class="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <span class="text-xs font-semibold text-gray-900 dark:text-white">Claude Desktop</span>
            <span class="text-[9px] text-gray-400">(npx)</span>
          </div>
          <div class="relative group">
            <pre class="bg-gray-900 dark:bg-black/50 text-emerald-400 text-[11px] leading-relaxed rounded-lg px-3 py-2.5 overflow-x-auto font-mono">npx -y @anthropic-ai/claude-code mcp add focusflow -- npx -y mcp-remote {{ host }}/api/mcp --header "Authorization:Bearer {{ activeToken }}"</pre>
            <button
              class="absolute top-1.5 right-1.5 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="copyCmd(`npx -y @anthropic-ai/claude-code mcp add focusflow -- npx -y mcp-remote ${host}/api/mcp --header &quot;Authorization:Bearer ${activeToken}&quot;`, 'desktop')"
            >
              <UIcon :name="copied === 'desktop' ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <!-- Cursor -->
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <UIcon name="i-heroicons-cursor-arrow-rays" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <span class="text-xs font-semibold text-gray-900 dark:text-white">Cursor</span>
            <span class="text-[9px] text-gray-400">.cursor/mcp.json</span>
          </div>
          <div class="relative group">
            <pre class="bg-gray-900 dark:bg-black/50 text-emerald-400 text-[11px] leading-relaxed rounded-lg px-3 py-2.5 overflow-x-auto font-mono">{{ cursorConfig }}</pre>
            <button
              class="absolute top-1.5 right-1.5 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="copyCmd(cursorConfig, 'cursor')"
            >
              <UIcon :name="copied === 'cursor' ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Tokens -->
    <div class="bg-white dark:bg-[#1b1b1b] rounded-xl border border-gray-200 dark:border-white/10 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-bold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide">
          {{ lang.language.value === 'en' ? 'API Tokens' : 'Tokens API' }}
        </h2>
        <UButton size="xs" variant="soft" @click="showCreateToken = true" class="cursor-pointer">
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1" />
          {{ lang.language.value === 'en' ? 'New Token' : 'Nuevo Token' }}
        </UButton>
      </div>

      <!-- New token just created -->
      <div v-if="newlyCreatedToken" class="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p class="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
          {{ lang.language.value === 'en' ? 'Copy your token now — it won\'t be shown again!' : 'Copia tu token ahora — no se mostrara de nuevo!' }}
        </p>
        <div class="flex items-center gap-2">
          <code class="flex-1 text-[11px] bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-2 py-1 rounded font-mono break-all">{{ newlyCreatedToken }}</code>
          <button
            class="shrink-0 w-7 h-7 rounded-md bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 flex items-center justify-center transition-colors cursor-pointer"
            @click="copyCmd(newlyCreatedToken, 'token')"
          >
            <UIcon :name="copied === 'token' ? 'i-heroicons-check' : 'i-heroicons-clipboard'" class="w-3.5 h-3.5 text-amber-800 dark:text-amber-200" />
          </button>
        </div>
      </div>

      <!-- Token list -->
      <div v-if="tokens.length === 0 && !loadingTokens" class="text-center py-6">
        <UIcon name="i-heroicons-key" class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-xs text-gray-400">{{ lang.language.value === 'en' ? 'No tokens yet' : 'Sin tokens aun' }}</p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="tk in tokens"
          :key="tk.id"
          class="flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors"
          :class="activeTokenId === tk.id
            ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10'
            : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.03]'"
        >
          <div class="flex items-center gap-3 min-w-0">
            <button
              class="w-4 h-4 rounded-full border-2 shrink-0 transition-colors cursor-pointer"
              :class="activeTokenId === tk.id
                ? 'border-purple-500 bg-purple-500'
                : 'border-gray-300 dark:border-white/20'"
              @click="selectToken(tk)"
            />
            <div class="min-w-0">
              <p class="text-xs font-semibold text-gray-900 dark:text-white truncate">{{ tk.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <code class="text-[10px] text-gray-400 font-mono">{{ tk.token_prefix }}...</code>
                <span v-for="s in tk.scopes" :key="s" class="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{{ s }}</span>
                <span v-if="tk.last_used_at" class="text-[9px] text-gray-400">{{ lang.language.value === 'en' ? 'Used' : 'Usado' }} {{ timeAgo(tk.last_used_at) }}</span>
              </div>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
            @click="deleteToken(tk.id)"
          >
            <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create Token Modal -->
    <UModal v-model:open="showCreateToken" class="sm:max-w-md">
      <template #content>
        <div class="bg-white dark:bg-[#1b1b1b] p-6">
          <h3 class="font-bold text-gray-900 dark:text-white mb-4">
            {{ lang.language.value === 'en' ? 'Create API Token' : 'Crear Token API' }}
          </h3>
          <div class="space-y-3">
            <div>
              <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1">
                {{ lang.language.value === 'en' ? 'Token Name' : 'Nombre del Token' }}
              </label>
              <input
                v-model="createForm.name"
                type="text"
                class="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                :placeholder="lang.language.value === 'en' ? 'e.g. Claude Code, Cursor' : 'ej. Claude Code, Cursor'"
              />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-gray-500 dark:text-[#99a0ae] uppercase tracking-wide block mb-1.5">
                {{ lang.language.value === 'en' ? 'Permissions' : 'Permisos' }}
              </label>
              <div class="flex gap-2">
                <button
                  v-for="scope in ['read', 'write', 'admin']"
                  :key="scope"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
                  :class="createForm.scopes.includes(scope)
                    ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'"
                  @click="toggleScope(scope)"
                >
                  {{ scope }}
                </button>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <UButton variant="ghost" @click="showCreateToken = false">{{ lang.language.value === 'en' ? 'Cancel' : 'Cancelar' }}</UButton>
            <UButton
              color="primary"
              :loading="creating"
              :disabled="!createForm.name.trim()"
              class="bg-purple-600 hover:bg-purple-700"
              @click="createToken"
            >
              {{ lang.language.value === 'en' ? 'Create' : 'Crear' }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const lang = useLanguage()
const store = useWorkspaceStore()
const workspaceId = computed(() => store.workspace?.id || '')
const host = computed(() => import.meta.client ? window.location.origin : 'https://focus.nexaru.net')

interface ApiToken {
  id: string
  name: string
  token_prefix: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  token?: string
}

const tokens = ref<ApiToken[]>([])
const loadingTokens = ref(false)
const showCreateToken = ref(false)
const creating = ref(false)
const newlyCreatedToken = ref('')
const activeTokenId = ref('')
const activeToken = ref('')
const copied = ref('')

const createForm = reactive({
  name: '',
  scopes: ['read', 'write'] as string[],
})

const cursorConfig = computed(() => {
  return JSON.stringify({
    mcpServers: {
      focusflow: {
        url: `${host.value}/api/mcp`,
        headers: { Authorization: `Bearer ${activeToken.value || 'ff_YOUR_TOKEN'}` },
      },
    },
  }, null, 2)
})

function toggleScope(scope: string) {
  const idx = createForm.scopes.indexOf(scope)
  if (idx >= 0) {
    if (createForm.scopes.length > 1) createForm.scopes.splice(idx, 1)
  } else {
    createForm.scopes.push(scope)
  }
}

async function loadTokens() {
  if (!workspaceId.value) return
  loadingTokens.value = true
  try {
    tokens.value = await $fetch<ApiToken[]>(`/api/workspaces/${workspaceId.value}/api-tokens`)
  } catch {
    tokens.value = []
  } finally {
    loadingTokens.value = false
  }
}

async function createToken() {
  if (!createForm.name.trim() || !workspaceId.value) return
  creating.value = true
  try {
    const res = await $fetch<ApiToken>(`/api/workspaces/${workspaceId.value}/api-tokens`, {
      method: 'POST',
      body: { name: createForm.name.trim(), scopes: createForm.scopes },
    })
    newlyCreatedToken.value = res.token || ''
    activeToken.value = res.token || ''
    activeTokenId.value = res.id
    showCreateToken.value = false
    createForm.name = ''
    createForm.scopes = ['read', 'write']
    loadTokens()
  } catch (e: any) {
    console.error('[integrations] Error creating token:', e)
  } finally {
    creating.value = false
  }
}

async function deleteToken(id: string) {
  if (!workspaceId.value) return
  try {
    await $fetch(`/api/workspaces/${workspaceId.value}/api-tokens`, {
      method: 'DELETE',
      body: { id },
    })
    if (activeTokenId.value === id) {
      activeTokenId.value = ''
      activeToken.value = ''
    }
    loadTokens()
  } catch {}
}

function selectToken(tk: ApiToken) {
  activeTokenId.value = tk.id
  // We only have the full token at creation time — use prefix as placeholder
  if (!activeToken.value || activeTokenId.value !== tk.id) {
    activeToken.value = `${tk.token_prefix}...`
  }
}

function copyCmd(text: string, key = 'claude') {
  navigator.clipboard.writeText(text)
  copied.value = key
  setTimeout(() => { copied.value = '' }, 2000)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return lang.language.value === 'en' ? 'just now' : 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

watch(workspaceId, () => loadTokens(), { immediate: true })
</script>
