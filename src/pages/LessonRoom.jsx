import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// ─── helpers ──────────────────────────────────────────────────────────────────

function stopGlobalAudio() {
  if (window._lessonAudio) {
    window._lessonAudio.pause()
    window._lessonAudio.currentTime = 0
    window._lessonAudio = null
  }
}

async function destroyDailyCall() {
  if (window._dailyCall) {
    try { await window._dailyCall.leave() } catch (_) {}
    try { await window._dailyCall.destroy() } catch (_) {}
    window._dailyCall = null
  }
}

function loadDailyScript(onReady) {
  if (window.DailyIframe) { onReady(); return }
  const existing = document.querySelector('script[src*="daily-js"]')
  if (existing) { existing.addEventListener('load', onReady); return }
  const s = document.createElement('script')
  s.src = 'https://unpkg.com/@daily-co/daily-js'
  s.async = true
  s.onload = onReady
  s.onerror = () => { throw new Error('Failed to load Daily.co video library') }
  document.head.appendChild(s)
}

// ─── component ────────────────────────────────────────────────────────────────

export default function LessonRoom() {
  // App.jsx uses /lesson/:roomId  ← the param is called roomId, not lessonId
  const { roomId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const pollRef = useRef(null)

  const [lesson, setLesson] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [status, setStatus] = useState('Loading lesson…')
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)

  // Derive the actual lesson UUID from the URL
  // Route is /lesson/:roomId — roomId IS the lesson id
  const lessonId = roomId

  // ── join Daily room ──────────────────────────────────────────────────────────
  const joinRoom = useCallback((roomUrl, token) => {
    if (!containerRef.current) {
      setError('Video container not ready. Please refresh.')
      return
    }

    // Kill any existing call first
    destroyDailyCall()

    try {
      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: {
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          border: 'none',
        },
        showLeaveButton: false,
        showFullscreenButton: true,
      })

      window._dailyCall = callFrame

      callFrame.on('joined-meeting', () => {
        setStatus('')
        setJoined(true)
      })

      callFrame.on('error', (e) => {
        setError('Video error: ' + (e?.errorMsg || JSON.stringify(e) || 'Unknown'))
      })

      callFrame.on('left-meeting', () => {
        handleEndLesson()
      })

      const joinOpts = { url: roomUrl }
      if (token) joinOpts.token = token

      callFrame.join(joinOpts).catch((err) => {
        setError('Could not join video room: ' + err.message)
      })
    } catch (e) {
      setError('Video setup error: ' + e.message)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── load Daily.js then join ──────────────────────────────────────────────────
  const connectVideo = useCallback((roomUrl, token) => {
    setStatus('Connecting to video…')

    const tryMount = (attempts = 0) => {
      if (!containerRef.current) {
        if (attempts < 15) { setTimeout(() => tryMount(attempts + 1), 300) }
        else { setError('Video container not ready. Please refresh.') }
        return
      }
      joinRoom(roomUrl, token)
    }

    loadDailyScript(() => tryMount())
  }, [joinRoom])

  // ── poll Supabase until lesson becomes active ───────────────────────────────
  const pollForActive = useCallback((currentLessonId) => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('lessons')
        .select('status, room_url, room_name, student_token, teacher_token')
        .eq('id', currentLessonId)
        .single()

      if (!data) return

      if (data.status === 'active') {
        clearInterval(pollRef.current)
        pollRef.current = null

        const domain = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
        const roomName = data.room_name || `lesson-${currentLessonId}`
        const roomUrl  = data.room_url  || `https://${domain}/${roomName}`
        const token    = data.student_token

        setLesson(prev => ({ ...prev, ...data }))
        connectVideo(roomUrl, token)

      } else if (data.status === 'declined') {
        clearInterval(pollRef.current)
        pollRef.current = null
        setError('Teacher declined the lesson. Please go back and try again.')
      }
    }, 2000)
  }, [connectVideo])

  // ── end lesson ───────────────────────────────────────────────────────────────
  const handleEndLesson = useCallback(async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    await destroyDailyCall()
    try {
      await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonId)
    } catch (_) {}
    navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard')
  }, [lessonId, isTeacher, navigate])

  // ── init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId || lessonId === 'undefined') {
      setError('No lesson ID found. Please go back and try again.')
      return
    }

    stopGlobalAudio()

    const init = async () => {
      try {
        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/student/login'); return }

        // 2. Role check
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        const teacher = profile?.role === 'teacher'
        setIsTeacher(teacher)

        // 3. Load lesson
        const { data: lessonData, error: fetchErr } = await supabase
          .from('lessons').select('*').eq('id', lessonId).single()

        if (fetchErr || !lessonData) {
          setError('Lesson not found. (ID: ' + lessonId + ')')
          return
        }
        setLesson(lessonData)

        // 4. Decide what to do based on role + lesson status
        const domain   = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
        const roomName = lessonData.room_name || `lesson-${lessonId}`
        const roomUrl  = lessonData.room_url  || `https://${domain}/${roomName}`

        if (teacher) {
          // Teacher: always connect immediately with teacher_token
          const token = lessonData.teacher_token
          connectVideo(roomUrl, token)
        } else {
          // Student: connect if already active, otherwise poll
          if (lessonData.status === 'active') {
            connectVideo(roomUrl, lessonData.student_token)
          } else {
            setStatus('⏳ Waiting for teacher to accept…')
            pollForActive(lessonId)
          }
        }
      } catch (e) {
        setError('Error loading lesson: ' + e.message)
      }
    }

    init()

    return () => {
      stopGlobalAudio()
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      destroyDailyCall()
    }
  }, [lessonId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0D1117',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* ── Header ── */}
      <div style={{
        height: '56px', flexShrink: 0,
        background: '#0F172A',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px', zIndex: 10,
      }}>
        <span style={{ color: '#0EA5A0', fontWeight: 700, fontSize: '16px' }}>
          🎓 Prime Talk
        </span>

        {lesson && (
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>
            {lesson.duration ? `${lesson.duration} min` : ''}
            {lesson.duration && lesson.textbook ? ' · ' : ''}
            {lesson.textbook || ''}
          </span>
        )}

        <button
          onClick={handleEndLesson}
          style={{
            background: '#EF4444', color: 'white', border: 'none',
            borderRadius: '8px', padding: '8px 14px',
            cursor: 'pointer', fontWeight: 600, fontSize: '13px',
          }}
        >
          End Lesson
        </button>
      </div>

      {/* ── Video area ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0D1117' }}>

        {/* Status / error overlay — hidden once joined */}
        {!joined && (status || error) && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            background: '#0D1117',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '16px', padding: '20px',
          }}>
            {error ? (
              <>
                <div style={{ fontSize: '48px' }}>❌</div>
                <p style={{
                  color: '#EF4444', fontSize: '15px',
                  textAlign: 'center', maxWidth: '360px', margin: 0,
                }}>
                  {error}
                </p>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: '#0EA5A0', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '10px 24px',
                    cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  ← Go Back
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px' }}>
                  {status.includes('Waiting') ? '⏳' : '📡'}
                </div>
                <p style={{
                  color: '#94A3B8', fontSize: '16px',
                  margin: 0, textAlign: 'center',
                }}>
                  {status}
                </p>
                {status.includes('Waiting') && (
                  <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
                    Stay on this page — you'll join automatically when the teacher accepts
                  </p>
                )}
                {/* Animated spinner */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '3px solid rgba(14,165,160,0.2)',
                  borderTop: '3px solid #0EA5A0',
                  animation: 'spin 1s linear infinite',
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </>
            )}
          </div>
        )}

        {/* Daily.co iframe mounts here */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
          }}
        />
      </div>
    </div>
  )
}