import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function StudentOnlineTeachers() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [teachers, setTeachers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [lessonId, setLessonId] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [textbook, setTextbook] = useState('Daily Conversation')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(25)

  const textbooks = [
    'Daily Conversation','Business English','Grammar Focus',
    'IELTS Preparation','Travel English','Academic Writing',
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
    loadTeachers()
  }, [])

  useEffect(() => {
    if (step !== 'waiting' || !lessonId) return
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('lessons').select('status').eq('id', lessonId).single()
      if (data?.status === 'active') {
        clearInterval(poll)
        navigate(`/lesson/${lessonId}`)
      } else if (data?.status === 'declined') {
        clearInterval(poll)
        setError('Teacher declined. Please try again.')
        setStep('form')
        setLessonId(null)
      }
    }, 2000)
    return () => clearInterval(poll)
  }, [step, lessonId, navigate])

  const loadTeachers = async () => {
    try {
      const threshold = new Date(Date.now() - 30000).toISOString()
      const { data: availability } = await supabase
        .from('teacher_availability').select('teacher_id').gte('updated_at', threshold)
      let list = []
      if (availability?.length > 0) {
        const ids = availability.map(r => r.teacher_id)
        const { data } = await supabase
          .from('profiles').select('id, full_name').in('id', ids).eq('role', 'teacher')
        list = data || []
      }
      if (list.length === 0) {
        const { data } = await supabase
          .from('profiles').select('id, full_name')
          .eq('role', 'teacher').eq('status', 'online')
        list = data || []
      }
      setTeachers(list)
    } catch (e) { console.error(e) }
  }

  const handleFindTeacher = async () => {
    if (!currentUser || submitting) return
    if (teachers.length === 0) { setError('No teachers available right now.'); return }
    setSubmitting(true)
    setError('')
    try {
      const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY
      const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'
      const teacher = teachers[0]
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          teacher_id: teacher.id, student_id: currentUser.id,
          status: 'waiting', source: 'sudden',
          duration, textbook, goal,
        })
        .select('id').single()
      if (lessonError) throw lessonError
      const roomName = `lesson-${lesson.id}`
      const roomUrl = `https://${DAILY_DOMAIN}/${roomName}`
      try {
        await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DAILY_API_KEY}` },
          body: JSON.stringify({ name: roomName, privacy: 'private',
            properties: { exp: Math.floor(Date.now() / 1000) + 7200 } }),
        })
      } catch (e) { console.warn('Room:', e) }
      let studentToken = null
      try {
        const res = await fetch('https://api.daily.co/v1/meeting-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DAILY_API_KEY}` },
          body: JSON.stringify({ properties: {
            room_name: roomName, user_id: currentUser.id,
            is_owner: false, exp: Math.floor(Date.now() / 1000) + 7200,
          }}),
        })
        const d = await res.json()
        studentToken = d.token
      } catch (e) { console.warn('Token:', e) }
      await supabase.from('lessons')
        .update({ room_name: roomName, room_url: roomUrl, student_token: studentToken })
        .eq('id', lesson.id)
      setLessonId(lesson.id)
      setStep('waiting')
    } catch (e) { setError(e.message) }
    setSubmitting(false)
  }

  const isMobile = window.innerWidth < 768

  if (step === 'waiting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '70vh', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0' }}>
            Waiting for teacher...
          </h2>
          <p style={{ color: '#64748B', margin: '0 0 24px 0', fontSize: '14px' }}>
            Stay on this page. You'll join automatically when teacher accepts.
          </p>
          <div style={{ background: '#F0FDFC', borderRadius: '12px', padding: '16px',
            marginBottom: '24px', border: '1px solid #99F6E4' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#0F172A', fontSize: '14px' }}>
              📚 {textbook}
            </p>
            <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '13px' }}>⏱ {duration} minutes</p>
            {goal && <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>🎯 {goal}</p>}
          </div>
          <button onClick={() => { setStep('form'); setLessonId(null) }}
            style={{ background: 'none', border: '1px solid #E2E8F0', borderRadius: '8px',
              padding: '10px 20px', cursor: 'pointer', color: '#64748B', fontSize: '14px' }}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', maxWidth: '560px' }}>
      <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700,
        color: '#0F172A', margin: '0 0 4px 0' }}>⚡ Start Instant Lesson</h1>
      <p style={{ color: '#64748B', margin: '0 0 24px 0', fontSize: '14px' }}>
        Set your preferences and we'll match you with an available teacher instantly.
      </p>
      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
      )}
      <div style={{ background: teachers.length > 0 ? '#F0FDFC' : '#FFF7ED',
        border: `1px solid ${teachers.length > 0 ? '#99F6E4' : '#FED7AA'}`,
        borderRadius: '12px', padding: '12px 16px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>{teachers.length > 0 ? '🟢' : '🟡'}</span>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px',
            color: teachers.length > 0 ? '#065F46' : '#92400E' }}>
            {teachers.length > 0 ? `${teachers.length} teacher${teachers.length > 1 ? 's' : ''} available now` : 'No teachers online right now'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: teachers.length > 0 ? '#10B981' : '#F59E0B' }}>
            {teachers.length > 0 ? 'Ready to start immediately' : 'Check back in a few minutes'}
          </p>
        </div>
        <button onClick={loadTeachers} style={{ marginLeft: 'auto', background: 'none',
          border: 'none', cursor: 'pointer', fontSize: '18px' }}>🔄</button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#0F172A',
          fontSize: '14px', marginBottom: '8px' }}>⏱ Lesson Duration</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[5, 10, 25].map(d => (
            <button key={d} onClick={() => setDuration(d)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px',
              background: duration === d ? '#0EA5A0' : '#F8FAFC',
              color: duration === d ? 'white' : '#475569',
              border: `2px solid ${duration === d ? '#0EA5A0' : '#E2E8F0'}`,
            }}>{d} min</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#0F172A',
          fontSize: '14px', marginBottom: '8px' }}>📚 Textbook</label>
        <select value={textbook} onChange={e => setTextbook(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '10px',
            border: '2px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
            background: 'white', cursor: 'pointer' }}>
          {textbooks.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontWeight: 600, color: '#0F172A',
          fontSize: '14px', marginBottom: '8px' }}>
          🎯 Lesson Goal <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea value={goal} onChange={e => setGoal(e.target.value)}
          placeholder="e.g. I want to practice ordering food at a restaurant..."
          rows={3} style={{ width: '100%', padding: '12px', borderRadius: '10px',
            border: '2px solid #E2E8F0', fontSize: '14px', color: '#0F172A',
            resize: 'none', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }} />
      </div>
      <button onClick={handleFindTeacher} disabled={submitting || teachers.length === 0}
        style={{ width: '100%', padding: '14px', borderRadius: '12px',
          background: submitting || teachers.length === 0 ? '#94A3B8' : '#0EA5A0',
          color: 'white', border: 'none',
          cursor: submitting || teachers.length === 0 ? 'not-allowed' : 'pointer',
          fontSize: '16px', fontWeight: 700 }}>
        {submitting ? '⏳ Finding teacher...' : '⚡ Start Now'}
      </button>
    </div>
  )
}