import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function IncomingLessonAlert({ lesson, onAccept }) {
  const [studentName, setStudentName] = useState('Student')
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (!lesson?.student_id) return
    supabase.from('profiles').select('full_name')
      .eq('id', lesson.student_id).single()
      .then(({ data }) => { if (data?.full_name) setStudentName(data.full_name) })
  }, [lesson])

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [seconds])

  useEffect(() => {
    try {
      const audio = new Audio('/sounds/incoming.wav')
      audio.loop = true
      audio.play().catch(() => {})
      return () => { audio.pause(); audio.currentTime = 0 }
    } catch (e) {}
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px',
        maxWidth: '400px', width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: '56px', marginBottom: '12px' }}>📲</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Incoming Student!
        </h2>
        <p style={{ color: '#64748B', margin: '0 0 16px 0', fontSize: '15px' }}>
          <strong style={{ color: '#0F172A' }}>{studentName}</strong> wants a lesson
        </p>
        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px',
          marginBottom: '16px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#64748B', fontSize: '13px' }}>📚 Textbook</span>
            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
              {lesson?.textbook || 'Daily Conversation'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B', fontSize: '13px' }}>⏱ Duration</span>
            <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
              {lesson?.duration || 25} min
            </span>
          </div>
          {lesson?.goal && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
              <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '12px' }}>🎯 Goal:</p>
              <p style={{ margin: 0, color: '#0F172A', fontSize: '13px', fontStyle: 'italic' }}>
                "{lesson.goal}"
              </p>
            </div>
          )}
        </div>
        <div style={{ background: seconds <= 10 ? '#FEF2F2' : '#F0FDFC',
          borderRadius: '10px', padding: '10px', marginBottom: '16px' }}>
          <p style={{ color: seconds <= 10 ? '#EF4444' : '#0EA5A0',
            fontWeight: 700, fontSize: '20px', margin: 0 }}>⏰ {seconds}s</p>
        </div>
        <button onClick={onAccept} style={{ width: '100%', background: '#0EA5A0',
          color: 'white', border: 'none', borderRadius: '12px', padding: '14px',
          fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>
          ✅ Accept & Join
        </button>
        <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
          Auto-declines if not accepted in time
        </p>
      </div>
    </div>
  )
}