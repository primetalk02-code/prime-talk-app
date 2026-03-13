import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') || ''
const DAILY_API_URL = 'https://api.daily.co/v1/rooms'
const DAILY_DOMAIN = 'https://primetalk.daily.co'

interface RequestBody {
  lesson_id?: string
  teacher_id?: string
  student_id?: string
}

interface DailyRoomResponse {
  id: string
  name: string
  url: string
  [key: string]: unknown
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getRoomName(lessonId?: string) {
  if (lessonId) {
    return `lesson-${lessonId}`
  }

  const timestamp = Date.now()
  const randomId = Math.random().toString(36).slice(2, 9)
  return `room-${timestamp}-${randomId}`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    if (!DAILY_API_KEY) {
      throw new Error('Missing DAILY_API_KEY environment variable.')
    }

    const body: RequestBody = await req.json().catch(() => ({}))
    const { lesson_id, teacher_id, student_id } = body
    const roomName = getRoomName(lesson_id)

    const dailyResponse = await fetch(DAILY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          enable_prejoin_ui: false,
          start_video_off: false,
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2,
        },
      }),
    })

    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text()
      const normalizedErrorText = errorText.toLowerCase()

      if (dailyResponse.status === 400 && normalizedErrorText.includes('already exists')) {
        const existingRoomUrl = `${DAILY_DOMAIN}/${roomName}`

        return jsonResponse({
          url: existingRoomUrl,
          room_url: existingRoomUrl,
          name: roomName,
          room_name: roomName,
          lesson_id,
          teacher_id,
          student_id,
          message: 'Room already exists',
        })
      }

      throw new Error(`Daily API error: ${errorText}`)
    }

    const roomData: DailyRoomResponse = await dailyResponse.json()

    return jsonResponse({
      url: roomData.url,
      room_url: roomData.url,
      name: roomData.name,
      room_name: roomData.name,
      room_id: roomData.id,
      lesson_id,
      teacher_id,
      student_id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create room'
    console.error('Error in create-daily-room function:', error)
    return jsonResponse({ error: message }, 500)
  }
})