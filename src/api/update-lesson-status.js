import {
  assertPostMethod,
  getServerSupabaseClient,
  parseOptionalIsoDate,
  requireStringField,
  sendError,
} from './_helpers.js'

const ALLOWED_STATUSES = new Set([
  'waiting',
  'active',
  'in_progress',
  'completed',
  'finished',
  'declined',
  'cancelled',
])

export default async function handler(req, res) {
  if (!assertPostMethod(req, res)) {
    return
  }

  try {
    const lessonId = requireStringField(req.body, 'lessonId')
    const status = requireStringField(req.body, 'status')

    if (!ALLOWED_STATUSES.has(status)) {
      return sendError(res, 400, `Invalid lesson status: ${status}`)
    }

    const endedAt = parseOptionalIsoDate(req.body?.endedAt)
    const recordingUrl =
      typeof req.body?.recordingUrl === 'string' && req.body.recordingUrl.trim()
        ? req.body.recordingUrl.trim()
        : null

    const updateFields = { status }
    if (endedAt) {
      updateFields.ended_at = endedAt
    }
    if (recordingUrl) {
      updateFields.recording_url = recordingUrl
    }

    const supabase = getServerSupabaseClient()
    const { data, error } = await supabase
      .from('lessons')
      .update(updateFields)
      .eq('id', lessonId)
      .select('id, status, ended_at, recording_url')
      .single()

    if (error || !data) {
      return sendError(res, 500, 'Failed to update lesson status', error?.message)
    }

    return res.status(200).json({
      success: true,
      lesson: data,
    })
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to update lesson status')
  }
}
