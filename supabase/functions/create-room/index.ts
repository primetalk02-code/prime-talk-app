// Supabase Edge Function: create-room
// Creates a Daily.co room for video lessons

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') || ''
const DAILY_BASE_URL = 'https://api.daily.co/v1'

interface RequestBody {
  lesson_id?: string
  teacher_id?: string
  student_id?: string
}

interface DailyRoomResponse {
  url: string
  name: string
  id: string
  [key: string]: any
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json().catch(() => ({}))
    const { lesson_id, teacher_id, student_id } = body

    // Generate unique room name
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const roomName = lesson_id 
      ? `lesson-${lesson_id}`
      : `room-${timestamp}-${randomId}`

    console.log('Creating Daily room:', roomName)

    // Create Daily.co room
    const dailyResponse = await fetch(`${DAILY_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
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
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 2), // 2 hours expiry
        },
      }),
    })

    if (!dailyResponse.ok) {
      const errorText = await dailyResponse.text()
      console.error('Daily API Error:', errorText)
      
      // If room already exists, that's okay - just return the URL
      if (dailyResponse.status === 400 && errorText.includes('already exists')) {
        return new Response(
          JSON.stringify({
            url: `https://primetalk.daily.co/${roomName}`,
            name: roomName,
            message: 'Room already exists',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
      
      throw new Error(`Daily API error: ${errorText}`)
    }

    const roomData: DailyRoomResponse = await dailyResponse.json()
    
    console.log('Daily room created:', roomData.url)

    // Return the room URL
    return new Response(
      JSON.stringify({
        url: roomData.url,
        name: roomData.name,
        room_id: roomData.id,
        lesson_id,
        teacher_id,
        student_id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error in create-room function:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create room',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
