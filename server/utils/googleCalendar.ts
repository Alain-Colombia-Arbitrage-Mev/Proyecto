/**
 * Create a real Google Calendar event with Google Meet conference.
 * Uses the user's OAuth access token obtained via Supabase Google Auth.
 */
export async function createGoogleMeetEvent(opts: {
  accessToken: string
  title: string
  description?: string
  startTime: string
  durationMinutes: number
  attendeeEmails?: string[]
}): Promise<{ meetingUrl: string; calendarEventId: string } | null> {
  const start = new Date(opts.startTime)
  const end = new Date(start.getTime() + opts.durationMinutes * 60 * 1000)

  const event = {
    summary: opts.title,
    description: opts.description || '',
    start: {
      dateTime: start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'UTC',
    },
    conferenceData: {
      createRequest: {
        requestId: `focusflow-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    attendees: (opts.attendeeEmails || []).map(email => ({ email })),
  }

  let res: Response
  try {
    res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${opts.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    )
  } catch (err) {
    console.error('[googleCalendar] Network error:', err)
    return null
  }

  if (!res.ok) {
    const err = await res.text().catch(() => 'unknown error')
    console.error('[googleCalendar] Failed to create event:', res.status, err)
    return null
  }

  const data = await res.json().catch(() => null)
  if (!data) return null

  const meetingUrl = data.conferenceData?.entryPoints?.find(
    (ep: any) => ep.entryPointType === 'video',
  )?.uri || data.hangoutLink || ''

  return {
    meetingUrl,
    calendarEventId: data.id,
  }
}
