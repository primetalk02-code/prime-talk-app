const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY
const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
const DAILY_API = 'https://api.daily.co/v1'

// Create a Daily room for a lesson
export async function createDailyRoom(lessonId) {
  const roomName = `lesson-${lessonId}`
  const response = await fetch(`${DAILY_API}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 hours
        enable_chat: true,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  })
  if (!response.ok) {
    // Room may already exist, try to get it
    const getResp = await fetch(`${DAILY_API}/rooms/${roomName}`, {
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` }
    })
    if (getResp.ok) return getResp.json()
    throw new Error(`Failed to create Daily room: ${response.status}`)
  }
  return response.json()
}

// Generate a meeting token for a participant
export async function createDailyToken(roomName, userId, isOwner = false) {
  const response = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 hours
      },
    }),
  })
  if (!response.ok) throw new Error(`Failed to create Daily token: ${response.status}`)
  const data = await response.json()
  return data.token
}

// Get room URL
export function getDailyRoomUrl(roomName) {
  return `https://${DAILY_DOMAIN}/${roomName}`
}