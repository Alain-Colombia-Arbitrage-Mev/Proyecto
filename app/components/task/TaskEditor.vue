<template>
  <div class="task-editor">
    <!-- Toolbar -->
    <div v-if="editable && editor" class="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03] rounded-t-lg flex-wrap">
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Negrita">
        <UIcon name="i-heroicons-bold" class="w-3.5 h-3.5" />
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Cursiva">
        <UIcon name="i-heroicons-italic" class="w-3.5 h-3.5" />
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Tachado">
        <UIcon name="i-heroicons-strikethrough" class="w-3.5 h-3.5" />
      </button>

      <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="H2">
        <span class="text-[10px] font-bold">H2</span>
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="H3">
        <span class="text-[10px] font-bold">H3</span>
      </button>

      <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Lista">
        <UIcon name="i-heroicons-list-bullet" class="w-3.5 h-3.5" />
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Lista numerada">
        <UIcon name="i-heroicons-numbered-list" class="w-3.5 h-3.5" />
      </button>

      <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()" title="Bloque de código">
        <UIcon name="i-heroicons-code-bracket" class="w-3.5 h-3.5" />
      </button>
      <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Cita">
        <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-3.5 h-3.5" />
      </button>

      <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

      <button type="button" class="toolbar-btn" @click="triggerImageUpload" title="Insertar imagen">
        <UIcon name="i-heroicons-photo" class="w-3.5 h-3.5" />
      </button>
      <button type="button" class="toolbar-btn" @click="insertLink" title="Insertar enlace">
        <UIcon name="i-heroicons-link" class="w-3.5 h-3.5" />
      </button>

      <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
    </div>

    <!-- Editor -->
    <EditorContent :editor="editor" class="task-editor-content" :style="{ minHeight: minHeight }" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(defineProps<{
  modelValue: string
  workspaceId: string
  placeholder?: string
  editable?: boolean
  minHeight?: string
}>(), {
  placeholder: 'Escribe una descripción...',
  editable: true,
  minHeight: '120px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const imageInput = ref<HTMLInputElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const editor = useEditor({
  content: props.modelValue || '',
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      codeBlock: false, // we use the basic one from StarterKit
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: true,
      autolink: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none px-3 py-2',
    },
    handlePaste(view, event) {
      const items = event.clipboardData?.items
      if (!items) return false
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) uploadAndInsertImage(file)
          return true
        }
      }
      return false
    },
  },
  onUpdate({ editor }) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      emit('update:modelValue', editor.getHTML())
    }, 300)
  },
})

watch(() => props.modelValue, (newVal) => {
  if (!editor.value) return
  const currentHtml = editor.value.getHTML()
  if (currentHtml !== newVal) {
    editor.value.commands.setContent(newVal || '', { emitUpdate: false })
  }
})

watch(() => props.editable, (val) => {
  editor.value?.setEditable(val)
})

function triggerImageUpload() {
  imageInput.value?.click()
}

function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) uploadAndInsertImage(file)
  // Reset input so same file can be selected again
  if (imageInput.value) imageInput.value.value = ''
}

async function uploadAndInsertImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await $fetch<{ url: string }>(`/api/workspaces/${props.workspaceId}/tasks/upload-image`, {
      method: 'POST',
      body: formData,
    })
    if (res.url && editor.value) {
      editor.value.chain().focus().setImage({ src: res.url }).run()
    }
  } catch (err) {
    console.error('[TaskEditor] Image upload failed:', err)
  }
}

function insertLink() {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL del enlace:', previousUrl)
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  editor.value?.destroy()
})
</script>

<style scoped>
.task-editor {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: white;
  overflow: hidden;
}

:root.dark .task-editor {
  border-color: rgba(255, 255, 255, 0.1);
  background: #1b1b1b;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 0.375rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  background: transparent;
}
.toolbar-btn:hover {
  background: #e5e7eb;
  color: #111827;
}
:root.dark .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}
.toolbar-btn.active {
  background: #0d9488;
  color: white;
}

/* Editor content dark mode */
:root.dark .task-editor-content :deep(.ProseMirror) {
  color: #e5e7eb;
}
:root.dark .task-editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #6b7280;
}
</style>
