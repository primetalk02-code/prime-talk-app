import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LessonRoom() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const pollRef = useRef(null)
  const isTeacherRef = useRef(false)
  const lessonIdRef = useRef(lessonId)

  const [lesson, setLesson] = useState(null)
  const [status, setStatus] = useState('Loading lesson...')
  const [error, setError] = useState('')
  const [roomUrl, setRoomUrl] = useState('')

  const endLesson = async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    try { await supabase.from('lessons').update({ status: 'finished' }).eq('id', lessonIdRef.current) } catch (e) {}
    navigate(isTeacherRef.current ? '/teacher/dashboard' : '/student/dashboard')
  }

  const pollForActive = (id) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('lessons').select('status, room_name').eq('id', id).single()
      if (!data) return
      if (data.status === 'active') {
        clearInterval(pollRef.current)
        pollRef.current = null
        const url = 'https://whereby.com/primetalk-' + (data.room_name || id)
        setRoomUrl(url)
        setStatus('')
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
        const url = 'https://whereby.com/primetalk-' + (ld.room_name || lessonId)
        if (teacher || ld.status === 'active') {
          setRoomUrl(url)
          setStatus('')
        } else {
          setStatus('Waiting for teacher to accept...')
          pollForActive(lessonId)
        }
      } catch (e) { setError('Error: ' + e.message) }
    }
    init()
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [lessonId])

  return (
    React.createElement('div', { style: { width: '100vw', height: '100vh', background: '#0D1117', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'system-ui, sans-serif' } },
      React.createElement('div', { style: { height: '56px', flexShrink: 0, background: '#0F172A', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' } },
        React.createElement('span', { style: { color: '#0EA5A0', fontWeight: 700, fontSize: '16px' } }, 'Prime Talk'),
        lesson && React.createElement('span', { style: { color: '#94A3B8', fontSize: '12px' } }, (lesson.duration ? lesson.duration + ' min' : '') + (lesson.duration && lesson.textbook ? ' - ' : '') + (lesson.textbook || '')),
        React.createElement('button', { onClick: endLesson, style: { background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' } }, 'End Lesson')
      ),
      roomUrl
        ? React.createElement('iframe', {
            src: roomUrl + '?skipMediaPermissionPrompt&background=off',
            allow: 'camera; microphone; fullscreen; speaker; display-capture',
            style: { flex: 1, border: 'none', width: '100%' }
          })
        : React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' } },
            error
              ? React.createElement(React.Fragment, null,
                  React.createElement('p', { style: { color: '#EF4444', fontSize: '15px', textAlign: 'center', maxWidth: '360px', margin: 0 } }, error),
                  React.createElement('button', { onClick: () => navigate(-1), style: { background: '#0EA5A0', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 } }, 'Go Back')
                )
              : React.createElement(React.Fragment, null,
                  React.createElement('p', { style: { color: '#94A3B8', fontSize: '16px', margin: 0, textAlign: 'center' } }, status),
                  status.includes('Waiting') && React.createElement('p', { style: { color: '#475569', fontSize: '13px', margin: 0 } }, 'Stay on this page - you will join automatically')
                )
          )
    )
  )
}
