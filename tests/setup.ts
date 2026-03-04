import { createError } from 'h3'
import { vi } from 'vitest'

// Stub Nuxt auto-imports used in server utils
globalThis.createError = createError

// Stub auth helpers (only needed if tests import endpoint handlers directly)
globalThis.requireWorkspaceMember = vi.fn().mockResolvedValue({
  user: { id: 'test-user', email: 'test@test.com' },
  membership: { id: 'mem-1', role: 'member' },
})
globalThis.requirePermission = vi.fn().mockResolvedValue({
  user: { id: 'test-user', email: 'test@test.com' },
  membership: { id: 'mem-1', role: 'member' },
})
globalThis.requireWorkspaceRole = vi.fn().mockResolvedValue({
  user: { id: 'test-user', email: 'test@test.com' },
  membership: { id: 'mem-1', role: 'member' },
})
