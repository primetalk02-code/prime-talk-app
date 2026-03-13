import { createClient } from '@supabase/supabase-js'

const DAILY_API_URL = 'https://api.daily.co/v1/rooms'

function getEnvValue(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return String(value).trim()
}

export function sendError(res, status, message, details = null) {
  const payload = { error: message }
  if (details) {
    payload.details = details
  }
  return res.status(status).json(payload)
}

export function assertPostMethod(req, res) {
  if (req.method === 'POST') {
    return true
  }
  sendError(res, 405, 'Method not allowed')
  return false
}

export function requireStringField(body, fieldName) {
  const value = body?.[fieldName]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing or invalid "${fieldName}"`)
  }
  return value.trim()
}

export function parseOptionalIsoDate(value) {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value')
  }
  return date.toISOString()
}

export function getServerSupabaseClient() {
  const supabaseUrl = getEnvValue('VITE_SUPABASE_URL')
  const serviceRoleKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function getDailyApiKey() {
  return getEnvValue('DAILY_API_KEY')
}

export async function createDailyRoomForLesson({
  lessonId,
  expirySeconds = 2 * 60 * 60,
}) {
  const dailyApiKey = getDailyApiKey()
  const roomName = `lesson-${lessonId}`
  const exp = Math.floor(Date.now() / 1000) + expirySeconds

  const response = await fetch(DAILY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp,
        enable_chat: true,
        enable_screenshare: true,
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Daily room creation failed (${response.status}): ${message}`)
  }

  const data = await response.json()

  if (!data?.url) {
    throw new Error('Daily API response missing room URL')
  }

  return {
    roomUrl: data.url,
    roomName: data.name || roomName,
  }
}
