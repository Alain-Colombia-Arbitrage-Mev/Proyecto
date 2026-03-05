import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  await requireWorkspaceRole(event, workspaceId, 'owner')

  const body = await readBody(event)
  const { planId, billingCycle = 'monthly' } = body

  if (!planId) throw createError({ statusCode: 400, message: 'planId is required' })

  const supabase = serverSupabaseServiceRole(event)

  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single()

  if (!plan) throw createError({ statusCode: 404, message: 'Plan not found' })

  // Count current members for billing
  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  const members = memberCount || 1
  const multiplier = billingCycle === 'yearly' ? 10 : 1 // 10 months price for yearly
  const amount = plan.price_per_member * members * multiplier

  const periodDays = billingCycle === 'yearly' ? 365 : 30
  const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString()

  // Upsert subscription
  const { data: sub, error: subErr } = await supabase
    .from('workspace_subscriptions')
    .upsert({
      workspace_id: workspaceId,
      plan_id: planId,
      status: 'active',
      member_count: members,
      amount,
      currency: plan.currency,
      billing_cycle: billingCycle,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id' })
    .select()
    .single()

  if (subErr) throw createError({ statusCode: 500, message: 'Error creating subscription' })

  // Update workspace plan + token_limit
  await supabase
    .from('workspaces')
    .update({
      plan: planId,
      token_limit: plan.token_limit,
      subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId)

  return { subscription: sub, plan }
})
