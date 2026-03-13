import { useState, useEffect, useRef } from 'react'

export default function IncomingLessonAlert({ studentName, subject, duration, preference, onAccept }) {
  const [countdown, setCountdown] = useState(30)
  const audioRef = useRef(null)

  useEffect(() => {
    try {
      const audio = new Audio('/sounds/incoming.wav')
      audio.loop = true
      audio.play().catch(()=>{})
      audioRef.current = audio
    } catch(e) {}
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current = null
      }
    }
  }, [])

  const handleAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    onAccept()
  }

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(80px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <div style={{position:'fixed', bottom:'24px', right:'24px', zIndex:9999,
                   background:'#161C27', border:'2px solid #0EA5A0',
                   borderRadius:'20px', padding:'24px', width:'300px',
                   boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
                   animation:'slideIn 0.4s ease'}}>
        
        <div style={{position:'relative', width:'56px', height:'56px',
                     margin:'0 auto 16px'}}>
          <div style={{position:'absolute', inset:'-10px', borderRadius:'50%',
                       border:'2px solid #0EA5A0', opacity:0.5,
                       animation:'ping 1.2s ease-out infinite'}} />
          <div style={{width:'56px', height:'56px', borderRadius:'50%',
                       background:'linear-gradient(135deg,#0EA5A0,#0C8F8A)',
                       display:'flex', alignItems:'center', justifyContent:'center',
                       fontSize:'26px'}}>👤</div>
        </div>

        <p style={{textAlign:'center', color:'#64748B', fontSize:'11px',
                   marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px'}}>
          Incoming Request
        </p>
        <h3 style={{textAlign:'center', color:'white', fontSize:'20px',
                    fontWeight:800, margin:'0 0 4px'}}>
          {studentName}
        </h3>
        <p style={{textAlign:'center', color:'#0EA5A0', fontSize:'13px',
                   marginBottom:'16px'}}>
          {subject} • {duration} min
        </p>

        <div style={{background:'rgba(14,165,160,0.1)', borderRadius:'10px',
                     padding:'12px', marginBottom:'16px', fontSize:'13px', color:'#94A3B8'}}>
          <p style={{margin:'0 0 4px', fontWeight:600, color:'#0EA5A0'}}>Student Preference:</p>
          <p style={{margin:0}}>{preference || 'General English Conversation'}</p>
        </div>

        <div style={{textAlign:'center', marginBottom:'12px'}}>
          <span style={{fontSize:'32px', fontWeight:800, color:'#F59E0B',
                        display:'block', lineHeight:1}}>
            {countdown}s
          </span>
          <span style={{color:'#64748B', fontSize:'11px'}}>Auto-decline</span>
        </div>

        <div style={{height:'3px', background:'#1E2535', borderRadius:'2px',
                     marginBottom:'16px'}}>
          <div style={{height:'100%', borderRadius:'2px', background:'#F59E0B',
                       width:`${(countdown/30)*100}%`,
                       transition:'width 1s linear'}} />
        </div>

        <div style={{display:'flex'}}>
          <button onClick={handleAccept}
            style={{width:'100%', padding:'14px', borderRadius:'10px', border:'none',
                    background:'linear-gradient(135deg,#0EA5A0,#0C8F8A)',
                    color:'white', cursor:'pointer', fontWeight:700,
                    fontSize:'16px', boxShadow:'0 4px 15px rgba(14,165,160,0.4)'}}>
            ✓ Accept Lesson
          </button>
        </div>
      </div>
    </>
  )
}