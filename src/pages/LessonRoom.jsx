import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function LessonRoom() {
  const navigate = useNavigate()
  const location = useLocation()
  const { lessonId, roomId, reservationId } = useParams()
  const actualLessonId = lessonId || roomId || reservationId
  const teacherName = location.state?.teacherName || 'Sarah Kim'
  
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('Chat')
  const [chatInput, setChatInput] = useState('')
  const [notes, setNotes] = useState('')
  const [newWord, setNewWord] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [messages, setMessages] = useState([
    {sender:'teacher', text:'Hello! Ready to start our lesson?', time:'3:00 PM'},
    {sender:'me', text:"Yes! Let's go!", time:'3:01 PM'},
    {sender:'teacher', text:'Great! Open the textbook to Chapter 3.', time:'3:01 PM'}
  ])
  const [vocabList, setVocabList] = useState([
    {word:'Follow up', definition:'To contact someone again about something'},
    {word:'Regarding', definition:'Concerning or in relation to something'}
  ])
  const videoRef = useRef(null)
  const { role } = useAuth()
  const [lessonData, setLessonData] = useState(null)

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(t => t <= 0 ? 0 : t - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!actualLessonId) return
    const loadLesson = async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id, teacher_id, student_id, status, textbook, duration')
        .eq('id', actualLessonId)
        .single()
      if (data) setLessonData(data)
    }
    loadLesson()
  }, [actualLessonId])

  const localVideoRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const streamRef = useRef(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, audio: true 
        })
        streamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setCameraActive(true)
      } catch (err) {
        setCameraError('Camera access denied. Please allow camera permissions.')
      }
    }
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const isLowTime = timeLeft < 300

  const sendMessage = () => {
    if (!chatInput.trim()) return
    setMessages(p => [...p, {sender:'me', text:chatInput,
      time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}])
    setChatInput('')
  }

  const addVocab = () => {
    if (!newWord.trim()) return
    setVocabList(p => [...p, {word:newWord, definition:'(definition pending)'}])
    setNewWord('')
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh',
                 background:'#0D1117', color:'white', overflow:'hidden'}}>
      
      {/* HEADER */}
      <header style={{height:'56px', background:'#161C27',
                      borderBottom:'1px solid #1E2535', flexShrink:0,
                      display:'flex', alignItems:'center',
                      justifyContent:'space-between', padding:'0 20px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
          <span style={{fontWeight:800, fontSize:'18px'}}>
            Prime<span style={{color:'#0EA5A0'}}>Talk</span>
          </span>
          <span style={{color:'#64748B', fontSize:'13px'}}>|</span>
          <span style={{fontSize:'13px', color:'#E2E8F0'}}>
            Business English with {teacherName}
          </span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap:'8px',
                     fontFamily:'monospace', fontSize:'20px', fontWeight:700,
                     color: isLowTime ? '#EF4444' : '#0EA5A0'}}>
          ⏱ {formatTime(timeLeft)}
        </div>
        
        <div style={{display:'flex', gap:'8px'}}>
          <button onClick={() => setIsMuted(m => !m)}
            style={{padding:'8px 14px', borderRadius:'8px', border:'none',
                    cursor:'pointer', fontSize:'16px',
                    background: isMuted ? '#EF4444' : '#1E2535',
                    color:'white'}}>
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button onClick={() => setCameraOn(c => !c)}
            style={{padding:'8px 14px', borderRadius:'8px', border:'none',
                    cursor:'pointer', fontSize:'16px',
                    background: cameraOn ? '#1E2535' : '#EF4444',
                    color:'white'}}>
            {cameraOn ? '📷' : '📵'}
          </button>
          <button onClick={() => {
    const userRole = role || localStorage.getItem('userRole') || 'student'
    const endPath = userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
    navigate(endPath)
  }}
            style={{padding:'8px 16px', borderRadius:'8px', border:'none',
                    background:'#EF4444', color:'white', cursor:'pointer',
                    fontWeight:600, fontSize:'13px'}}>
            🔴 End Lesson
          </button>
        </div>
      </header>

      {/* 3 PANELS */}
      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
        
        {/* VIDEO PANEL 50% */}
        <div style={{width:'50%', background:'#0D1117',
                     borderRight:'1px solid #1E2535', position:'relative',
                     display:'flex', alignItems:'center', justifyContent:'center'}}>
          
          {/* Remote student area - placeholder */}
          <div style={{ width:'100%', height:'100%', display:'flex',
                        alignItems:'center', justifyContent:'center',
                        flexDirection:'column', background:'#0D1117', gap:'12px' }}>
            <div style={{ fontSize:'80px' }}>👤</div>
            <p style={{ color:'white', fontSize:'18px', fontWeight:700 }}>
              {lessonData?.textbook || 'English Lesson'}
            </p>
            <p style={{ color:'#64748B', fontSize:'14px' }}>
              {lessonData?.duration || 25} min · Waiting for other participant...
            </p>
          </div>

          {/* Local camera preview - bottom right corner */}
          <div style={{ position:'absolute', bottom:'16px', right:'16px',
                        width:'160px', height:'120px', borderRadius:'8px',
                        overflow:'hidden', border:'2px solid #0EA5A0',
                        background:'#1a1a2e' }}>
            {cameraError ? (
              <div style={{ width:'100%', height:'100%', display:'flex',
                            alignItems:'center', justifyContent:'center',
                            flexDirection:'column', padding:'8px', textAlign:'center' }}>
                <span style={{ fontSize:'24px' }}>🚫</span>
                <p style={{ color:'#EF4444', fontSize:'10px', marginTop:'4px' }}>
                  {cameraError}
                </p>
              </div>
            ) : (
              <video ref={localVideoRef} autoPlay muted playsInline
                style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }} />
            )}
            <div style={{ position:'absolute', bottom:'4px', left:'4px',
                          fontSize:'9px', color:'white', background:'rgba(0,0,0,0.5)',
                          padding:'2px 6px', borderRadius:'4px' }}>
              You
            </div>
          </div>
        </div>

        {/* TEXTBOOK PANEL 30% */}
        <div style={{width:'30%', background:'#161C27',
                     borderRight:'1px solid #1E2535',
                     display:'flex', flexDirection:'column'}}>
          
          <div style={{padding:'12px 16px', borderBottom:'1px solid #1E2535',
                       display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span style={{fontWeight:600, fontSize:'14px'}}>📚 Textbook</span>
            <select style={{background:'#0D1117', color:'white', border:'1px solid #1E2535',
                            fontSize:'12px', padding:'4px 8px', borderRadius:'6px',
                            outline:'none'}}>
              <option>Business English</option>
              <option>IELTS Prep</option>
              <option>Conversation</option>
            </select>
          </div>
          
          <div style={{padding:'8px 16px', borderBottom:'1px solid #1E2535',
                       display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <button onClick={() => setPage(p => Math.max(1,p-1))}
              style={{background:'#1E2535', border:'none', color:'white',
                      padding:'4px 12px', borderRadius:'6px', cursor:'pointer'}}>←</button>
            <span style={{fontSize:'13px', color:'#64748B'}}>Page {page} / 24</span>
            <button onClick={() => setPage(p => Math.min(24,p+1))}
              style={{background:'#1E2535', border:'none', color:'white',
                      padding:'4px 12px', borderRadius:'6px', cursor:'pointer'}}>→</button>
          </div>
          
          <div style={{flex:1, padding:'20px', overflowY:'auto'}}>
            <h3 style={{color:'#0EA5A0', fontSize:'15px', marginBottom:'12px', fontWeight:700}}>
              Chapter {page}: Professional Email Writing
            </h3>
            <p style={{color:'#94A3B8', fontSize:'13px', lineHeight:1.8, marginBottom:'16px'}}>
              Professional emails need a clear structure. Always begin with a formal 
              greeting and state your purpose in the opening sentence.
            </p>
            <div style={{background:'#0D1117', borderRadius:'8px', padding:'14px',
                         borderLeft:'3px solid #0EA5A0', marginBottom:'16px'}}>
              <p style={{color:'#0EA5A0', fontSize:'12px', fontWeight:700, marginBottom:'8px'}}>
                📝 Example
              </p>
              <p style={{color:'#94A3B8', fontSize:'13px', lineHeight:1.7}}>
                "Dear Mr. Smith,<br/>I am writing to follow up on our previous 
                discussion regarding the Q3 timeline..."
              </p>
            </div>
            <p style={{color:'white', fontSize:'13px', fontWeight:600, marginBottom:'10px'}}>
              Key Phrases:
            </p>
            {['Follow up', 'Regarding', 'As per our discussion', 
              'Please find attached', 'Looking forward to hearing from you'].map(w => (
              <div key={w} style={{display:'flex', gap:'8px', alignItems:'flex-start',
                                    marginBottom:'8px'}}>
                <span style={{color:'#0EA5A0', flexShrink:0}}>▸</span>
                <span style={{color:'#E2E8F0', fontSize:'13px'}}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT PANEL 20% */}
        <div style={{width:'20%', background:'#161C27',
                     display:'flex', flexDirection:'column'}}>
          
          <div style={{padding:'10px 12px', borderBottom:'1px solid #1E2535'}}>
            <div style={{display:'flex', gap:'3px'}}>
              {['Chat','Notes','Vocab'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  style={{flex:1, padding:'7px 4px', borderRadius:'6px',
                          border:'none', fontSize:'12px', cursor:'pointer',
                          fontWeight:600,
                          background: activeTab===t ? '#0EA5A0' : '#1E2535',
                          color: activeTab===t ? 'white' : '#64748B'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {activeTab==='Chat' && <>
            <div style={{flex:1, padding:'12px', overflowY:'auto',
                         display:'flex', flexDirection:'column', gap:'10px'}}>
              {messages.map((m,i) => (
                <div key={i} style={{alignSelf: m.sender==='me' ? 'flex-end':'flex-start',
                                     maxWidth:'88%'}}>
                  <div style={{padding:'8px 12px', borderRadius:'12px', fontSize:'13px',
                               background: m.sender==='me' ? '#0EA5A0' : '#1E2535',
                               color:'white', lineHeight:1.5}}>
                    {m.text}
                  </div>
                  <div style={{fontSize:'10px', color:'#64748B', marginTop:'3px',
                               textAlign: m.sender==='me' ? 'right':'left'}}>
                    {m.time}
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:'10px', borderTop:'1px solid #1E2535',
                         display:'flex', gap:'6px'}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&sendMessage()}
                placeholder="Message..."
                style={{flex:1, background:'#0D1117', border:'1px solid #1E2535',
                        borderRadius:'8px', padding:'8px 10px', color:'white',
                        fontSize:'12px', outline:'none'}} />
              <button onClick={sendMessage}
                style={{background:'#0EA5A0', border:'none', borderRadius:'8px',
                        padding:'8px 12px', color:'white', cursor:'pointer',
                        fontSize:'14px'}}>→</button>
            </div>
          </>}

          {activeTab==='Notes' && (
            <div style={{flex:1, padding:'12px', display:'flex', flexDirection:'column', gap:'8px'}}>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                placeholder="Take notes here..."
                style={{flex:1, background:'#0D1117', border:'1px solid #1E2535',
                        borderRadius:'8px', padding:'12px', color:'white',
                        fontSize:'13px', resize:'none', outline:'none', lineHeight:1.7}} />
              <button style={{background:'#0EA5A0', border:'none', borderRadius:'8px',
                              padding:'8px', color:'white', cursor:'pointer',
                              fontSize:'13px', fontWeight:600}}>
                💾 Save Notes
              </button>
            </div>
          )}

          {activeTab==='Vocab' && (
            <div style={{flex:1, padding:'12px', overflowY:'auto',
                         display:'flex', flexDirection:'column', gap:'8px'}}>
              {vocabList.map((v,i) => (
                <div key={i} style={{background:'#0D1117', borderRadius:'8px', padding:'10px'}}>
                  <div style={{color:'#0EA5A0', fontWeight:700, fontSize:'13px'}}>{v.word}</div>
                  <div style={{color:'#94A3B8', fontSize:'12px', marginTop:'4px'}}>{v.definition}</div>
                </div>
              ))}
              <div style={{display:'flex', gap:'6px', marginTop:'4px'}}>
                <input value={newWord} onChange={e=>setNewWord(e.target.value)}
                  placeholder="Add word..."
                  style={{flex:1, background:'#0D1117', border:'1px solid #1E2535',
                          borderRadius:'6px', padding:'6px 8px', color:'white',
                          fontSize:'12px', outline:'none'}} />
                <button onClick={addVocab}
                  style={{background:'#0EA5A0', border:'none', borderRadius:'6px',
                          padding:'6px 10px', color:'white', cursor:'pointer',
                          fontWeight:700}}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}