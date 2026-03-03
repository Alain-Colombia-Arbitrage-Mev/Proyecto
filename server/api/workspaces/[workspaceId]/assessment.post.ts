import { serverSupabaseServiceRole } from '#supabase/server'
import { notifyUser } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const workspaceId = getRouterParam(event, 'workspaceId')!
  const { user } = await requireWorkspaceMember(event, workspaceId)
  const body = await readBody(event)

  if (!body.answers || !Array.isArray(body.answers)) {
    throw createError({ statusCode: 400, message: 'answers array is required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Call AI to analyze answers and produce a score
  const answersText = body.answers
    .map((a: any, i: number) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`)
    .join('\n\n')

  const config = useRuntimeConfig()
  let score = 50
  let aiAnalysis = ''

  try {
    const aiResponse = await $fetch<any>('/api/ai/assist', {
      method: 'POST',
      body: {
        action: 'chat',
        message: `You are a productivity psychologist. Analyze these procrastination assessment answers and respond with ONLY a JSON object (no markdown, no extra text):
{"score": <number 0-100 where 0=no procrastination, 100=severe>, "analysis": "<2-3 sentence analysis in the same language as the answers>"}

Assessment answers:
${answersText}`,
        projectId: null,
        workspaceId,
        history: [],
      },
    })

    if (aiResponse?.reply) {
      const parsed = JSON.parse(
        aiResponse.reply.replace(/```json\s*/g, '').replace(/```/g, '').trim()
      )
      if (typeof parsed.score === 'number') score = Math.min(100, Math.max(0, Math.round(parsed.score)))
      if (parsed.analysis) aiAnalysis = parsed.analysis
    }
  } catch {
    // Fallback: calculate score from numeric answers
    const numericAnswers = body.answers
      .map((a: any) => Number(a.value))
      .filter((v: number) => !isNaN(v))
    if (numericAnswers.length > 0) {
      const avg = numericAnswers.reduce((s: number, v: number) => s + v, 0) / numericAnswers.length
      score = Math.round((avg / 5) * 100)
    }
  }

  // Upsert assessment
  const { data, error } = await supabase
    .from('user_assessments')
    .upsert(
      {
        user_id: user.id,
        workspace_id: workspaceId,
        assessment_type: 'procrastination',
        score,
        answers: body.answers,
        ai_analysis: aiAnalysis,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,workspace_id,assessment_type' },
    )
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Error saving assessment' })

  // Notify workspace admins/owners about the procrastination risk
  notifyAdmins(event, supabase, workspaceId, user.id, score, aiAnalysis).catch(() => {})

  return data
})

async function notifyAdmins(
  event: any,
  supabase: any,
  workspaceId: string,
  userId: string,
  score: number,
  analysis: string,
) {
  // Get user info
  let userName = 'Un miembro'
  try {
    const { data: profile } = await supabase.auth.admin.getUserById(userId)
    userName = profile?.user?.user_metadata?.full_name || profile?.user?.email || 'Un miembro'
  } catch {}

  // Determine risk level
  const riskLevel = score <= 30 ? 'bajo' : score <= 60 ? 'moderado' : 'alto'
  const riskLevelEn = score <= 30 ? 'low' : score <= 60 ? 'moderate' : 'high'
  const emoji = score <= 30 ? '🟢' : score <= 60 ? '🟡' : '🔴'

  // Get workspace admins and owners
  const { data: admins } = await supabase
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)
    .in('role', ['admin', 'owner', 'superadmin'])

  if (!admins || admins.length === 0) return

  for (const admin of admins) {
    if (admin.user_id === userId) continue // Don't notify the user themselves

    notifyUser({
      event,
      userId: admin.user_id,
      type: 'procrastination_alert',
      title: `${emoji} Alerta de procrastinación: riesgo ${riskLevel}`,
      body: `${userName} completó la evaluación de procrastinación con un puntaje de ${score}/100 (riesgo ${riskLevel}).${analysis ? ` ${analysis}` : ''}`,
      entityType: 'assessment',
      entityId: workspaceId,
    }).catch(() => {})
  }
}
