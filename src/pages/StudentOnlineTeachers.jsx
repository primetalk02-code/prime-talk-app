import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function StudentOnlineTeachers() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
    loadTeachers()
    const interval = setInterval(loadTeachers, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadTeachers = async () => {
    try {
      const threshold = new Date(Date.now() - 30000).toISOString()
      const { data: availability } = await supabase
        .from('teacher_availability')
        .select('teacher_id')
        .gte('updated_at', threshold)

      let teacherList = []
      if (availability && availability.length > 0) {
        const ids = availability.map(r => r.teacher_id)
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url, status')
          .in('id', ids)
          .eq('role', 'teacher')
        teacherList = data || []
      }

      if (teacherList.length === 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, photo_url, status')
          .eq('role', 'teacher')
          .eq('status', 'online')
        teacherList = data || []
      }

      setTeachers(teacherList)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleJoinNow = async (teacher) => {
    if (!currentUser || requesting) return
    setRequesting(teacher.id)
    setError('')

    try {
      const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY
      const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN || 'prime-talk.daily.co'

      // 1. Create lesson row
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          teacher_id: teacher.id,
          student_id: currentUser.id,
          status: 'waiting',
          source: 'sudden',
          duration: 25,
          textbook: 'Daily Conversation',
        })
        .select('id')
        .single()

      if (lessonError) throw lessonError

      const roomName = `lesson-${lesson.id}`
      const roomUrl = `https://${DAILY_DOMAIN}/${roomName}`

      // 2. Create Daily room
      try {
        await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'private',
            properties: {
              exp: Math.floor(Date.now() / 1000) + 7200,
              enable_chat: true,
            },
          }),
        })
      } catch (e) {
        console.warn('Room creation failed, continuing:', e)
      }

      // 3. Generate student token
      let studentToken = null
      try {
        const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              user_id: currentUser.id,
              is_owner: false,
              exp: Math.floor(Date.now() / 1000) + 7200,
            },
          }),
        })
        const tokenData = await tokenRes.json()
        studentToken = tokenData.token
      } catch (e) {
        console.warn('Token creation failed:', e)
      }

      // 4. Update lesson with room info
      await supabase
        .from('lessons')
        .update({
          room_name: roomName,
          room_url: roomUrl,
          student_token: studentToken,
        })
        .eq('id', lesson.id)

      // 5. Navigate student to lesson room immediately
      navigate(`/lesson/${lesson.id}`)

    } catch (e) {
      setError(e.message)
      setRequesting(null)
    }
  }

  const isMobile = window.innerWidth < 768

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700,
          color: '#0F172A', margin: '0 0 4px 0' }}>
          ⚡ Instant Lesson
        </h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '14px' }}>
          Pick an available teacher and start learning right now
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <p>Finding available teachers...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B',
          background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😴</div>
          <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
            No teachers online right now
          </p>
          <p style={{ fontSize: '14px' }}>Check back in a few minutes</p>
          <button onClick={loadTeachers} style={{
            marginTop: '16px', background: '#0EA5A0', color: 'white',
            border: 'none', borderRadius: '8px', padding: '10px 20px',
            cursor: 'pointer', fontWeight: 600
          }}>🔄 Refresh</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {teachers.map(teacher => (
            <div key={teacher.id} style={{
              background: '#FFFFFF', borderRadius: '16px',
              border: '1px solid #E2E8F0', padding: '16px 20px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: '#0EA5A0', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '18px', flexShrink: 0
                }}>
                  {(teacher.full_name || 'T').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#0F172A', fontSize: '15px' }}>
                    {teacher.full_name || 'Teacher'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%',
                      background: '#10B981', display: 'inline-block' }} />
                    <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                      Online now
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleJoinNow(teacher)}
                disabled={!!requesting}
                style={{
                  background: requesting === teacher.id ? '#64748B' : '#0EA5A0',
                  color: 'white', border: 'none', borderRadius: '10px',
                  padding: '10px 20px', cursor: requesting ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {requesting === teacher.id ? '⏳ Connecting...' : '⚡ Join Now'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}