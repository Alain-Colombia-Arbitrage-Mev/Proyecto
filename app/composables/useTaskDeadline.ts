import { differenceInHours, differenceInDays, differenceInMinutes, isPast } from 'date-fns'

interface DeadlineInfo {
  label: string
  status: 'overdue' | 'danger' | 'warning' | 'safe'
  colorClass: string
  bgClass: string
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

  return { getDeadlineInfo, getEstimatedLabel }
}
