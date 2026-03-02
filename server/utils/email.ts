import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

let _transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter

  const config = useRuntimeConfig()
  const host = String(config.amazonSmtpEndpoint || '')
  const port = Number(config.amazonSmtpPort) || 587
  const user = String(config.amazonSmtpUser || '')
  const pass = String(config.amazonSmtpPassword || '')

  if (!host || !user || !pass) {
    return null
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })

  return _transporter
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false

  const config = useRuntimeConfig()

  try {
    await transporter.sendMail({
      from: String(config.amazonEmailFrom || '') || `FocusFlow <noreply@focusflow.app>`,
      to,
      subject,
      html,
    })
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[email] Send failed to=${to} subject="${subject}": ${message}`)
    return false
  }
}

export function deadlineEmailHtml(taskTitle: string, dueDate: string, projectName: string): string {
  const safeTitle = escapeHtml(taskTitle)
  const safeProject = escapeHtml(projectName)
  let formattedDate: string
  try {
    formattedDate = new Date(dueDate).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    formattedDate = dueDate
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; padding: 32px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 40px; height: 40px; background: #0ea5e9; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 18px;">F</div>
    </div>
    <h2 style="margin: 0 0 8px; font-size: 18px; color: #0D0D0D;">Deadline Alert</h2>
    <p style="margin: 0 0 16px; color: #7A7A7A; font-size: 14px;">Una tarea requiere tu atenci&oacute;n:</p>
    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; font-weight: 600; color: #0D0D0D; font-size: 15px;">${safeTitle}</p>
      <p style="margin: 4px 0 0; color: #92400E; font-size: 13px;">Proyecto: ${safeProject}</p>
      <p style="margin: 4px 0 0; color: #92400E; font-size: 13px;">Fecha l&iacute;mite: ${formattedDate}</p>
    </div>
    <p style="margin: 0; color: #7A7A7A; font-size: 12px; text-align: center;">&mdash; FocusFlow</p>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
