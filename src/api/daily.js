import { supabase } from '../lib/supabaseClient'

const DAILY_API_URL = 'https://api.daily.co/v1/rooms'
const DAILY_TOKEN_URL = 'https://api.daily.co/v1/meeting-tokens'
const DEFAULT_LESSON_DURATION_MINUTES = 26

function createRoomName() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `primetalk-${crypto.randomUUID()}`
  }

  const randomPart = Math.random().toString(36).slice(2, 10)
  return `primetalk-${Date.now().toString(36)}-${randomPart}`
}

export async function createDailyRoom(durationMinutes = DEFAULT_LESSON_DURATION_MINUTES) {
  const apiKey = import.meta.env.VITE_DAILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_DAILY_API_KEY. Add it to your environment variables.')
  }

  const expiresAt = Math.floor(Date.now() / 1000) + durationMinutes * 60 + 120
  const response = await fetch(DAILY_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: createRoomName(),
      properties: {
        exp: expiresAt,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to create Daily room (${response.status}): ${body || 'Unknown error'}`)
  }

  const room = await response.json()

  if (!room?.url) {
    throw new Error('Daily API response did not include room URL.')
  }

  return room.url
}

export async function createDailyToken(roomName, userId, isOwner = false) {
  const apiKey = import.meta.env.VITE_DAILY_API_KEY

  if (!apiKey) {
    throw new Error('Missing VITE_DAILY_API_KEY. Add it to your environment variables.')
  }

  const response = await fetch(DAILY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      room_name: roomName,
      properties: {
        user_name: userId,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
      }
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Failed to create Daily token (${response.status}): ${body || 'Unknown error'}`)
  }

  const tokenData = await response.json()
  return tokenData.token
}

export async function extractRoomNameFromUrl(roomUrl) {
  try {
    const url = new URL(roomUrl)
    const pathParts = url.pathname.split('/')
    const roomName = pathParts[pathParts.length - 1]
    return roomName
  } catch (error) {
    throw new Error('Invalid room URL format')
  }
}

export const LESSON_DURATION_MINUTES = DEFAULT_LESSON_DURATION_MINUTES