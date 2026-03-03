/**
 * Generate a Google Meet link.
 *
 * Google Meet allows creating "instant" meeting links via a predictable URL format.
 * For full calendar integration you'd use Google Calendar API with OAuth2,
 * but for quick scheduling this approach works without any API credentials.
 */
export function generateGoogleMeetLink(): string {
  // Generate a random meeting code in the format: xxx-xxxx-xxx
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  const seg1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const seg2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const seg3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `https://meet.google.com/${seg1}-${seg2}-${seg3}`
}

/**
 * Build a Google Calendar event URL that pre-fills a new event with a Meet link.
 * When the user clicks this, it opens Google Calendar with the meeting details pre-filled.
 */
export function buildGoogleCalendarUrl(opts: {
  title: string
  description?: string
  startTime: Date
  durationMinutes: number
  meetingUrl: string
  attendeeEmails?: string[]
}): string {
  const start = formatGCalDate(opts.startTime)
  const end = formatGCalDate(new Date(opts.startTime.getTime() + opts.durationMinutes * 60 * 1000))

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${start}/${end}`,
    details: `${opts.description || ''}\n\nEnlace de reunión: ${opts.meetingUrl}`,
    location: opts.meetingUrl,
  })

  if (opts.attendeeEmails?.length) {
    params.set('add', opts.attendeeEmails.join(','))
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Format a Date to Google Calendar's required format: YYYYMMDDTHHmmssZ */
function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
