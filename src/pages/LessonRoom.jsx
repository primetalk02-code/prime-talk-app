import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function stopGlobalAudio() {
  if (window._lessonAudio) {
    window._lessonAudio.pause()
    window._lessonAudio.currentTime = 0
    window._lessonAudio = null
  }
}

async function destroyDailyCall() {
  if (window._dailyCall) {
    try { await window._dailyCall.leave() } catch (e) {}
    try { await window._dailyCall.destroy() } catch (e) {}
    window._dailyCall = null
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
    await destroyDailyCall()
    try { await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonIdRef.current) } catch (e) {}
    navigate(isTeacherRef.current ? '/teacher/dashboard' : '/student/dashboard')
  }

  const joinRoom = (roomUrl, token) => {
    if (!containerRef.current) { setError('Video container not ready. Refresh the page.'); return }
    destroyDailyCall()
    try {
      const frame = window.DailyIframe.createFrame(containerRef.current, {
        iframeStyle: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
        showLeaveButton: false,
        showFullscreenButton: true,
      })
      window._dailyCall = frame
      frame.on('joined-meeting', () => { setStatus(''); setJoined(true) })
      frame.on('error', (e) => setError('Video error: ' + (e && e.errorMsg ? e.errorMsg : 'unknown')))
      frame.on('left-meeting', () => endLesson())
      const opts = { url: roomUrl }
      if (token) opts.token = token
      frame.join(opts).catch((e) => setError('Could not join: ' + e.message))
    } catch (e) { setError('Video setup error: ' + e.message) }
  }

  const connectVideo = (roomUrl, token) => {
    setStatus('Connecting to video...')
    const loadScript = () => {
      if (window.DailyIframe) { tryMount(0); return }
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/@daily-co/daily-js'
      s.async = true
      s.onload = () => tryMount(0)
      s.onerror = () => setError('Failed to load video library. Check your connection.')
      document.head.appendChild(s)
    }
    const tryMount = (n) => {
      if (!containerRef.current) {
        if (n < 20) { setTimeout(() => tryMount(n + 1), 300) }
        else { setError('Video container not ready. Refresh the page.') }
        return
      }
      joinRoom(roomUrl, token)
    }
    loadScript()
  }

  const pollForActive = (id) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('lessons')
        .select('status, room_url, room_name, student_token')
        .eq('id', id).single()
      if (!data) return
      if (data.status === 'active') {
        clearInterval(pollRef.current)
        pollRef.current = null
        const domain = (import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co').trim()
        const rn = data.room_name || ('lesson-' + id)
        const ru = data.room_url || ('https://' + domain + '/' + rn)
        connectVideo(ru, data.student_token)
      } else if (data.status === 'declined') {
        clearInterval(pollRef.current)
        pollRef.current = null
        setError('Teacher declined. Please go back and try again.')
      }
    }, 2000)
  }

  useEffect(() => {
    if (!lessonId || lessonId === 'undefined') {
      setError('No lesson ID found. Please go back and try again.')
      return
    }
    lessonIdRef.current = lessonId
    stopGlobalAudio()
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/student/login'); return }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const teacher = profile && profile.role === 'teacher'
        isTeacherRef.current = teacher
        const { data: ld, error: fe } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
        if (fe || !ld) { setError('Lesson not found. ID: ' + lessonId); return }
        setLesson(ld)
        const domain = (import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co').trim()
        const rn = ld.room_name || ('lesson-' + lessonId)
        const ru = ld.room_url || ('https://' + domain + '/' + rn)
        if (teacher) {
          connectVideo(ru, ld.teacher_token)
        } else if (ld.status === 'active') {
          connectVideo(ru, ld.student_token)
        } else {
          setStatus('Waiting for teacher to accept...')
          pollForActive(lessonId)
        }
      } catch (e) { setError('Error: ' + e.message) }
    }
    init()
    return () => {
      stopGlobalAudio()
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      destroyDailyCall()
    }
  }, [lessonId])

  return (
    React.createElement('div', { style: { width: '100vw', height: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' } },
      React.createElement('div', { style: { height: '56px', flexShrink: 0, background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' } },
        React.createElement('span', { style: { color: '#0EA5A0', fontWeight: 700, fontSize: '16px' } }, 'Prime Talk'),
        lesson && React.createElement('span', { style: { color: '#94A3B8', fontSize: '12px' } }, (lesson.duration || '') + (lesson.duration && lesson.textbook ? ' min - ' : '') + (lesson.textbook || '')),
        React.createElement('button', { onClick: endLesson, style: { background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' } }, 'End Lesson')
      ),
      React.createElement('div', { style: { flex: 1, position: 'relative', overflow: 'hidden', background: '#0D1117' } },
        !joined && (status || error) && React.createElement('div', { style: { position: 'absolute', inset: 0, zIndex: 5, background: '#0D1117', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' } },
          error
            ? React.createElement(React.Fragment, null,
                React.createElement('div', { style: { fontSize: '48px' } }, 'X'),
                React.createElement('p', { style: { color: '#EF4444', fontSize: '15px', textAlign: 'center', maxWidth: '360px', margin: 0 } }, error),
                React.createElement('button', { onClick: () => navigate(-1), style: { background: '#0EA5A0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 } }, 'Go Back')
              )
            : React.createElement(React.Fragment, null,
                React.createElement('div', { style: { fontSize: '48px' } }, status.includes('Waiting') ? '...' : '...'),
                React.createElement('p', { style: { color: '#94A3B8', fontSize: '16px', margin: 0, textAlign: 'center' } }, status),
                status.includes('Waiting') && React.createElement('p', { style: { color: '#475569', fontSize: '13px', margin: 0 } }, 'Stay on this page - you will join automatically when the teacher accepts')
              )
        ),
        React.createElement('div', { ref: containerRef, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } })
      )
    )
  )
}


