import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabaseClient'
import { acceptLesson } from '../api/lessons/acceptLesson'
import { startTeacherPresence, stopTeacherPresence } from '../lib/presence'
import { createDailyToken } from '../lib/daily'
import IncomingLessonAlert from '../components/IncomingLessonAlert'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showIncoming, setShowIncoming] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [incomingLesson, setIncomingLesson] = useState(null)

  // Load current online status from Supabase on mount
  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .maybeSingle()
      const online = profile?.status === 'online'
      setIsOnline(online)
      // Resume heartbeat if was online
      if (online) await startTeacherPresence(user.id)
    }
    loadStatus()
  }, [])

  useEffect(() => {
    let channel
    const setupRealtimeAlerts = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      channel = supabase
        .channel('teacher-reservations')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'lessons',
          filter: `teacher_id=eq.${user.id}`
        }, async (payload) => {
          const lesson = payload.new
          // Only trigger alert for sudden lessons
          if (lesson.source !== 'sudden') return
          // Get student name
          let studentName = 'Student'
          let preference = lesson.textbook || 'General Conversation'
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', lesson.student_id)
              .single()
            studentName = profile?.full_name || profile?.email?.split('@')[0] || 'Student'
          } catch {}
          setIncomingLesson({ 
            id: lesson.id, 
            studentName, 
            preference,
            duration: lesson.duration || 25,
            subject: lesson.textbook || 'English Lesson'
          })
          setShowIncoming(true)
          // Play sound
          try {
            const audio = new Audio('/sounds/incoming.wav')
            audio.play().catch(() => {})
          } catch {}
        })
        .subscribe()
    }
    setupRealtimeAlerts()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const handleToggleOnline = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newStatus = isOnline ? 'offline' : 'online'
    // Update profiles table
    await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', user.id)
    if (!isOnline) {
      // Going online — start heartbeat
      await startTeacherPresence(user.id)
    } else {
      // Going offline — stop heartbeat
      await stopTeacherPresence(user.id)
    }
    setIsOnline(!isOnline)
  }

  const teacherName = user?.user_metadata?.full_name || 'Teacher'
  const getHour = () => new Date().getHours()
  const greeting = getHour()<12?'Good morning':getHour()<17?'Good afternoon':'Good evening'

  const [upcomingWarning, setUpcomingWarning] = useState(null)

  useEffect(() => {
    const checkUpcoming = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const now = new Date()
      const in5min = new Date(now.getTime() + 5 * 60 * 1000)
      const nowTime = now.toTimeString().slice(0,5)
      const in5Time = in5min.toTimeString().slice(0,5)
      const today = now.toISOString().slice(0,10)
      const { data } = await supabase
        .from('lessons')
        .select('id, scheduled_time, textbook, status')
        .eq('teacher_id', user.id)
        .eq('status', 'active')
        .gte('scheduled_time', nowTime)
        .lte('scheduled_time', in5Time)
        .limit(1)
      if (data && data.length > 0) {
        setUpcomingWarning(data[0])
        // Play alert sound
        try {
          const audio = new Audio('/sounds/incoming.wav')
          audio.volume = 0.5
          audio.play().catch(() => {})
        } catch {}
      }
    }
    checkUpcoming()
    const interval = setInterval(checkUpcoming, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* WELCOME BANNER */}
      <div style={{borderRadius:'16px', padding:'28px 32px', marginBottom:'24px',
                   display:'flex', alignItems:'center', justifyContent:'space-between',
                   background:'linear-gradient(135deg, #0EA5A0, #0C8F8A)',
                   boxShadow:'0 4px 20px rgba(14,165,160,0.3)'}}>
        <div>
          <h2 style={{fontSize:'22px', fontWeight:700, color:'white', marginBottom:'6px'}}>
            {greeting}, {teacherName.split(' ')[0]} 👋
          </h2>
          <p style={{color:'rgba(255,255,255,0.85)', fontSize:'14px'}}>
            You have 3 lessons scheduled today. Students are waiting!
          </p>
        </div>
        <button 
  onClick={handleToggleOnline}
  style={{background:'white', border:'none', 
          color: isOnline ? '#22C55E' : '#0EA5A0',
          padding:'12px 24px', borderRadius:'10px', cursor:'pointer',
          fontWeight:700, fontSize:'14px', whiteSpace:'nowrap',
          boxShadow: isOnline ? '0 0 0 3px rgba(34,197,94,0.3)' : 'none'}}>
    {isOnline ? '🟢 Online' : '⚫ Go Online'}
  </button>
      </div>

      {/* STATS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                   gap:'16px', marginBottom:'24px'}}>
        {[
          {emoji:'💰', label:'This Month', value:'$0', sub:'No earnings yet', bg:'#FEF3C7'},
          {emoji:'📅', label:'Lessons Today', value:'0', sub:'No lessons today', bg:'#CCFBF1'},
          {emoji:'👥', label:'Total Students', value:'0', sub:'No students yet', bg:'#EDE9FE'},
          {emoji:'⭐', label:'Rating', value:'—', sub:'No reviews yet', bg:'#FEF3C7'},
        ].map(s => (
          <div key={s.label} style={{background:'white', borderRadius:'16px',
                                      padding:'20px', border:'1px solid #E2E8F0'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
              <div style={{width:'40px', height:'40px', borderRadius:'10px',
                           background:s.bg, display:'flex', alignItems:'center',
                           justifyContent:'center', fontSize:'20px'}}>
                {s.emoji}
              </div>
              <span style={{fontSize:'13px', color:'#64748B'}}>{s.label}</span>
            </div>
            <div style={{fontSize:'28px', fontWeight:800, color:'#0F172A'}}>{s.value}</div>
            <div style={{fontSize:'12px', color:'#0EA5A0', marginTop:'4px'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TWO COLUMN */}
      <div style={{display:'grid', gridTemplateColumns:'3fr 2fr', gap:'20px'}}>
        
        {/* LEFT */}
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          
          {/* Today's Schedule */}
          <div style={{background:'white', borderRadius:'16px',
                       border:'1px solid #E2E8F0', padding:'24px'}}>
            <div style={{display:'flex', justifyContent:'space-between',
                         alignItems:'center', marginBottom:'16px'}}>
              <h3 style={{fontSize:'16px', fontWeight:700, color:'#0F172A'}}>
                📅 Today's Schedule
              </h3>
              <span style={{color:'#0EA5A0', fontSize:'13px', cursor:'pointer'}}>
                View all →
              </span>
            </div>
            <div style={{textAlign:'center', padding:'40px 20px', color:'#64748B'}}>
              <div style={{fontSize:'40px', marginBottom:'12px'}}>📅</div>
              <p style={{fontSize:'15px', fontWeight:600, color:'#0F172A', marginBottom:'4px'}}>
                No lessons scheduled yet
              </p>
              <p style={{fontSize:'13px'}}>
                Students will appear here when they book a lesson with you
              </p>
            </div>
          </div>

          {/* Recent Students */}
          <div style={{background:'white', borderRadius:'16px',
                       border:'1px solid #E2E8F0', padding:'24px'}}>
            <h3 style={{fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'16px'}}>
              👥 Recent Students
            </h3>
            <div style={{textAlign:'center', padding:'32px 20px', color:'#64748B'}}>
              <div style={{fontSize:'36px', marginBottom:'12px'}}>👥</div>
              <p style={{fontSize:'14px', fontWeight:600, color:'#0F172A', marginBottom:'4px'}}>
                No students yet
              </p>
              <p style={{fontSize:'13px'}}>Your students will appear here after lessons</p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>

          {/* Earnings */}
          <div style={{background:'white', borderRadius:'16px',
                       border:'1px solid #E2E8F0', padding:'24px'}}>
            <h3 style={{fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'16px'}}>
              💰 Earnings
            </h3>
            <div style={{fontSize:'32px', fontWeight:800, color:'#0F172A'}}>$1,240</div>
            <div style={{fontSize:'13px', color:'#0EA5A0', marginBottom:'16px'}}>This month</div>
            <div style={{textAlign:'center', padding:'20px', color:'#94A3B8', fontSize:'13px'}}>
              No earnings yet
            </div>
            <div style={{display:'flex', justifyContent:'space-between',
                         fontSize:'10px', color:'#94A3B8', marginBottom:'16px'}}>
              {['M','T','W','T','F','S','S'].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <button style={{width:'100%', padding:'10px', background:'#0EA5A0',
                            border:'none', borderRadius:'8px', color:'white',
                            cursor:'pointer', fontWeight:600, fontSize:'13px'}}>
              💳 Withdraw
            </button>
          </div>

          {/* Availability */}
          <div style={{background:'white', borderRadius:'16px',
                       border:'1px solid #E2E8F0', padding:'24px'}}>
            <h3 style={{fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'16px'}}>
              🟢 Availability
            </h3>
            <div style={{display:'flex', alignItems:'center',
                         justifyContent:'space-between', marginBottom:'16px',
                         padding:'12px', background:'#F0FFFE', borderRadius:'10px',
                         border:'1px solid #0EA5A0'}}>
              <span style={{fontSize:'13px', fontWeight:600, color:'#0F172A'}}>
                Accept Instant Lessons
              </span>
              <div style={{width:'44px', height:'24px', borderRadius:'12px',
                           background:'#0EA5A0', position:'relative', cursor:'pointer'}}>
                <div style={{position:'absolute', right:'3px', top:'3px',
                              width:'18px', height:'18px', borderRadius:'50%',
                              background:'white'}} />
              </div>
            </div>
            {['Mon 9am–5pm','Tue 9am–5pm','Wed Off','Thu 9am–5pm','Fri 9am–3pm'].map(d => (
              <div key={d} style={{display:'flex', justifyContent:'space-between',
                                    padding:'7px 0', borderBottom:'1px solid #F1F5F9',
                                    fontSize:'13px', color:'#64748B'}}>
                <span>{d.split(' ')[0]}</span>
                <span style={{color: d.includes('Off') ? '#EF4444' : '#0F172A',
                              fontWeight:500}}>
                  {d.split(' ').slice(1).join(' ')}
                </span>
              </div>
            ))}
            <button style={{width:'100%', marginTop:'12px', padding:'8px',
                            border:'1px solid #E2E8F0', borderRadius:'8px',
                            background:'white', cursor:'pointer', fontSize:'13px',
                            color:'#0F172A', fontWeight:500}}>
              ✏️ Edit Schedule
            </button>
          </div>
        </div>
      </div>

      {upcomingWarning && (
        <div style={{
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: 'white', animation: 'pulse 1s infinite'
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>
              ⏰ Lesson starting in 5 minutes!
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.9 }}>
              {upcomingWarning.textbook || 'English Lesson'} at {upcomingWarning.scheduled_time}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.location.href = `/lesson/${upcomingWarning.id}`}
              style={{ background: 'white', color: '#D97706', border: 'none',
                       padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                       fontWeight: 700, fontSize: '13px' }}>
              Join Now →
            </button>
            <button onClick={() => setUpcomingWarning(null)}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                       padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                       fontWeight: 700, fontSize: '13px' }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {showIncoming && incomingLesson && (
        <IncomingLessonAlert
          studentName={incomingLesson.studentName}
          subject={incomingLesson.subject}
          duration={incomingLesson.duration}
          preference={incomingLesson.preference}
          onAccept={async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              // Generate teacher token
              const roomName = `lesson-${incomingLesson.id}`
              let teacherToken = null
              try {
                teacherToken = await createDailyToken(roomName, user.id, true)
              } catch (e) {
                console.warn('Teacher token failed:', e)
              }
              // Update lesson: active + teacher token
              await supabase
                .from('lessons')
                .update({
                  status: 'active',
                  teacher_token: teacherToken,
                  room_name: roomName,
                })
                .eq('id', incomingLesson.id)
              setShowIncoming(false)
              setIncomingLesson(null)
              // Go to lesson room
              window.location.href = `/lesson/${incomingLesson.id}`
            } catch (e) {
              console.error('Accept failed:', e)
            }
          }}
        />
      )}
    </div>
  )
}
