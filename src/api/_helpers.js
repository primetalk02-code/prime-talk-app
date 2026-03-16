import { createClient } from '@supabase/supabase-js'

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
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}