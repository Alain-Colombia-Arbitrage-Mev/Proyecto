import type { SupabaseClient } from '@supabase/supabase-js'

export interface PlanLimits {
  maxWorkspaces: number
  maxProjects: number
  maxMembers: number
  tokenLimit: number
  features: Record<string, boolean | number>
}

export interface SubscriptionInfo {
  planId: string
  planName: string
  status: string
  memberCount: number
  amount: number
  billingCycle: string
  currentPeriodEnd: string
  limits: PlanLimits
}

const DEFAULT_LIMITS: PlanLimits = {
  maxWorkspaces: 1,
  maxProjects: 3,
  maxMembers: 5,
  tokenLimit: 500000,
  features: { ai_basic: false, ai_doc_agents: false, meetings: true, goals: false, roadmap: false, timesheet: true, files_storage_mb: 100, custom_domain: false },
}

/** Full plan limits — no restrictions */
const UNLIMITED_LIMITS: PlanLimits = {
  maxWorkspaces: 999,
  maxProjects: 999,
  maxMembers: 999,
  tokenLimit: 999_000_000,
  features: { ai_basic: true, ai_doc_agents: true, meetings: true, goals: true, roadmap: true, timesheet: true, files_storage_mb: 999999, custom_domain: true },
}

/** Emails that always get unlimited plan (owner + team) */
const UNLIMITED_PLAN_EMAILS = ['guardcolombia@gmail.com'].map(e => e.toLowerCase())

export function isUnlimitedUser(email: string | undefined): boolean {
  if (!email) return false
  return UNLIMITED_PLAN_EMAILS.includes(email.toLowerCase())
}

/** Check if a workspace is owned by an unlimited user */
export async function isUnlimitedWorkspace(supabase: SupabaseClient, workspaceId: string): Promise<boolean> {
  const { data: ws } = await supabase
    .from('workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (!ws?.owner_id) return false

  const { data: authData } = await supabase.auth.admin.getUserById(ws.owner_id)
  return isUnlimitedUser(authData?.user?.email)
}

export async function getWorkspaceSubscription(supabase: SupabaseClient, workspaceId: string): Promise<SubscriptionInfo | null> {
  const { data: sub } = await supabase
    .from('workspace_subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!sub || !sub.plan) return null

  return {
    planId: sub.plan_id,
    planName: sub.plan.name,
    status: sub.status,
    memberCount: sub.member_count,
    amount: sub.amount,
    billingCycle: sub.billing_cycle,
    currentPeriodEnd: sub.current_period_end,
    limits: {
      maxWorkspaces: sub.plan.max_workspaces,
      maxProjects: sub.plan.max_projects,
      maxMembers: sub.plan.max_members,
      tokenLimit: sub.plan.token_limit,
      features: sub.plan.features || {},
    },
  }
}

export async function getPlanLimits(supabase: SupabaseClient, workspaceId: string): Promise<PlanLimits> {
  // Unlimited plan for owner workspaces
  if (await isUnlimitedWorkspace(supabase, workspaceId)) return UNLIMITED_LIMITS

  const sub = await getWorkspaceSubscription(supabase, workspaceId)
  if (!sub) return DEFAULT_LIMITS
  return sub.limits
}

export async function checkPlanLimit(
  supabase: SupabaseClient,
  workspaceId: string,
  resource: 'projects' | 'members',
): Promise<{ allowed: boolean; current: number; max: number }> {
  const limits = await getPlanLimits(supabase, workspaceId)

  if (resource === 'projects') {
    const { count } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
    const current = count || 0
    return { allowed: current < limits.maxProjects, current, max: limits.maxProjects }
  }

  if (resource === 'members') {
    const { count } = await supabase
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
    const current = count || 0
    return { allowed: current < limits.maxMembers, current, max: limits.maxMembers }
  }

  return { allowed: true, current: 0, max: 999 }
}

export async function checkFeatureAccess(
  supabase: SupabaseClient,
  workspaceId: string,
  feature: string,
): Promise<boolean> {
  const limits = await getPlanLimits(supabase, workspaceId)
  return !!limits.features[feature]
}
