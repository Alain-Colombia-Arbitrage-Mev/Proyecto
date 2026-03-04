import { serverSupabaseServiceRole } from '#supabase/server'
import { requirePermission, ROLE_LEVELS } from '~~/server/utils/permissions'

interface TimeEntry {
  id: string
  task_id:          string | null
  project_id:       string | null
  user_id:          string
  start_time:       string
  end_time:         string | null
  duration_minutes: number | null
  description:      string | null
  billable:         boolean
  source:           string
}

interface TimesheetRow {
  date:          string        // YYYY-MM-DD
  entries:       TimeEntry[]
  total_minutes: number
}

/**
 * Returns the Monday of the ISO week that contains `date`.
 * Input and output are plain YYYY-MM-DD strings.
 */
function isoWeekMonday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const day = d.getUTCDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day   // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

/**
 * Add `days` days to a YYYY-MM-DD string, returns YYYY-MM-DD.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!

  const { user, membership } = await requirePermission(event, workspaceId, 'view_timesheets')

  const query = getQuery(event)

  // Determine target user
  const canViewAll = (ROLE_LEVELS[membership.role] ?? 0) >= ROLE_LEVELS.admin!
  let targetUserId: string

  if (query.user_id && canViewAll) {
    targetUserId = query.user_id as string
  } else {
    // Non-admins always see their own sheet; admins default to their own when no user_id given
    targetUserId = user.id
  }

  // Determine week start (Monday)
  const rawWeekStart = query.week_start as string | undefined
  let weekStart: string

  if (rawWeekStart && /^\d{4}-\d{2}-\d{2}$/.test(rawWeekStart)) {
    // Snap whatever date was passed to its Monday
    weekStart = isoWeekMonday(rawWeekStart)
  } else {
    // Default to current week's Monday
    const today = new Date().toISOString().slice(0, 10)
    weekStart = isoWeekMonday(today)
  }

  const weekEnd = addDays(weekStart, 6)   // Sunday (inclusive)

  const supabase = serverSupabaseServiceRole(event)

  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', targetUserId)
    .gte('start_time', `${weekStart}T00:00:00.000Z`)
    .lte('start_time', `${weekEnd}T23:59:59.999Z`)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[timesheet.get] query error:', error.message, error.details)
    throw createError({ statusCode: 500, message: 'Error fetching timesheet' })
  }

  // Build a map of date → entries
  const dateMap = new Map<string, TimeEntry[]>()

  // Pre-populate all 7 days so every day appears in the response even if empty
  for (let i = 0; i < 7; i++) {
    dateMap.set(addDays(weekStart, i), [])
  }

  for (const entry of (entries as TimeEntry[]) ?? []) {
    // Use the local date portion of start_time (stored as UTC ISO string)
    const dateKey = entry.start_time.slice(0, 10)
    if (dateMap.has(dateKey)) {
      dateMap.get(dateKey)!.push(entry)
    }
  }

  let weeklyTotal = 0
  const rows: TimesheetRow[] = []

  for (const [date, dayEntries] of dateMap) {
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0)
    weeklyTotal += totalMinutes
    rows.push({ date, entries: dayEntries, total_minutes: totalMinutes })
  }

  // Keep rows in chronological order (Map preserves insertion order, but make it explicit)
  rows.sort((a, b) => a.date.localeCompare(b.date))

  return {
    week_start:    weekStart,
    week_end:      weekEnd,
    user_id:       targetUserId,
    rows,
    weekly_total:  weeklyTotal,
  }
})
