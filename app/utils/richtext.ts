/**
 * Converts plain text to HTML paragraphs.
 * If the text already contains HTML tags, returns as-is.
 */
export function plainTextToHtml(text: string): string {
  if (!text) return ''
  // Already HTML?
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  // Convert newlines to paragraphs
  return text
    .split(/\n\n+/)
    .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * Strips HTML tags for preview text (e.g. kanban cards).
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}
