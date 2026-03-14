import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabaseClient'
import { startTeacherPresence, stopTeacherPresence } from '../lib/presence'
import IncomingLessonAlert from '../components/IncomingLessonAlert'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showIncoming, setShowIncoming] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [incomingLesson, setIncomingLesson] = useState(null)
  const [upcomingWarning, setUpcomingWarning] = useState(null)
  const alertAudioRef = useRef(null)

  const stopAlertSound = () => {
    if (alertAudioRef.current) {
      alertAudioRef.current.pause()
      alertAudioRef.current.currentTime = 0
      alertAudioRef.current = null
    }
  }

  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('status').eq('id', user.id).maybeSingle()
      const online = profile && profile.status === 'online'
      setIsOnline(online)
      if (online) await startTeacherPresence(user.id)
    }
    loadStatus()
  }, [])

  useEffect(() => {
    let channel
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase.channel('teacher-lesson-alerts')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lessons', filter: 'teacher_id=eq.' + user.id },
          async (payload) => {
            const lesson = payload.new
            if (lesson.source !== 'sudden') return
            const { data: fullLesson } = await supabase.from('lessons').select('*').eq('id', lesson.id).single()
            setIncomingLesson(fullLesson || lesson)
            setShowIncoming(true)
            stopAlertSound()
            try {
              const a = new Audio('/sounds/incoming.wav')
              a.loop = true
              alertAudioRef.current = a
              a.play().catch(() => {
                try {
                  const a2 = new Audio('/sounds/lesson-alert.wav')
                  a2.loop = true
                  alertAudioRef.current = a2
                  a2.play().catch(() => {})
                } catch (e) {}
              })
            } catch (e) {}
          })
        .subscribe()
    }
    setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const now = new Date()
      const in5 = new Date(now.getTime() + 5 * 60 * 1000)
      const { data } = await supabase.from('lessons').select('id, scheduled_time, textbook, status')
        .eq('teacher_id', user.id).eq('status', 'active')
        .gte('scheduled_time', now.toTimeString().slice(0,5))
        .lte('scheduled_time', in5.toTimeString().slice(0,5)).limit(1)
      if (data && data.length > 0) setUpcomingWarning(data[0])
    }
    check()
    const iv = setInterval(check, 60000)
    return () => clearInterval(iv)
  }, [])

  const handleToggleOnline = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const next = !isOnline
    await supabase.from('profiles').update({ status: next ? 'online' : 'offline' }).eq('id', user.id)
    if (next) { await startTeacherPresence(user.id) } else { await stopTeacherPresence(user.id) }
    setIsOnline(next)
  }

  const handleAcceptLesson = async () => {
    if (!incomingLesson) return
    stopAlertSound()
    setShowIncoming(false)
    try {
      await supabase.from('lessons').update({ status: 'active' }).eq('id', incomingLesson.id)
      window.location.href = '/lesson/' + incomingLesson.id
    } catch (e) {
      console.error('Accept failed:', e)
    }
  }

  const teacherName = (user && user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : 'Teacher'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    React.createElement('div', null,
      React.createElement('div', { style: { borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0EA5A0, #0C8F8A)', boxShadow: '0 4px 20px rgba(14,165,160,0.3)' } },
        React.createElement('div', null,
          React.createElement('h2', { style: { fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '6px' } }, greeting + ', ' + teacherName.split(' ')[0] + ' !'),
          React.createElement('p', { style: { color: 'rgba(255,255,255,0.85)', fontSize: '14px' } }, 'Go online to start accepting students')
        ),
        React.createElement('button', { onClick: handleToggleOnline, style: { background: 'white', border: 'none', color: isOnline ? '#22C55E' : '#0EA5A0', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.3)' : 'none' } },
          isOnline ? 'Online' : 'Go Online'
        )
      ),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' } },
        [
          { emoji: '$', label: 'This Month', value: '', sub: 'No earnings yet', bg: '#FEF3C7' },
          { emoji: 'Cal', label: 'Lessons Today', value: '0', sub: 'No lessons today', bg: '#CCFBF1' },
          { emoji: 'Stu', label: 'Total Students', value: '0', sub: 'No students yet', bg: '#EDE9FE' },
          { emoji: '*', label: 'Rating', value: '--', sub: 'No reviews yet', bg: '#FEF3C7' },
        ].map(function(s) {
          return React.createElement('div', { key: s.label, style: { background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } },
              React.createElement('div', { style: { width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 } }, s.emoji),
              React.createElement('span', { style: { fontSize: '13px', color: '#64748B' } }, s.label)
            ),
            React.createElement('div', { style: { fontSize: '28px', fontWeight: 800, color: '#0F172A' } }, s.value),
            React.createElement('div', { style: { fontSize: '12px', color: '#94A3B8', marginTop: '4px' } }, s.sub)
          )
        })
      ),
      upcomingWarning && React.createElement('div', { style: { background: 'linear-gradient(135deg, #F59E0B, #D97706)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' } },
        React.createElement('div', null,
          React.createElement('p', { style: { fontWeight: 700, fontSize: '16px', margin: 0 } }, 'Lesson starting in 5 minutes!'),
          React.createElement('p', { style: { fontSize: '13px', margin: '4px 0 0', opacity: 0.9 } }, (upcomingWarning.textbook || 'English Lesson') + ' at ' + upcomingWarning.scheduled_time)
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          React.createElement('button', { onClick: function() { window.location.href = '/lesson/' + upcomingWarning.id }, style: { background: 'white', color: '#D97706', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, 'Join Now'),
          React.createElement('button', { onClick: function() { setUpcomingWarning(null) }, style: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' } }, 'X')
        )
      ),
      showIncoming && incomingLesson && React.createElement(IncomingLessonAlert, { lesson: incomingLesson, onAccept: handleAcceptLesson })
    )
  )
}
