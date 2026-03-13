// /api/create-daily-room.js
// Vercel/Next.js API route for creating a Daily.co room

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { lessonId } = req.body
  if (!lessonId) {
    return res.status(400).json({ error: 'Missing lessonId' })
  }

  const DAILY_API_KEY = process.env.DAILY_API_KEY
  if (!DAILY_API_KEY) {
    return res.status(500).json({ error: 'Missing DAILY_API_KEY in environment' })
  }

  try {
    // Try to create the room (idempotent if name is reused)
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: lessonId,
        properties: {
          enable_prejoin_ui: true,
          exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
        },
      }),
    })

    if (!response.ok) {
      // If room already exists, fetch its info
      if (response.status === 409) {
        const infoRes = await fetch(`https://api.daily.co/v1/rooms/${lessonId}`, {
          headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
        })
        if (!infoRes.ok) throw new Error('Failed to fetch existing room')
        const info = await infoRes.json()
        console.log('Daily room (existing):', info.url)
        return res.status(200).json({ url: info.url })
      }
      const error = await response.json()
      return res.status(response.status).json({ error: error.info || 'Failed to create room' })
    }

    const data = await response.json()
    console.log('Daily room created:', data.url)
    return res.status(200).json({ url: data.url })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
