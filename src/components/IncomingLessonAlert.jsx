import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function IncomingLessonAlert({ lesson, onAccept }) {
  const [studentName, setStudentName] = useState('Student')
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (!lesson?.student_id) return
    supabase.from('profiles')
      .select('full_name')
      .eq('id', lesson.student_id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setStudentName(data.full_name)
      })
  }, [lesson])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])

  // Play alarm sound
  useEffect(() => {
    try {
      const audio = new Audio('/sounds/incoming.wav')
      audio.loop = true
      audio.play().catch(() => {})
      return () => { audio.pause(); audio.currentTime = 0 }
    } catch (e) {}
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '20px', padding: '32px',
        maxWidth: '380px', width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: 'pulse 1s infinite'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>📲</div>

        <h2 style={{ fontSize: '20px', fontWeight: 700,
          color: '#0F172A', margin: '0 0 8px 0' }}>
          Incoming Student!
        </h2>

        <p style={{ color: '#64748B', margin: '0 0 6px 0', fontSize: '15px' }}>
          <strong style={{ color: '#0F172A' }}>{studentName}</strong> wants a lesson
        </p>

        {lesson?.duration && (
          <p style={{ color: '#0EA5A0', fontWeight: 600,
            fontSize: '14px', margin: '0 0 4px 0' }}>
            ⏱ {lesson.duration} min · {lesson.textbook || 'Daily Conversation'}
          </p>
        )}

        <div style={{
          background: seconds <= 10 ? '#FEF2F2' : '#F0FDFC',
          borderRadius: '10px', padding: '10px', margin: '16px 0',
        }}>
          <p style={{
            color: seconds <= 10 ? '#EF4444' : '#0EA5A0',
            fontWeight: 700, fontSize: '18px', margin: 0
          }}>
            {seconds}s remaining
          </p>
        </div>

        <button onClick={onAccept} style={{
          width: '100%', background: '#0EA5A0', color: 'white',
          border: 'none', borderRadius: '12px', padding: '14px',
          fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(14,165,160,0.4)'
        }}>
          ✅ Accept & Join
        </button>

        <p style={{ color: '#94A3B8', fontSize: '12px', marginTop: '12px', marginBottom: 0 }}>
          Auto-declines if not accepted in time
        </p>
      </div>
    </div>
  )
}