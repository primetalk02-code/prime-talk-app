import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LessonRoom() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [status, setStatus] = useState('Loading lesson...')
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)

  useEffect(() => {
    if (!lessonId) { setError('No lesson ID'); return }
    initLesson()
    return () => {
      if (window._dailyCall) {
        window._dailyCall.leave().catch(() => {})
        window._dailyCall.destroy().catch(() => {})
        window._dailyCall = null
      }
    }
  }, [lessonId])

  // Student polls for lesson to become active
  useEffect(() => {
    if (!lesson || isTeacher) return
    if (lesson.status === 'active') return

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('lessons')
        .select('status, teacher_token, room_url, room_name')
        .eq('id', lessonId)
        .single()

      if (data?.status === 'active') {
        clearInterval(poll)
        setLesson(prev => ({ ...prev, ...data }))
        const domain = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
        const roomName = data.room_name || `lesson-${lessonId}`
        const roomUrl = data.room_url || `https://${domain}/${roomName}`
        joinRoom(roomUrl, lesson?.student_token)
      } else if (data?.status === 'declined') {
        clearInterval(poll)
        setError('Teacher declined. Please try another teacher.')
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [lesson, isTeacher, lessonId])

  const initLesson = async () => {
    try {
      setStatus('Loading lesson...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/student/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const teacher = profile?.role === 'teacher'
      setIsTeacher(teacher)

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons').select('*').eq('id', lessonId).single()

      if (lessonError || !lessonData) {
        setError('Lesson not found')
        return
      }

      setLesson(lessonData)

      const domain = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
      const roomName = lessonData.room_name || `lesson-${lessonId}`
      const roomUrl = lessonData.room_url || `https://${domain}/${roomName}`
      const token = teacher ? lessonData.teacher_token : lessonData.student_token

      if (teacher && lessonData.status === 'active') {
        // Teacher joins immediately
        setStatus('Joining video room...')
        loadDailyAndJoin(roomUrl, token)
      } else if (!teacher) {
        if (lessonData.status === 'active') {
          // Student joins if already active
          setStatus('Joining video room...')
          loadDailyAndJoin(roomUrl, token)
        } else {
          // Student waits for teacher to accept
          setStatus('⏳ Waiting for teacher to accept...')
        }
      } else {
        setStatus('Preparing lesson room...')
        loadDailyAndJoin(roomUrl, token)
      }
    } catch (e) {
      setError('Error: ' + e.message)
    }
  }

  const loadDailyAndJoin = (roomUrl, token) => {
    if (window.DailyIframe) {
      joinRoom(roomUrl, token)
    } else {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@daily-co/daily-js'
      script.onload = () => joinRoom(roomUrl, token)
      script.onerror = () => setError('Failed to load video library')
      document.head.appendChild(script)
    }
  }

  const joinRoom = (roomUrl, token) => {
    try {
      if (!containerRef.current) { setError('Video container not ready'); return }
      if (window._dailyCall) {
        window._dailyCall.leave().catch(() => {})
        window._dailyCall.destroy().catch(() => {})
        window._dailyCall = null
      }
      setStatus('Connecting to video...')
      const callFrame = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: { width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false,
        showFullscreenButton: true,
      })
      window._dailyCall = callFrame
      const joinOptions = { url: roomUrl }
      if (token) joinOptions.token = token
      callFrame.join(joinOptions)
        .then(() => setStatus(''))
        .catch(err => setError('Failed to join: ' + err.message))
    } catch (e) {
      setError('Video error: ' + e.message)
    }
  }

  const handleEndLesson = async () => {
    if (window._dailyCall) {
      await window._dailyCall.leave().catch(() => {})
      await window._dailyCall.destroy().catch(() => {})
      window._dailyCall = null
    }
    await supabase.from('lessons')
      .update({ status: 'finished' }).eq('id', lessonId)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    navigate(profile?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0D1117',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        height: '56px', background: '#0F172A', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ color: '#0EA5A0', fontWeight: 700, fontSize: '16px' }}>
          🎓 Prime Talk
        </span>
        {lesson && (
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>
            {lesson.duration} min · {lesson.textbook}
          </span>
        )}
        <button onClick={handleEndLesson} style={{
          background: '#EF4444', color: 'white', border: 'none',
          borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
          fontWeight: 600, fontSize: '13px'
        }}>End Lesson</button>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {(status || error) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '16px', zIndex: 10,
            background: '#0D1117'
          }}>
            {error ? (
              <>
                <div style={{ fontSize: '48px' }}>❌</div>
                <p style={{ color: '#EF4444', fontSize: '16px',
                  textAlign: 'center', maxWidth: '320px', padding: '0 16px', margin: 0 }}>
                  {error}
                </p>
                <button onClick={() => navigate(-1)} style={{
                  background: '#0EA5A0', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '10px 24px', cursor: 'pointer',
                  fontWeight: 600
                }}>← Go Back</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px' }}>
                  {status.includes('Waiting') ? '⏳' : '📡'}
                </div>
                <p style={{ color: '#94A3B8', fontSize: '16px', margin: 0, textAlign: 'center' }}>
                  {status}
                </p>
                {status.includes('Waiting') && (
                  <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
                    Teacher will accept shortly...
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div ref={containerRef} style={{
          width: '100%', height: '100%', background: '#0D1117'
        }} />
      </div>
    </div>
  )
}