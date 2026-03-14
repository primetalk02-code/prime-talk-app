import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LessonRoom() {
  const params = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [status, setStatus] = useState('Loading lesson...')
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [joined, setJoined] = useState(false)

  const lessonId = params.lessonId || params.roomId ||
    params.reservationId || params.id ||
    window.location.pathname.split('/').filter(Boolean).pop()

  useEffect(() => {
    if (!lessonId || lessonId === 'lesson') {
      setError('No lesson ID found. Please go back and try again.')
      return
    }
    initLesson()
    return () => {
      if (window._dailyCall) {
        window._dailyCall.leave().catch(() => {})
        window._dailyCall.destroy().catch(() => {})
        window._dailyCall = null
      }
    }
  }, [lessonId])

  useEffect(() => {
    if (!lesson || isTeacher || joined) return
    if (lesson.status === 'active') { startVideo(); return }
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('lessons')
        .select('status, teacher_token, room_url, room_name, student_token')
        .eq('id', lessonId).single()
      if (data?.status === 'active') {
        clearInterval(poll)
        setLesson(prev => ({ ...prev, ...data }))
      } else if (data?.status === 'declined') {
        clearInterval(poll)
        setError('Teacher declined. Please go back and try again.')
      }
    }, 2000)
    return () => clearInterval(poll)
  }, [lesson, isTeacher, joined, lessonId])

  useEffect(() => {
    if (!lesson || isTeacher || joined) return
    if (lesson.status === 'active' && lesson.room_url) startVideo()
  }, [lesson?.status])

  const initLesson = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/student/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const teacher = profile?.role === 'teacher'
      setIsTeacher(teacher)
      const { data: lessonData, error: e } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()
      if (e || !lessonData) { setError('Lesson not found. ID: ' + lessonId); return }
      setLesson(lessonData)
      if (teacher || lessonData.status === 'active') {
        setStatus('Joining video room...')
      } else {
        setStatus('⏳ Waiting for teacher to accept...')
      }
    } catch (e) { setError('Error: ' + e.message) }
  }

  const startVideo = () => {
    if (joined || !lesson) return
    const domain = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
    const roomName = lesson.room_name || `lesson-${lessonId}`
    const roomUrl = lesson.room_url || `https://${domain}/${roomName}`
    const token = isTeacher ? lesson.teacher_token : lesson.student_token
    setStatus('Connecting to video...')
    if (window.DailyIframe) {
      joinRoom(roomUrl, token)
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@daily-co/daily-js'
      script.onload = () => joinRoom(roomUrl, token)
      script.onerror = () => setError('Failed to load video.')
      document.head.appendChild(script)
    }
  }

  const joinRoom = (roomUrl, token) => {
    try {
      if (!containerRef.current) return
      if (window._dailyCall) { window._dailyCall.destroy().catch(() => {}); window._dailyCall = null }
      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false, showFullscreenButton: true,
      })
      window._dailyCall = callFrame
      const opts = { url: roomUrl }
      if (token) opts.token = token
      callFrame.join(opts)
        .then(() => { setStatus(''); setJoined(true) })
        .catch(err => setError('Could not join: ' + err.message))
    } catch (e) { setError('Video error: ' + e.message) }
  }

  const handleEndLesson = async () => {
    if (window._dailyCall) {
      await window._dailyCall.leave().catch(() => {})
      await window._dailyCall.destroy().catch(() => {})
      window._dailyCall = null
    }
    await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonId)
    navigate(isTeacher ? '/teacher/dashboard' : '/student/dashboard')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0D1117',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ height: '56px', background: '#0F172A', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#0EA5A0', fontWeight: 700, fontSize: '16px' }}>🎓 Prime Talk</span>
        {lesson && (
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>
            {lesson.duration}min · {lesson.textbook}
          </span>
        )}
        <button onClick={handleEndLesson} style={{ background: '#EF4444', color: 'white',
          border: 'none', borderRadius: '8px', padding: '8px 14px',
          cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>End Lesson</button>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {(status || error) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px',
            zIndex: 10, background: '#0D1117', padding: '20px' }}>
            {error ? (
              <>
                <div style={{ fontSize: '48px' }}>❌</div>
                <p style={{ color: '#EF4444', fontSize: '15px',
                  textAlign: 'center', maxWidth: '300px', margin: 0 }}>{error}</p>
                <button onClick={() => navigate(-1)} style={{ background: '#0EA5A0',
                  color: 'white', border: 'none', borderRadius: '8px',
                  padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>← Go Back</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px' }}>{status.includes('Waiting') ? '⏳' : '📡'}</div>
                <p style={{ color: '#94A3B8', fontSize: '16px', margin: 0, textAlign: 'center' }}>
                  {status}
                </p>
                {status.includes('Waiting') && (
                  <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
                    Stay on this page — you'll join automatically
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0D1117' }} />
      </div>
    </div>
  )
}