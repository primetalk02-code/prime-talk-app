import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function StudentReservations() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('lessons')
      .select('id, teacher_id, status, duration, source, textbook, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
    setReservations(data || [])
    setLoading(false)
  }

  const statusColor = (s) => ({
    waiting: { bg: '#FEF9C3', color: '#CA8A04', label: '⏳ Waiting' },
    active:  { bg: '#DCFCE7', color: '#16A34A', label: '✅ Active' },
    finished:{ bg: '#F1F5F9', color: '#64748B', label: '✓ Finished' },
    declined:{ bg: '#FEF2F2', color: '#DC2626', label: '✗ Declined' },
  }[s] || { bg: '#F1F5F9', color: '#64748B', label: s })

  const filtered = filter === 'all' ? reservations 
    : reservations.filter(r => r.status === filter)

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>📋 Reservations</h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Your lesson bookings</p>
        </div>
        <button onClick={() => navigate('/student/book-lesson')}
          style={{ background: '#0EA5A0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>
          + Book Lesson
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['all', 'waiting', 'active', 'finished', 'declined'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
              background: filter === f ? '#0EA5A0' : '#F1F5F9',
              color: filter === f ? 'white' : '#64748B',
              textTransform: 'capitalize'
            }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>Loading reservations...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>No reservations yet</p>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>Book a lesson to get started</p>
          <button onClick={() => navigate('/student/book-lesson')}
            style={{ background: '#0EA5A0', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            Browse Teachers
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filtered.map(r => {
            const s = statusColor(r.status)
            return (
              <div key={r.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0FFFE', border: '2px solid #0EA5A0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    🎓
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0F172A', margin: 0, fontSize: '15px' }}>
                      {r.textbook || 'English Lesson'} · {r.duration || 25} min
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>
                      {r.source === 'sudden' ? '⚡ Instant' : '📅 Scheduled'} · {new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  {r.status === 'active' && (
                    <button onClick={() => navigate(`/lesson/${r.id}`)}
                      style={{ background: '#0EA5A0', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                      Join →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}