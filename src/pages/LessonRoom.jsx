import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const JAAS_APP_ID = import.meta.env.VITE_JAAS_APP_ID || 'vpaas-magic-cookie-062d4f0193ae439a8a1a9867c2893dd0'
const JAAS_KEY_ID = import.meta.env.VITE_JAAS_KEY_ID || 'vpaas-magic-cookie-062d4f0193ae439a8a1a9867c2893dd0/d70639'

async function generateJWT(user, isModerator) {
  const header = { alg: 'RS256', kid: JAAS_KEY_ID, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    iat: now,
    exp: now + 7200,
    nbf: now - 10,
    sub: JAAS_APP_ID,
    context: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        moderator: isModerator ? 'true' : 'false',
      },
      features: { livestreaming: 'false', recording: 'false', transcription: 'false', 'outbound-call': 'false' }
    },
    room: '*'
  }
  const b64 = str => btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
  const headerB64 = b64(JSON.stringify(header))
  const payloadB64 = b64(JSON.stringify(payload))
  const signingInput = headerB64 + '.' + payloadB64

  const pemKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCi1XgDRpKH5iWv
3qhaPIYLm8Slc/JQji4cNS4HfvFEY5+5vWWVinEPVyd96oDsdbN/5u6eNlCcWAVU
2iRsGeptC3KhocycFs9F7P3i3gxrs9bobwoOJR8KsXlZZuwZrYHdPST72Fx0Y/Mp
3Y7ash3dbAqjbF9YWSXCFLdEZwicopjPBIh0KzQsnnEQ1R83KOrHAKpGTVjF68+z
KjinN+ymjVt9HROW7P5WiFOxLUnsiUign/wzr/kWgdJ+6tnlAVcOQ4XwGx25Vxm2
s9+XnEnjZ2jhgZSc1qXEP/yxWAosBFvalnpmdBoIlE9BtctG+k5QBG5cacSUEWu0
t3wHGcg7AgMBAAECggEBAJOePKeTkgGbtmzCyRLNLaRWeaaY/4Lh8pFl8K2g+m7K
diH3vqEcGbUTiNzQ/EHhznHUVFyf1uJ1tZegD0blE635o9k+CnUzBINa/yttrArz
xY+AIriCFKsoC1/uO3pn3oRIC0A5fE+T0P0SO5Ctyv9SFC7lb2ZzoxRYnXBoi9ka
6IXBB5VNUyp7SUTVeruhtO9K7CrWg9e0KYe/Ll/0L7pU3VAH87Zgc6J9k0/SxzU0
pDdjH5dYJn0baXYpdpQyXzNX1teIM7kIOGZqkGWVt9XKKsotFjjh61lrz5JlQXBz
gXzFSNpjjYyXLg2sFWIM6lkFBZ8BTF/z1JCB0pwo6uECgYEAzR4M29lEo+QR+HYR
TSm1b2+nnMMvaCtnf56tKjop9/OdlbsRx0LoYSPFokP3xTBCAQmbhNdKBNrf0+S+
wGEeYyvMXA6RRBV0qIJl3WBxgqXfPH+jKSggaTldY2nHK2H+TC0cKUMZtzOX1v3e
5pUe0xw0qXXw7wmqdlmGpcMKTvECgYEAyzo1rT3Jk36KZTSqB5+m3coGAKj1WQtN
9dhXyNaDymJVT7fg5E/UQqp3oCnq9WGMWSXyvWcygMxrEUqbG+QL9UBzBr2wW2QE
+b1P/dQW7hc/f5AHnnWlcas3xXCVEnQD+d198lQE+y7C/MHw2FqM/FnZKNxKZXZ6
MNaJqJRaYesCgYBRDjDyp9cSFMxtLOsFXRgPo0XPEuqm9Y/+xIuVhkqTaze4taX+
4hfGW0Z8KvO8fqd2lX9ZbWIYrQ2KRHiEuVwywFoPfso0522kMXNjmfsBL98Zny6w
0uSL8FlRMbm9EQpWu/TG8Xc2CDNWiBgPcpotvpWo6ax+KYmtHw+wbXSjYQKBgCJT
EY/SGMK1o7BWRcWF3IwnO/5Oiynf8+nrAWClgprjIt+VAgHtzb74xb2idtG9CRRh
iW8eB/SjEg5YmHwMd0yT9xmTXj8BVKnNpL4NXVYXTR1BeVf1LN1W+tN5IWR9fdJs
64HLWRAHpN1F8GTKXnecwUXadyJN8XNgON3lOKLDAoGAGtDaoEKWDiJRKtpPwBzX
A27E1qV9uuFZ/1BGBRmoK2IZxKf/VeHJpeKyCKWeRu3KzjQqFRsQWn0Rw+3BsOH6
euT92qyT+ncCXwxbg+zVe7KajA7fcdK5dHGGAKjXGjSGliuNWRCzzbcFeNaAByH6
Pm3snwGF458OqNz4P7VwA6s=
-----END PRIVATE KEY-----`

  try {
    const keyData = pemKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', binaryKey.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    )
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(signingInput))
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
    return signingInput + '.' + sigB64
  } catch(e) {
    console.error('JWT generation failed:', e)
    return null
  }
}

export default function LessonRoom() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const pollRef = useRef(null)
  const isTeacherRef = useRef(false)
  const lessonIdRef = useRef(lessonId)

  const [lesson, setLesson] = useState(null)
  const [status, setStatus] = useState('Loading lesson...')
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  const endLesson = async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} window._jitsiApi = null }
    try { await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonIdRef.current) } catch(e) {}
    navigate(isTeacherRef.current ? '/teacher/dashboard' : '/student/dashboard')
  }

  const joinJaas = async (roomName, userInfo, isModerator) => {
    if (!containerRef.current) { setError('Container not ready. Refresh.'); return }
    if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} }

    const jwt = await generateJWT(userInfo, isModerator)

    const loadScript = (src, cb) => {
      if (document.querySelector('script[src="' + src + '"]')) { cb(); return }
      const s = document.createElement('script')
      s.src = src
      s.async = true
      s.onload = cb
      s.onerror = () => setError('Failed to load video library.')
      document.head.appendChild(s)
    }

    loadScript('https://8x8.vc/libs/external_api.min.js', () => {
      try {
        setJoined(true)
        const api = new window.JitsiMeetExternalAPI('8x8.vc', {
          roomName: JAAS_APP_ID + '/' + roomName,
          parentNode: containerRef.current,
          jwt: jwt,
          userInfo: { displayName: userInfo.name, email: userInfo.email },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            hideConferenceSubject: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: ['microphone','camera','hangup','chat','fullscreen','tileview','settings'],
          },
          width: '100%',
          height: '100%',
        })
        window._jitsiApi = api
        api.addEventListener('readyToClose', () => endLesson())
      } catch(e) { setError('Video error: ' + e.message); setJoined(false) }
    })
  }

  const pollForActive = (id, userInfo) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('lessons').select('status, room_name').eq('id', id).single()
      if (!data) return
      if (data.status === 'active') {
        clearInterval(pollRef.current); pollRef.current = null
        joinJaas(data.room_name || id, userInfo, false)
      } else if (data.status === 'declined') {
        clearInterval(pollRef.current); pollRef.current = null
        setError('Teacher declined. Please go back and try again.')
      }
    }, 2000)
  }

  useEffect(() => {
    if (!lessonId || lessonId === 'undefined') { setError('No lesson ID found.'); return }
    lessonIdRef.current = lessonId
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/student/login'); return }
        const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
        const teacher = profile && profile.role === 'teacher'
        isTeacherRef.current = teacher
        const userInfo = { id: user.id, name: profile?.full_name || (teacher ? 'Teacher' : 'Student'), email: user.email || '' }
        const { data: ld, error: fe } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
        if (fe || !ld) { setError('Lesson not found. ID: ' + lessonId); return }
        setLesson(ld)
        const roomName = ld.room_name || lessonId
        if (teacher) {
          joinJaas(roomName, userInfo, true)
        } else if (ld.status === 'active') {
          joinJaas(roomName, userInfo, false)
        } else {
          setStatus('Waiting for teacher to accept...')
          pollForActive(lessonId, userInfo)
        }
      } catch(e) { setError('Error: ' + e.message) }
    }
    init()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (window._jitsiApi) { try { window._jitsiApi.dispose() } catch(e){} window._jitsiApi = null }
    }
  }, [lessonId])

  return (
    React.createElement('div', { style: { width: '100vw', height: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' } },
      React.createElement('div', { style: { height: '56px', flexShrink: 0, background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' } },
        React.createElement('span', { style: { color: '#0EA5A0', fontWeight: 700, fontSize: '16px' } }, 'Prime Talk'),
        lesson && React.createElement('span', { style: { color: '#94A3B8', fontSize: '12px' } }, (lesson.duration ? lesson.duration + ' min' : '') + (lesson.duration && lesson.textbook ? ' - ' : '') + (lesson.textbook || '')),
        React.createElement('button', { onClick: endLesson, style: { background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' } }, 'End Lesson')
      ),
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', background: '#0D1117' } },
        !joined && React.createElement('div', { style: { position: 'absolute', inset: 0, zIndex: 5, background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' } },
          error
            ? React.createElement(React.Fragment, null,
                React.createElement('p', { style: { color: '#EF4444', fontSize: '15px', textAlign: 'center', maxWidth: '360px', margin: 0 } }, error),
                React.createElement('button', { onClick: () => navigate(-1), style: { background: '#0EA5A0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 } }, 'Go Back')
              )
            : React.createElement(React.Fragment, null,
                React.createElement('p', { style: { color: '#94A3B8', fontSize: '16px', margin: 0, textAlign: 'center' } }, status),
                status.includes('Waiting') && React.createElement('p', { style: { color: '#475569', fontSize: '13px', margin: 0 } }, 'Stay on this page - you will join automatically')
              )
        ),
        React.createElement('div', { ref: containerRef, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } })
      )
    )
  )
}