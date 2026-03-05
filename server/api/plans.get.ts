import { serverSupabaseServiceRole } from '#supabase/server'

const FALLBACK_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    name_en: 'Starter',
    price_per_member: 2.00,
    currency: 'USD',
    max_workspaces: 1,
    max_projects: 5,
    max_members: 10,
    token_limit: 5000000,
    features: {
      ai_basic: true,
      ai_doc_agents: false,
      meetings: true,
      goals: false,
      roadmap: false,
      timesheet: true,
      files_storage_mb: 500,
      custom_domain: false,
    },
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    name_en: 'Pro',
    price_per_member: 8.00,
    currency: 'USD',
    max_workspaces: 5,
    max_projects: 50,
    max_members: 100,
    token_limit: 50000000,
    features: {
      ai_basic: true,
      ai_doc_agents: true,
      meetings: true,
      goals: true,
      roadmap: true,
      timesheet: true,
      files_storage_mb: 10000,
      custom_domain: true,
    },
    is_active: true,
    sort_order: 2,
  },
]

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)

  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')

    if (!error && data && data.length > 0) return data
  } catch { /* table may not exist yet */ }

  // Fallback to hardcoded plans if DB table doesn't exist
  return FALLBACK_PLANS
})
