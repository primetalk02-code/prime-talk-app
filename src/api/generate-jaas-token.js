import { assertPostMethod, requireStringField, sendError } from './_helpers.js'

// JaaS configuration
const JaaSAppId = process.env.VITE_JAAS_APP_ID || 'vpaas-magic-cookie-xxxxx/xxxxx'
const JaaSApiKey = process.env.VITE_JAAS_API_KEY || 'your-jaas-api-key'

export default async function handler(req, res) {
  if (!assertPostMethod(req, res)) {
    return
  }

  try {
    const roomName = requireStringField(req.body, 'roomName')
    const userId = requireStringField(req.body, 'userId')
    const userName = req.body?.userName || 'User'
    const email = req.body?.email || ''
    const isModerator = req.body?.isModerator || false

    // Generate JaaS JWT token
    const jwt = await generateJaaSToken({
      roomName,
      userId,
      userName,
      email,
      isModerator
    })

    return res.status(200).json({
      success: true,
      jwt: jwt,
      roomName: roomName
    })
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to generate JaaS token')
  }
}

async function generateJaaSToken({ roomName, userId, userName, email, isModerator }) {
  // This is a simplified JWT generation. In production, you should use a proper JWT library
  // and sign the token with your JaaS API secret
  
  const payload = {
    aud: 'jitsi',
    iss: JaaSAppId,
    sub: 'meet.jitsi.si',
    room: roomName,
    moderator: isModerator,
    context: {
      user: {
        id: userId,
        name: userName,
        email: email
      }
    },
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    nbf: Math.floor(Date.now() / 1000) - 60 // 1 minute before now
  }

  // In a real implementation, you would use a JWT library to sign this payload
  // For now, we'll return a mock token structure
  return JSON.stringify(payload)
}