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
  if (!transporter) {
    console.error(`[email] No SMTP transporter — check AMAZON_SMTP_ENDPOINT, AMAZON_SMTP_USER, AMAZON_SMTP_PASSWORD env vars`)
    return false
  }

  const config = useRuntimeConfig()
  const from = String(config.amazonEmailFrom || '') || `FocusFlow <noreply@focusflow.app>`

  try {
    const info = await transporter.sendMail({ from, to, subject, html })
    console.log(`[email] Sent to=${to} messageId=${info.messageId}`)
    return true
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[email] Send failed from=${from} to=${to} subject="${subject}": ${message}`)
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

export function taskAssignedEmailHtml(taskTitle: string, projectName: string, assignedByName: string): string {
  const safeTitle = escapeHtml(taskTitle)
  const safeProject = escapeHtml(projectName)
  const safeName = escapeHtml(assignedByName)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; padding: 32px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 40px; height: 40px; background: #0ea5e9; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 18px;">F</div>
    </div>
    <h2 style="margin: 0 0 8px; font-size: 18px; color: #0D0D0D;">Tarea Asignada</h2>
    <p style="margin: 0 0 16px; color: #7A7A7A; font-size: 14px;">Se te ha asignado una nueva tarea:</p>
    <div style="background: #DBEAFE; border-left: 4px solid #0ea5e9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; font-weight: 600; color: #0D0D0D; font-size: 15px;">${safeTitle}</p>
      <p style="margin: 4px 0 0; color: #1E40AF; font-size: 13px;">Proyecto: ${safeProject}</p>
      <p style="margin: 4px 0 0; color: #1E40AF; font-size: 13px;">Asignada por: ${safeName}</p>
    </div>
    <p style="margin: 0; color: #7A7A7A; font-size: 12px; text-align: center;">&mdash; FocusFlow</p>
  </div>
</body>
</html>`
}

export function workspaceInvitationEmailHtml(workspaceName: string, invitedByName: string, role: string): string {
  const safeWorkspace = escapeHtml(workspaceName)
  const safeName = escapeHtml(invitedByName)
  const safeRole = escapeHtml(role)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; padding: 32px; margin: 0;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 40px; height: 40px; background: #0ea5e9; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 18px;">F</div>
    </div>
    <h2 style="margin: 0 0 8px; font-size: 18px; color: #0D0D0D;">Invitaci&oacute;n a Workspace</h2>
    <p style="margin: 0 0 16px; color: #7A7A7A; font-size: 14px;">Has sido invitado a un workspace:</p>
    <div style="background: #D1FAE5; border-left: 4px solid #10B981; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
      <p style="margin: 0; font-weight: 600; color: #0D0D0D; font-size: 15px;">${safeWorkspace}</p>
      <p style="margin: 4px 0 0; color: #065F46; font-size: 13px;">Rol: ${safeRole}</p>
      <p style="margin: 4px 0 0; color: #065F46; font-size: 13px;">Invitado por: ${safeName}</p>
    </div>
    <p style="margin: 0; color: #7A7A7A; font-size: 12px; text-align: center;">&mdash; FocusFlow</p>
  </div>
</body>
</html>`
}

export function meetingInvitationEmailHtml(opts: {
  title: string
  description?: string
  scheduledAt: string
  durationMinutes: number
  meetingUrl: string
  organizerName: string
  projectName?: string
}): string {
  const safeTitle = escapeHtml(opts.title)
  const safeOrganizer = escapeHtml(opts.organizerName)
  const safeProject = opts.projectName ? escapeHtml(opts.projectName) : null
  const safeDesc = opts.description ? escapeHtml(opts.description) : null

  let formattedDate: string
  try {
    formattedDate = new Date(opts.scheduledAt).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    formattedDate = opts.scheduledAt
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; padding: 32px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 40px; height: 40px; background: #0ea5e9; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 18px;">F</div>
    </div>
    <h2 style="margin: 0 0 4px; font-size: 18px; color: #0D0D0D;">Reuni&oacute;n Programada</h2>
    <p style="margin: 0 0 20px; color: #7A7A7A; font-size: 14px;">${safeOrganizer} te invit&oacute; a una reuni&oacute;n</p>

    <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #0D0D0D; font-size: 16px;">${safeTitle}</p>
      ${safeProject ? `<p style="margin: 0 0 4px; color: #1E40AF; font-size: 13px;">Proyecto: ${safeProject}</p>` : ''}
      ${safeDesc ? `<p style="margin: 4px 0 8px; color: #374151; font-size: 13px;">${safeDesc}</p>` : ''}
      <div style="border-top: 1px solid #BFDBFE; padding-top: 10px; margin-top: 8px;">
        <p style="margin: 0 0 4px; color: #1E40AF; font-size: 13px;">
          &#128197; ${formattedDate}
        </p>
        <p style="margin: 0 0 4px; color: #1E40AF; font-size: 13px;">
          &#9200; ${opts.durationMinutes} minutos
        </p>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="${escapeHtml(opts.meetingUrl)}"
         style="display: inline-block; background: #1a73e8; color: white; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
        Unirse a Google Meet
      </a>
    </div>

    <p style="margin: 0; color: #7A7A7A; font-size: 11px; text-align: center;">
      <a href="${escapeHtml(opts.meetingUrl)}" style="color: #3B82F6; text-decoration: none;">${escapeHtml(opts.meetingUrl)}</a>
    </p>
    <p style="margin: 12px 0 0; color: #7A7A7A; font-size: 12px; text-align: center;">&mdash; FocusFlow</p>
  </div>
</body>
</html>`
}

export function pendingInvitationEmailHtml(opts: {
  workspaceName: string
  invitedByName: string
  role: string
  registerUrl: string
}): string {
  const safeWorkspace = escapeHtml(opts.workspaceName)
  const safeName = escapeHtml(opts.invitedByName)
  const safeRole = escapeHtml(opts.role)

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f6f6f6; padding: 32px; margin: 0;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px 32px; border: 1px solid #e5e7eb; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="display: inline-block; width: 48px; height: 48px; background: #75fc96; border-radius: 12px; line-height: 48px; color: #17191c; font-weight: bold; font-size: 20px; font-family: 'Space Mono', monospace;">F</div>
    </div>
    <h2 style="margin: 0 0 8px; font-size: 22px; color: #0D0D0D; text-align: center; font-weight: 700;">Te han invitado a FocusFlow</h2>
    <p style="margin: 0 0 24px; color: #7A7A7A; font-size: 15px; text-align: center; line-height: 1.5;">
      <strong style="color: #0D0D0D;">${safeName}</strong> te invit&oacute; a colaborar en el workspace <strong style="color: #0D0D0D;">${safeWorkspace}</strong>
    </p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Workspace</td>
          <td style="padding: 4px 0; color: #0D0D0D; font-size: 13px; font-weight: 600; text-align: right;">${safeWorkspace}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Rol asignado</td>
          <td style="padding: 4px 0; color: #0D0D0D; font-size: 13px; font-weight: 600; text-align: right;">${safeRole}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Invitado por</td>
          <td style="padding: 4px 0; color: #0D0D0D; font-size: 13px; font-weight: 600; text-align: right;">${safeName}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${escapeHtml(opts.registerUrl)}"
         style="display: inline-block; background: #0D0D0D; color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 36px; border-radius: 10px; letter-spacing: 0.3px;">
        Crear cuenta y unirme
      </a>
    </div>
    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5;">
      &iquest;Ya tienes cuenta?
      <a href="${escapeHtml(opts.registerUrl.replace('/auth/register?', '/auth/login?'))}"
         style="color: #10B981; text-decoration: underline; font-weight: 600;">
        Inicia sesi&oacute;n aqu&iacute;
      </a>
    </p>
    <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">
      Al registrarte o iniciar sesi&oacute;n, ser&aacute;s a&ntilde;adido autom&aacute;ticamente al workspace.
    </p>
    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
    <p style="margin: 0; color: #d1d5db; font-size: 11px; text-align: center;">
      FocusFlow &mdash; Plataforma de gesti&oacute;n de proyectos con IA
    </p>
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
