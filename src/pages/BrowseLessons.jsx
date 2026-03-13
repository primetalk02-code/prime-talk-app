import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function BrowseLessons() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  const todayYmd = new Date().toISOString().slice(0, 10)
  const nowTime = new Date().toTimeString().slice(0, 5)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      await loadTeachers()
    }
    init()
  }, [])

  const loadTeachers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, photo_url, status')
        .eq('role', 'teacher')
        .eq('status', 'online')
      if (error) throw error
      setTeachers(data || [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const loadSlots = async (teacherId) => {
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('id, date, time_slot, status')
        .eq('teacher_id', teacherId)
        .eq('status', 'available')
        .gte('date', todayYmd)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true })
      if (error) throw error
      // Filter out past slots for today
      const filtered = (data || []).filter(s => {
        if (s.date === todayYmd) return s.time_slot >= nowTime
        return true
      })
      setSlots(filtered)
    } catch (e) {
      setError(e.message)
    }
    setSlotsLoading(false)
  }

  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher)
    setSuccess(false)
    setError('')
    await loadSlots(teacher.id)
  }

  const handleBook = async () => {
    if (!selectedSlot || !selectedTeacher || !currentUser) return
    setBooking(true)
    setError('')
    try {
      // Create reservation
      const { error: insertError } = await supabase
        .from('lessons')
        .insert({
          teacher_id: selectedTeacher.id,
          student_id: currentUser.id,
          status: 'waiting',
          source: 'scheduled',
          scheduled_date: selectedSlot.date,
          scheduled_time: selectedSlot.time_slot,
          duration: 25,
        })
      if (insertError) throw insertError

      // Mark slot as booked
      await supabase
        .from('availability')
        .update({ status: 'booked' })
        .eq('id', selectedSlot.id)

      setSuccess(true)
      setTimeout(() => navigate('/student/reservations'), 2000)
    } catch (e) {
      setError(e.message)
    }
    setBooking(false)
  }

  const formatSlot = (slot) => {
    const date = new Date(slot.date + 'T00:00:00')
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return `${dayName} at ${slot.time_slot}`
  }

  const getInitials = (name) => (name || 'T').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{padding:'0'}}>
      <h1 style={{fontSize:'24px', fontWeight:800, color:'#0F172A', marginBottom:'8px'}}>
        📚 Book a Lesson
      </h1>
      <p style={{color:'#64748B', fontSize:'14px', marginBottom:'24px'}}>
        Select an available teacher and choose a time slot
      </p>

      {error && (
        <div style={{background:'#FEF2F2', border:'1px solid #FECACA',
                     borderRadius:'8px', padding:'12px 16px', marginBottom:'16px',
                     color:'#DC2626', fontSize:'14px'}}>
          {error}
        </div>
      )}

      {success && (
        <div style={{background:'#F0FDF4', border:'1px solid #BBF7D0',
                     borderRadius:'8px', padding:'12px 16px', marginBottom:'16px',
                     color:'#16A34A', fontSize:'14px', fontWeight:600}}>
          ✅ Lesson booked! Redirecting to reservations...
        </div>
      )}

      {loading ? (
        <div style={{textAlign:'center', padding:'60px', color:'#64748B'}}>
          <div style={{fontSize:'32px', marginBottom:'12px'}}>⏳</div>
          <p>Loading available teachers...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div style={{background:'white', borderRadius:'16px', border:'1px solid #E2E8F0',
                     padding:'48px', textAlign:'center'}}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>😴</div>
          <p style={{fontSize:'16px', fontWeight:700, color:'#0F172A', marginBottom:'8px'}}>
            No teachers online right now
          </p>
          <p style={{color:'#64748B', fontSize:'14px'}}>
            Check back later or try the instant lesson feature
          </p>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns: selectedTeacher ? '1fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
                     gap:'16px', alignItems:'start'}}>
          {/* Teacher list */}
          <div style={{display:'grid', gap:'12px'}}>
            <h3 style={{fontSize:'14px', fontWeight:700, color:'#0F172A', marginBottom:'4px'}}>
              🟢 Online Teachers ({teachers.length})
            </h3>
            {teachers.map(teacher => (
              <div key={teacher.id}
                onClick={() => handleSelectTeacher(teacher)}
                style={{
                  background: selectedTeacher?.id === teacher.id ? '#F0FFFE' : 'white',
                  border: selectedTeacher?.id === teacher.id ? '2px solid #0EA5A0' : '1px solid #E2E8F0',
                  borderRadius:'12px', padding:'16px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:'12px',
                  transition:'all 0.15s'
                }}>
                <div style={{width:'48px', height:'48px', borderRadius:'50%',
                             background:'#0EA5A0', display:'flex', alignItems:'center',
                             justifyContent:'center', color:'white', fontWeight:700,
                             fontSize:'16px', flexShrink:0}}>
                  {getInitials(teacher.full_name)}
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:600, color:'#0F172A', fontSize:'15px', margin:0}}>
                    {teacher.full_name || 'Teacher'}
                  </p>
                  <div style={{display:'flex', alignItems:'center', gap:'6px', marginTop:'4px'}}>
                    <div style={{width:'7px', height:'7px', borderRadius:'50%', background:'#22C55E'}} />
                    <span style={{fontSize:'12px', color:'#16A34A', fontWeight:600}}>Online</span>
                  </div>
                </div>
                <span style={{color:'#0EA5A0', fontSize:'13px', fontWeight:600}}>
                  {selectedTeacher?.id === teacher.id ? 'Selected ✓' : 'Select →'}
                </span>
              </div>
            ))}
          </div>

          {/* Slot picker */}
          {selectedTeacher && (
            <div style={{background:'white', borderRadius:'16px',
                         border:'1px solid #E2E8F0', padding:'20px', position:'sticky', top:'80px'}}>
              <h3 style={{fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'16px'}}>
                📅 Available Slots for {selectedTeacher.full_name}
              </h3>

              {slotsLoading ? (
                <p style={{color:'#64748B', fontSize:'14px', textAlign:'center', padding:'24px'}}>
                  Loading slots...
                </p>
              ) : slots.length === 0 ? (
                <div style={{textAlign:'center', padding:'24px', color:'#64748B'}}>
                  <p style={{fontSize:'13px'}}>No available slots for this teacher right now</p>
                </div>
              ) : (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px'}}>
                  {slots.map(slot => (
                    <button key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding:'10px 8px', borderRadius:'8px', cursor:'pointer',
                        fontSize:'12px', fontWeight:600, textAlign:'center',
                        background: selectedSlot?.id === slot.id ? '#0EA5A0' : '#F8FAFC',
                        color: selectedSlot?.id === slot.id ? 'white' : '#0F172A',
                        border: selectedSlot?.id === slot.id ? '2px solid #0EA5A0' : '1px solid #E2E8F0',
                        transition:'all 0.15s'
                      }}>
                      {formatSlot(slot)}
                    </button>
                  ))}
                </div>
              )}

              {selectedSlot && (
                <div>
                  <div style={{background:'#F0FFFE', borderRadius:'8px',
                               padding:'12px', marginBottom:'12px',
                               border:'1px solid #99F6E4'}}>
                    <p style={{fontSize:'13px', color:'#0F172A', margin:0}}>
                      <strong>Booking:</strong> {formatSlot(selectedSlot)}
                    </p>
                    <p style={{fontSize:'12px', color:'#64748B', margin:'4px 0 0'}}>
                      25 min lesson with {selectedTeacher.full_name}
                    </p>
                  </div>
                  <button onClick={handleBook} disabled={booking}
                    style={{width:'100%', background:'#0EA5A0', color:'white',
                            border:'none', padding:'12px', borderRadius:'8px',
                            cursor:'pointer', fontWeight:700, fontSize:'14px'}}>
                    {booking ? 'Booking...' : '✅ Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}