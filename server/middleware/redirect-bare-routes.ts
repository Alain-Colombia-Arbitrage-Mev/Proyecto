// Redirect bare routes like /dashboard → /{workspace}/dashboard
// This runs server-side before Nuxt page routing
const workspacePages = new Set([
  'dashboard', 'projects', 'agents', 'timesheet', 'files',
  'goals', 'roadmap', 'agenda', 'team', 'roles', 'billing', 'settings',
])

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  // Only handle bare paths like /dashboard, /projects, etc.
  const segments = path.split('/').filter(Boolean)
  if (segments.length >= 1 && segments.length <= 1 && workspacePages.has(segments[0])) {
    // Read workspace slug from cookie (Supabase stores the user session,
    // but we need the workspace slug from a client cookie)
    const slugCookie = getCookie(event, 'focusflow_workspace_slug')
    if (slugCookie) {
      return sendRedirect(event, `/${slugCookie}${path}`, 302)
    } else {
      // No workspace cookie, redirect to root to resolve
      return sendRedirect(event, '/', 302)
    }
  }
})
