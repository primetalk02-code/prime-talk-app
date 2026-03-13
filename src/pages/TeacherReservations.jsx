import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function TeacherReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentNames, setStudentNames] = useState({})

  useEffect(() => { loadReservations() }, [])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('lessons')
        .select('id, student_id, status, duration, source, created_at, textbook')
        .eq('teacher_id', user.id)
        .in('status', ['waiting', 'active'])
        .order('created_at', { ascending: false })
      if (error) throw error
      setReservations(data || [])
      // Fetch student names
      const studentIds = [...new Set((data||[]).map(r => r.student_id).filter(Boolean))]
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
        const nameMap = {}
        for (const p of profiles || []) {
          nameMap[p.id] = p.full_name || p.email?.split('@')[0] || 'Student'
        }
        setStudentNames(nameMap)
      }
    } catch(e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleAccept = async (id) => {
    await supabase.from('lessons').update({ status: 'active' }).eq('id', id)
    loadReservations()
  }

  const handleDecline = async (id) => {
    await supabase.from('lessons').update({ status: 'declined' }).eq('id', id)
    loadReservations()
  }

  const formatCreated = (created_at) => {
    if (!created_at) return 'Just now'
    return new Date(created_at).toLocaleDateString('en-US', 
      { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{padding:'0'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:800, color:'#0F172A', margin:0}}>
            📋 Reservations
          </h1>
          <p style={{color:'#64748B', fontSize:'14px', marginTop:'4px'}}>
            Incoming lesson requests and bookings
          </p>
        </div>
        <button onClick={loadReservations}
          style={{background:'white', border:'1px solid #E2E8F0', padding:'8px 16px',
                  borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'#64748B'}}>
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'8px',
                     padding:'12px', marginBottom:'16px', color:'#DC2626', fontSize:'14px'}}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center', padding:'60px', color:'#64748B'}}>
          <div style={{fontSize:'32px', marginBottom:'12px'}}>⏳</div>
          <p>Loading reservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div style={{background:'white', borderRadius:'16px', border:'1px solid #E2E8F0',
                     padding:'48px', textAlign:'center'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>📭</div>
          <p style={{fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'8px'}}>
            No pending reservations
          </p>
          <p style={{color:'#64748B', fontSize:'14px'}}>
            New bookings will appear here automatically
          </p>
        </div>
      ) : (
        <div style={{display:'grid', gap:'12px'}}>
          {reservations.map(r => (
            <div key={r.id}
              style={{background:'white', borderRadius:'12px', border:'1px solid #E2E8F0',
                      padding:'20px', display:'flex', justifyContent:'space-between',
                      alignItems:'center', gap:'16px'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'50%',
                               background:'#0EA5A0', display:'flex', alignItems:'center',
                               justifyContent:'center', color:'white', fontWeight:700, fontSize:'14px'}}>
                    👤
                  </div>
                  <div>
                    <p style={{fontWeight:700, color:'#0F172A', margin:0, fontSize:'15px'}}>
                      {studentNames[r.student_id] || 'Student'}
                    </p>
                    <p style={{fontSize:'12px', color:'#64748B', margin:0}}>
                      {r.source === 'sudden' ? '⚡ Instant lesson' : '📅 Scheduled'} · {r.duration || 25} min
                    </p>
                  </div>
                </div>
                <p style={{fontSize:'13px', color:'#64748B', margin:0}}>
                  🗓 {formatCreated(r.created_at)}
                </p>
                <div style={{marginTop:'6px'}}>
                  <span style={{
                    display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600,
                    background: r.status === 'waiting' ? '#FEF9C3' : '#DCFCE7',
                    color: r.status === 'waiting' ? '#CA8A04' : '#16A34A'
                  }}>
                    {r.status === 'waiting' ? '⏳ Waiting' : '✅ Active'}
                  </span>
                </div>
              </div>
              {r.status === 'waiting' && (
                <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                  <button onClick={() => handleAccept(r.id)}
                    style={{background:'#0EA5A0', color:'white', border:'none',
                            padding:'10px 18px', borderRadius:'8px', cursor:'pointer',
                            fontWeight:600, fontSize:'13px'}}>
                    ✅ Accept
                  </button>
                </div>
              )}
              {r.status === 'active' && (
                <button
                  onClick={() => window.location.href = `/lesson/${r.id}`}
                  style={{background:'#0EA5A0', color:'white', border:'none',
                          padding:'10px 20px', borderRadius:'8px', cursor:'pointer',
                          fontWeight:700, fontSize:'13px', marginLeft:'8px'}}>
                  🎥 Join Lesson →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}