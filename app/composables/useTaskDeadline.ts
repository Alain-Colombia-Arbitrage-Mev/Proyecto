import { differenceInHours, differenceInDays, differenceInMinutes, isPast } from 'date-fns'

interface DeadlineInfo {
  label: string
  status: 'overdue' | 'danger' | 'warning' | 'safe'
  colorClass: string
  bgClass: string
}

interface TaskProgressInfo {
  /** 0–100 representing elapsed time vs total window */
  percent: number
  /** Hex color for the bar */
  color: string
  /** Short label to show next to bar (e.g. "3h / 8h") */
  label: string
  /** Source of the calculation */
  source: 'deadline' | 'estimate' | 'both'
}

export function useTaskDeadline() {
  function getDeadlineInfo(dueDate: string | undefined | null): DeadlineInfo | null {
    if (!dueDate) return null

    const due = new Date(dueDate)
    const now = new Date()

    if (isPast(due)) {
      const hoursAgo = Math.abs(differenceInHours(due, now))
      const daysAgo = Math.abs(differenceInDays(due, now))
      const label = daysAgo >= 1 ? `Vencida hace ${daysAgo}d` : `Vencida hace ${hoursAgo}h`
      return { label, status: 'overdue', colorClass: 'text-red-600', bgClass: 'bg-red-50' }
    }

    const hoursLeft = differenceInHours(due, now)
    const minsLeft = differenceInMinutes(due, now)

    if (hoursLeft < 1) {
      return {
        label: `${minsLeft}min restantes`,
        status: 'danger',
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50',
      }
    }

    if (hoursLeft < 24) {
      return {
        label: `${hoursLeft}h restantes`,
        status: 'warning',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-50',
      }
    }

    const daysLeft = differenceInDays(due, now)
    const remainingHours = hoursLeft - daysLeft * 24
    const label = remainingHours > 0 ? `${daysLeft}d ${remainingHours}h restantes` : `${daysLeft}d restantes`
    return { label, status: 'safe', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' }
  }

  function getEstimatedLabel(hours: number | undefined | null): string | null {
    if (!hours) return null
    if (hours < 1) return `${Math.round(hours * 60)}min estimadas`
    return `${hours}h estimadas`
  }

  /**
   * Calculates task progress based on created_at, due_date, and estimated_hours.
   *
   * Priority logic:
   * 1. If due_date exists → progress = time elapsed from created_at to due_date
   * 2. If only estimated_hours → progress = time elapsed from created_at vs estimated hours
   * 3. If both → uses due_date for bar, but label shows hours context
   *
   * Returns null when neither due_date nor estimated_hours is available.
   */
  function getTaskProgress(
    dueDate: string | undefined | null,
    createdAt: string | undefined | null,
    estimatedHours: number | undefined | null,
  ): TaskProgressInfo | null {
    const now = new Date()
    const start = createdAt ? new Date(createdAt) : null
    const elapsedMs = start ? now.getTime() - start.getTime() : 0
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    // Case 1: Has due_date (with or without estimated_hours)
    if (dueDate) {
      const due = new Date(dueDate)

      if (isPast(due)) {
        const label = estimatedHours
          ? `${formatH(elapsedHours)} / ${formatH(estimatedHours)}`
          : 'Vencida'
        return { percent: 100, color: '#EF4444', label, source: estimatedHours ? 'both' : 'deadline' }
      }

      // Calculate deadline progress using created_at as anchor
      const startMs = start ? start.getTime() : due.getTime() - 7 * 24 * 60 * 60 * 1000
      const totalWindow = due.getTime() - startMs
      if (totalWindow <= 0) {
        return { percent: 100, color: '#EF4444', label: 'Vencida', source: 'deadline' }
      }

      const elapsed = now.getTime() - startMs
      const percent = Math.max(0, Math.min(100, Math.round((elapsed / totalWindow) * 100)))

      let label: string
      if (estimatedHours) {
        label = `${formatH(elapsedHours)} / ${formatH(estimatedHours)}`
      } else {
        const hoursLeft = differenceInHours(due, now)
        const daysLeft = differenceInDays(due, now)
        label = daysLeft >= 1 ? `${daysLeft}d restantes` : `${hoursLeft}h restantes`
      }

      return { percent, color: progressColor(percent), label, source: estimatedHours ? 'both' : 'deadline' }
    }

    // Case 2: Only estimated_hours, no due_date
    if (estimatedHours && estimatedHours > 0 && start) {
      const percent = Math.max(0, Math.min(100, Math.round((elapsedHours / estimatedHours) * 100)))
      const label = `${formatH(elapsedHours)} / ${formatH(estimatedHours)}`
      return { percent, color: progressColor(percent), label, source: 'estimate' }
    }

    return null
  }

  /** Format hours nicely: 0.5 → "30m", 2.3 → "2.3h", 48 → "2d" */
  function formatH(h: number): string {
    if (h < 1) return `${Math.round(h * 60)}m`
    if (h >= 48) return `${Math.round(h / 24)}d`
    if (h >= 24) {
      const d = Math.floor(h / 24)
      const rem = Math.round(h % 24)
      return rem > 0 ? `${d}d${rem}h` : `${d}d`
    }
    return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
  }

  function progressColor(percent: number): string {
    if (percent >= 100) return '#EF4444'  // red-500
    if (percent >= 85) return '#F97316'   // orange-500
    if (percent >= 65) return '#F59E0B'   // amber-500
    if (percent >= 40) return '#3B82F6'   // blue-500
    return '#10B981'                       // emerald-500
  }

  return { getDeadlineInfo, getEstimatedLabel, getTaskProgress }
}
