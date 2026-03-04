import { describe, it, expect } from 'vitest'
import { hasPermission, getRolePermissions } from '../server/utils/permissions'
import type { RolePermissionOverrides } from '../server/utils/permissions'

describe('hasPermission', () => {
  // viewer
  it('viewer can view_tasks', () => {
    expect(hasPermission('viewer', 'view_tasks')).toBe(true)
  })

  it('viewer cannot create_tasks', () => {
    expect(hasPermission('viewer', 'create_tasks')).toBe(false)
  })

  // member
  it('member can create_tasks', () => {
    expect(hasPermission('member', 'create_tasks')).toBe(true)
  })

  it('member cannot import_tasks', () => {
    expect(hasPermission('member', 'import_tasks')).toBe(false)
  })

  // admin
  it('admin can import_tasks', () => {
    expect(hasPermission('admin', 'import_tasks')).toBe(true)
  })

  it('admin cannot manage_workspace', () => {
    expect(hasPermission('admin', 'manage_workspace')).toBe(false)
  })

  // owner
  it('owner can manage_workspace', () => {
    expect(hasPermission('owner', 'manage_workspace')).toBe(true)
  })

  // superadmin
  it('superadmin has all permissions', () => {
    expect(hasPermission('superadmin', 'view_tasks')).toBe(true)
    expect(hasPermission('superadmin', 'manage_workspace')).toBe(true)
    expect(hasPermission('superadmin', 'use_ai_doc_agents')).toBe(true)
  })

  // marketing — restricted defaults
  it('marketing can view_tasks (in restricted list)', () => {
    expect(hasPermission('marketing', 'view_tasks')).toBe(true)
  })

  it('marketing can create_tasks (in restricted list)', () => {
    expect(hasPermission('marketing', 'create_tasks')).toBe(true)
  })

  it('marketing cannot import_tasks (not in restricted list)', () => {
    expect(hasPermission('marketing', 'import_tasks')).toBe(false)
  })

  it('marketing cannot delete_tasks (not in restricted list)', () => {
    expect(hasPermission('marketing', 'delete_tasks')).toBe(false)
  })

  // Workspace overrides
  describe('workspace overrides', () => {
    it('grants permission via override', () => {
      const overrides: RolePermissionOverrides = {
        viewer: { create_tasks: true },
      }
      expect(hasPermission('viewer', 'create_tasks', overrides)).toBe(true)
    })

    it('revokes permission via override', () => {
      const overrides: RolePermissionOverrides = {
        member: { create_tasks: false },
      }
      expect(hasPermission('member', 'create_tasks', overrides)).toBe(false)
    })
  })
})

describe('getRolePermissions', () => {
  it('returns full permission map for a role', () => {
    const perms = getRolePermissions('admin')
    expect(perms.view_tasks).toBe(true)
    expect(perms.import_tasks).toBe(true)
    expect(perms.manage_workspace).toBe(false)
  })

  it('superadmin gets all true', () => {
    const perms = getRolePermissions('superadmin')
    for (const value of Object.values(perms)) {
      expect(value).toBe(true)
    }
  })
})
