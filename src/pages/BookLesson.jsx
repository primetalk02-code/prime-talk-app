import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const TIMES = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM',
               '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','5:00 PM','6:00 PM']

export default function BookLesson() {
  const navigate = useNavigate()
  const [selectedDay, setSelectedDay] = useState('Mon')
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(25)
  const [topic, setTopic] = useState('')
  const unavailable = ['9:30 AM','11:00 AM','3:30 PM']

  return (
    <div style={{minHeight:'100vh', background:'#F8FAFC', padding:'32px 20px'}}>
      <div style={{maxWidth:'900px', margin:'0 auto'}}>
        
        <button onClick={() => navigate(-1)}
          style={{background:'none', border:'none', cursor:'pointer',
                  color:'#64748B', fontSize:'14px', marginBottom:'24px',
                  display:'flex', alignItems:'center', gap:'6px'}}>
          ← Back
        </button>
        
        <h1 style={{fontSize:'28px', fontWeight:800, color:'#0F172A', marginBottom:'24px'}}>
          📅 Book a Lesson
        </h1>

        <div style={{display:'grid', gridTemplateColumns:'3fr 2fr', gap:'24px'}}>
          
          {/* LEFT - Booking Form */}
          <div style={{background:'white', borderRadius:'16px',
                       border:'1px solid #E2E8F0', padding:'28px'}}>
            
            <h3 style={{fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'14px'}}>
              Select Date
            </h3>
            <div style={{display:'flex', gap:'8px', marginBottom:'24px', flexWrap:'wrap'}}>
              {DAYS.map(d => (
                <button key={d} onClick={() => setSelectedDay(d)}
                  style={{padding:'8px 14px', borderRadius:'8px', border:'none',
                          cursor:'pointer', fontWeight:600, fontSize:'13px',
                          background: selectedDay===d ? '#0EA5A0' : '#F1F5F9',
                          color: selectedDay===d ? 'white' : '#64748B'}}>
                  {d}
                </button>
              ))}
            </div>

            <h3 style={{fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'14px'}}>
              Select Time
            </h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                         gap:'8px', marginBottom:'24px'}}>
              {TIMES.map(t => {
                const isUnavailable = unavailable.includes(t)
                const isSelected = selectedTime === t
                return (
                  <button key={t} onClick={() => !isUnavailable && setSelectedTime(t)}
                    style={{padding:'9px 6px', borderRadius:'8px', fontSize:'12px',
                            fontWeight:500, border:'1px solid',
                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                            borderColor: isSelected ? '#0EA5A0' : '#E2E8F0',
                            background: isSelected ? '#0EA5A0' : isUnavailable ? '#F1F5F9' : 'white',
                            color: isSelected ? 'white' : isUnavailable ? '#CBD5E1' : '#0F172A',
                            textDecoration: isUnavailable ? 'line-through' : 'none'}}>
                    {t}
                  </button>
                )
              })}
            </div>

            <h3 style={{fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'14px'}}>
              Duration
            </h3>
            <div style={{display:'flex', gap:'10px', marginBottom:'24px'}}>
              {[{min:25,price:18},{min:50,price:34}].map(opt => (
                <button key={opt.min} onClick={() => setDuration(opt.min)}
                  style={{flex:1, padding:'12px', borderRadius:'10px',
                          border:'2px solid', cursor:'pointer', fontWeight:600,
                          borderColor: duration===opt.min ? '#0EA5A0' : '#E2E8F0',
                          background: duration===opt.min ? '#F0FFFE' : 'white',
                          color: duration===opt.min ? '#0EA5A0' : '#64748B'}}>
                  {opt.min} min — ${opt.price}
                </button>
              ))}
            </div>

            <h3 style={{fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'10px'}}>
              Topic
            </h3>
            <input value={topic} onChange={e=>setTopic(e.target.value)}
              placeholder="What would you like to focus on?"
              style={{width:'100%', padding:'11px 14px', borderRadius:'8px',
                      border:'1px solid #E2E8F0', fontSize:'14px', marginBottom:'24px',
                      outline:'none', boxSizing:'border-box', color:'#0F172A'}} />

            <button onClick={() => navigate('/lesson')}
              style={{width:'100%', padding:'14px', background:'#0EA5A0',
                      border:'none', borderRadius:'10px', color:'white',
                      cursor:'pointer', fontWeight:700, fontSize:'15px'}}>
              Confirm Booking — ${duration===25?18:34}
            </button>
          </div>

          {/* RIGHT - Teacher Card */}
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
            <div style={{background:'white', borderRadius:'16px',
                         border:'1px solid #E2E8F0', padding:'24px'}}>
              <div style={{display:'flex', flexDirection:'column',
                           alignItems:'center', textAlign:'center', marginBottom:'16px'}}>
                <div style={{width:'64px', height:'64px', borderRadius:'50%',
                             background:'#0EA5A0', display:'flex', alignItems:'center',
                             justifyContent:'center', color:'white', fontWeight:800,
                             fontSize:'22px', marginBottom:'12px'}}>
                  SK
                </div>
                <h3 style={{fontSize:'18px', fontWeight:700, color:'#0F172A', margin:'0 0 4px'}}>
                  Sarah Kim
                </h3>
                <span style={{background:'#CCFBF1', color:'#0EA5A0', padding:'3px 12px',
                              borderRadius:'20px', fontSize:'12px', fontWeight:600}}>
                  Business English
                </span>
              </div>
              <div style={{display:'flex', justifyContent:'center', gap:'4px',
                           color:'#F59E0B', fontSize:'16px', marginBottom:'8px'}}>
                ★★★★★ <span style={{color:'#64748B', fontSize:'13px', marginLeft:'4px'}}>4.9</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-around',
                           padding:'12px 0', borderTop:'1px solid #E2E8F0',
                           borderBottom:'1px solid #E2E8F0', marginBottom:'12px'}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontWeight:700, color:'#0F172A'}}>1,240</div>
                  <div style={{fontSize:'11px', color:'#64748B'}}>Lessons</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontWeight:700, color:'#0F172A'}}>$18</div>
                  <div style={{fontSize:'11px', color:'#64748B'}}>/ 25min</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', justifyContent:'center',
                           gap:'6px', marginBottom:'12px'}}>
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:'#22C55E'}} />
                <span style={{fontSize:'13px', color:'#22C55E', fontWeight:600}}>Online Now</span>
              </div>
              
              {/* Booking Summary */}
              <div style={{background:'#F8FAFC', borderRadius:'10px',
                           padding:'14px', fontSize:'13px'}}>
                <div style={{display:'flex', justifyContent:'space-between',
                             marginBottom:'6px', color:'#64748B'}}>
                  <span>Day</span><span style={{color:'#0F172A', fontWeight:500}}>{selectedDay}</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between',
                             marginBottom:'6px', color:'#64748B'}}>
                  <span>Time</span>
                  <span style={{color: selectedTime ? '#0F172A' : '#CBD5E1', fontWeight:500}}>
                    {selectedTime || 'Not selected'}
                  </span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between',
                             marginBottom:'6px', color:'#64748B'}}>
                  <span>Duration</span><span style={{color:'#0F172A', fontWeight:500}}>{duration} min</span>
                </div>
                <div style={{display:'flex', justifyContent:'space-between',
                             paddingTop:'8px', borderTop:'1px solid #E2E8F0',
                             fontWeight:700, color:'#0F172A'}}>
                  <span>Total</span><span style={{color:'#0EA5A0'}}>${duration===25?18:34}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}