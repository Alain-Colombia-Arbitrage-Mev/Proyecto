<template>
  <div class="relative w-full h-[560px] rounded-xl border border-gray-200/80 dark:border-white/10 overflow-hidden bg-[#0d0d12]">
    <VueFlow
      v-model:nodes="flowNodes"
      v-model:edges="flowEdges"
      :default-viewport="{ zoom: 0.9 }"
      :min-zoom="0.3"
      :max-zoom="1.6"
      :delete-key-code="['Backspace', 'Delete']"
      fit-view-on-init
      class="wf-canvas"
      @connect="onConnect"
      @node-drag-stop="syncBack"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @node-click="onNodeClick"
      @pane-click="$emit('select', null)"
    >
      <Background pattern-color="#2a2a35" :gap="22" :size="1.4" />
      <Controls position="bottom-right" />

      <template #node-wf="{ data, id }">
        <div
          class="min-w-[190px] max-w-[230px] rounded-xl border-2 shadow-lg transition-all"
          :class="selected === id ? 'shadow-xl' : ''"
          :style="{
            backgroundColor: '#16161d',
            borderColor: selected === id ? data.color : data.color + '55',
            boxShadow: selected === id ? `0 0 24px ${data.color}33` : undefined,
          }"
        >
          <!-- Header -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-t-[10px]" :style="{ backgroundColor: data.color + '22' }">
            <UIcon :name="data.icon" class="w-4 h-4 shrink-0" :style="{ color: data.color }" />
            <span class="text-[11px] font-bold text-white truncate flex-1">{{ data.label }}</span>
            <button
              class="w-4 h-4 rounded flex items-center justify-center text-white/30 hover:text-red-400 cursor-pointer"
              :title="es ? 'Eliminar nodo' : 'Delete node'"
              @click.stop="removeNode(id)"
            >
              <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
            </button>
          </div>
          <!-- Body -->
          <div class="px-3 py-2">
            <p class="text-[9px] font-bold uppercase tracking-wider" :style="{ color: data.color }">{{ data.typeLabel }}</p>
            <p v-if="data.hint" class="text-[10px] text-white/45 leading-snug mt-0.5 line-clamp-2">{{ data.hint }}</p>
          </div>
          <Handle type="target" :position="Position.Left" class="wf-handle" :style="{ backgroundColor: data.color }" />
          <Handle type="source" :position="Position.Right" class="wf-handle" :style="{ backgroundColor: data.color }" />
        </div>
      </template>
    </VueFlow>

    <!-- Node palette -->
    <div class="absolute top-3 left-3 z-10">
      <button
        class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
        @click="paletteOpen = !paletteOpen"
      >
        <UIcon name="i-heroicons-plus" class="w-4 h-4" />
        {{ es ? 'Nodo' : 'Node' }}
      </button>
      <div
        v-if="paletteOpen"
        class="mt-2 w-56 max-h-[420px] overflow-y-auto rounded-xl bg-[#16161d] border border-white/10 shadow-2xl p-2 space-y-2"
      >
        <div v-for="cat in palette" :key="cat.label">
          <p class="text-[9px] font-bold uppercase tracking-wider text-white/30 px-1.5 mb-1">{{ cat.label }}</p>
          <button
            v-for="nt in cat.types"
            :key="nt.type"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.07] text-left transition-colors cursor-pointer"
            @click="addNodeToCanvas(nt.type)"
          >
            <div class="w-6 h-6 rounded-md flex items-center justify-center shrink-0" :style="{ backgroundColor: nt.color + '2a' }">
              <UIcon :name="nt.icon" class="w-3.5 h-3.5" :style="{ color: nt.color }" />
            </div>
            <span class="text-[11px] font-medium text-white/75">{{ nt.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <p class="absolute bottom-3 left-3 z-10 text-[10px] text-white/25">
      {{ es ? 'Arrastra nodos · conecta desde los puntos laterales · Supr elimina' : 'Drag nodes · connect from side dots · Del removes' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position, type Node as FlowNode, type Edge as FlowEdge, type Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'

export interface WfNode {
  id: string
  type: string
  label: string
  config: Record<string, any>
  position?: { x: number; y: number }
}
export interface WfEdge { id: string; source: string; target: string }

const props = defineProps<{
  nodes: WfNode[]
  edges: WfEdge[]
  selected: string | null
}>()

const emit = defineEmits<{
  'update:nodes': [nodes: WfNode[]]
  'update:edges': [edges: WfEdge[]]
  'select': [id: string | null]
  'save': []
  'add': [type: string]
}>()

const lang = useLanguage()
const es = computed(() => lang.language.value !== 'en')
const paletteOpen = ref(false)

const NODE_STYLES: Record<string, { icon: string; color: string; label: string }> = {
  trigger: { icon: 'i-heroicons-bolt', color: '#F59E0B', label: 'Trigger' },
  ai_prompt: { icon: 'i-heroicons-sparkles', color: '#8B5CF6', label: 'AI Prompt' },
  ai_agent: { icon: 'i-heroicons-cpu-chip', color: '#6366F1', label: 'AI Agent' },
  social_post: { icon: 'i-heroicons-megaphone', color: '#EC4899', label: 'Social Post' },
  video_generate: { icon: 'i-heroicons-film', color: '#F97316', label: 'Video' },
  image_generate: { icon: 'i-heroicons-photo', color: '#14B8A6', label: 'Imagen' },
  send_email: { icon: 'i-heroicons-envelope', color: '#0EA5E9', label: 'Email' },
  webhook: { icon: 'i-heroicons-link', color: '#64748B', label: 'Webhook' },
  http_request: { icon: 'i-heroicons-globe-alt', color: '#64748B', label: 'HTTP' },
  condition: { icon: 'i-heroicons-arrows-right-left', color: '#EAB308', label: 'Condición' },
  delay: { icon: 'i-heroicons-clock', color: '#78716C', label: 'Delay' },
  transform: { icon: 'i-heroicons-code-bracket', color: '#10B981', label: 'Transform' },
  output: { icon: 'i-heroicons-flag', color: '#22C55E', label: 'Output' },
  mcp_tool: { icon: 'i-heroicons-wrench-screwdriver', color: '#D946EF', label: 'MCP Tool' },
}

const palette = computed(() => [
  { label: 'AI', types: pal(['trigger', 'ai_prompt', 'ai_agent']) },
  { label: 'Media', types: pal(['video_generate', 'image_generate', 'social_post']) },
  { label: es.value ? 'Integraciones' : 'Integrations', types: pal(['send_email', 'webhook', 'http_request', 'mcp_tool']) },
  { label: es.value ? 'Lógica' : 'Logic', types: pal(['condition', 'delay', 'transform', 'output']) },
])

function pal(types: string[]) {
  return types.map(t => ({ type: t, ...NODE_STYLES[t]! }))
}

function nodeHint(n: WfNode): string {
  const c = n.config || {}
  if (n.type === 'ai_prompt' || n.type === 'ai_agent') return String(c.model || '') + (c.prompt ? ` · ${String(c.prompt).slice(0, 60)}` : '')
  if (n.type === 'video_generate') return `${c.provider === 'fal' ? 'Seedance 2.0' : c.provider === 'higgsfield' ? 'Higgsfield' : 'Runway'} · ${c.duration || 5}s`
  if (n.type === 'social_post') return String(c.platform || '')
  if (n.type === 'send_email') return String(c.to || '')
  if (n.type === 'webhook' || n.type === 'http_request') return String(c.url || '')
  if (n.type === 'mcp_tool') return `${String(c.server_url || '').includes('higgsfield') ? 'Higgsfield' : 'MCP'} · ${c.tool || '?'}`
  if (n.type === 'delay') return `${c.seconds || 0}s`
  return String(c.prompt || c.template || c.expression || '')
}

// Legacy list workflows store positions as {x:0, y:index} — spread them into real coordinates
function realPosition(n: WfNode, idx: number): { x: number; y: number } {
  const p = n.position
  if (p && (Math.abs(p.x) > 20 || Math.abs(p.y) > 20)) return { x: p.x, y: p.y }
  return { x: 80 + (idx % 3) * 280, y: 60 + Math.floor(idx / 3) * 170 }
}

const flowNodes = ref<FlowNode[]>([])
const flowEdges = ref<FlowEdge[]>([])

function buildFlow() {
  flowNodes.value = props.nodes.map((n, idx) => ({
    id: n.id,
    type: 'wf',
    position: realPosition(n, idx),
    data: {
      label: n.label,
      color: NODE_STYLES[n.type]?.color || '#8B5CF6',
      icon: NODE_STYLES[n.type]?.icon || 'i-heroicons-cube',
      typeLabel: NODE_STYLES[n.type]?.label || n.type,
      hint: nodeHint(n),
    },
  }))

  if (props.edges?.length) {
    flowEdges.value = props.edges.map(e => edgeToFlow(e))
  } else if (props.nodes.length > 1) {
    // Legacy sequential workflow → visualize as a chain (persisted on first save)
    flowEdges.value = props.nodes.slice(0, -1).map((n, i) => edgeToFlow({
      id: `e-${n.id}-${props.nodes[i + 1]!.id}`,
      source: n.id,
      target: props.nodes[i + 1]!.id,
    }))
    emitEdges()
  } else {
    flowEdges.value = []
  }
}

function edgeToFlow(e: WfEdge): FlowEdge {
  return { id: e.id, source: e.source, target: e.target, animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } }
}

watch(() => props.nodes.length, buildFlow)
watch(() => props.nodes.map(n => `${n.label}|${JSON.stringify(n.config)}`).join(';'), () => {
  // Config/label edited outside → refresh node data without resetting positions
  for (const fn of flowNodes.value) {
    const src = props.nodes.find(n => n.id === fn.id)
    if (src) {
      fn.data.label = src.label
      fn.data.hint = nodeHint(src)
    }
  }
})
onMounted(buildFlow)

function onConnect(conn: Connection) {
  if (!conn.source || !conn.target || conn.source === conn.target) return
  const id = `e-${conn.source}-${conn.target}-${Date.now()}`
  flowEdges.value.push(edgeToFlow({ id, source: conn.source, target: conn.target }))
  emitEdges()
  emit('save')
}

function onNodesChange(changes: any[]) {
  const removed = changes.filter(c => c.type === 'remove')
  if (removed.length) {
    emit('update:nodes', props.nodes.filter(n => !removed.some(r => r.id === n.id)))
    emitEdges()
    emit('save')
  }
}

function onEdgesChange(changes: any[]) {
  if (changes.some(c => c.type === 'remove')) {
    nextTick(() => { emitEdges(); emit('save') })
  }
}

function onNodeClick(e: { node: FlowNode }) {
  emit('select', e.node.id)
}

function removeNode(id: string) {
  flowNodes.value = flowNodes.value.filter(n => n.id !== id)
  flowEdges.value = flowEdges.value.filter(e => e.source !== id && e.target !== id)
  emit('update:nodes', props.nodes.filter(n => n.id !== id))
  emitEdges()
  emit('save')
}

function addNodeToCanvas(type: string) {
  paletteOpen.value = false
  emit('add', type)
}

/** Persist canvas positions back into workflow nodes */
function syncBack() {
  const updated = props.nodes.map(n => {
    const fn = flowNodes.value.find(f => f.id === n.id)
    return fn ? { ...n, position: { x: Math.round(fn.position.x), y: Math.round(fn.position.y) } } : n
  })
  emit('update:nodes', updated)
  emit('save')
}

function emitEdges() {
  emit('update:edges', flowEdges.value.map(e => ({ id: e.id, source: e.source, target: e.target })))
}
</script>

<style scoped>
.wf-canvas :deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  border: 2px solid #0d0d12;
}
.wf-canvas :deep(.vue-flow__edge-path) {
  stroke-linecap: round;
}
.wf-canvas :deep(.vue-flow__controls) {
  background: #16161d;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}
.wf-canvas :deep(.vue-flow__controls-button) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  fill: rgba(255, 255, 255, 0.6);
}
.wf-canvas :deep(.vue-flow__controls-button:hover) {
  background: rgba(255, 255, 255, 0.08);
}
</style>
