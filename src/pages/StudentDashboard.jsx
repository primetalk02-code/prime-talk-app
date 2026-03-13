import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/authContext'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedLessonNotes, setSelectedLessonNotes] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState('vocabulary')

  // Mock data
  const mockStudent = {
    name: "Alex Johnson",
    level: "B2",
    streak: 12,
    totalLessons: 47,
    totalHours: 19.5,
    avgRating: 4.8
  }

  const mockUpcomingLessons = [
    { id: 1, teacher: "Sarah Kim", initials: "SK", color: "#0EA5A0", specialty: "Business English", datetime: "Today, 3:00 PM", duration: 25, status: "confirmed", timeUntil: "2h 14m" },
    { id: 2, teacher: "James Okafor", initials: "JO", color: "#0C8F8A", specialty: "IELTS Prep", datetime: "Tomorrow, 10:00 AM", duration: 25, status: "confirmed", timeUntil: "1d 5h 30m" }
  ]

  const mockRecentLessons = [
    { id: 1, teacher: "Sarah Kim", initials: "SK", color: "#0EA5A0", date: "Mar 7, 2025", duration: 25, topic: "Business Email Writing", rating: 5 },
    { id: 2, teacher: "Amina Rossi", initials: "AR", color: "#F59E0B", date: "Mar 5, 2025", duration: 25, topic: "Casual Conversation", rating: 5 },
    { id: 3, teacher: "James Okafor", initials: "JO", color: "#0C8F8A", date: "Mar 3, 2025", duration: 25, topic: "IELTS Reading Strategies", rating: 4 }
  ]

  const mockFavoriteTeachers = [
    { id: 1, name: "Sarah Kim", initials: "SK", color: "#0EA5A0", specialty: "Business English", status: "online" },
    { id: 2, name: "James Okafor", initials: "JO", color: "#0C8F8A", specialty: "IELTS Prep", status: "available" },
    { id: 3, name: "Amina Rossi", initials: "AR", color: "#F59E0B", specialty: "Conversation", status: "offline" }
  ]

  const mockWeeklyActivity = { Mon: 1, Tue: 2, Wed: 0, Thu: 1, Fri: 2, Sat: 1, Sun: 0 }
  const mockSkills = { speaking: 75, grammar: 62, vocabulary: 80 }

  const mockLessonNotes = {
    vocabulary: [
      { word: "Leverage", definition: "To use something to maximum advantage" },
      { word: "Synergy", definition: "Combined effort greater than individual parts" },
      { word: "Stakeholder", definition: "A person with interest in a project or business" }
    ],
    grammarPoints: [
      "Present Perfect vs Past Simple — use Present Perfect for experiences, Past Simple for specific times",
      "Passive Voice in Business — 'The report was submitted' sounds more professional than 'I submitted the report'"
    ],
    teacherFeedback: "Alex showed great improvement in using formal vocabulary today. Focus on connecting ideas with transition phrases like 'Furthermore' and 'In addition to'. Keep practicing!",
    myNotes: "Remember: leverage = use to full advantage. Practice passive voice in emails this week."
  }

  // Effects
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Helper functions
  const getTimeGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10B981'
      case 'available': return '#F59E0B'
      default: return '#94A3B8'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online Now'
      case 'available': return 'Available Today'
      default: return 'Offline'
    }
  }

  const openLessonNotes = (lesson) => {
    setSelectedLessonNotes({ ...lesson, notes: mockLessonNotes })
  }

  const closeLessonNotes = () => {
    setSelectedLessonNotes(null)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#F8FAFC', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'white',
        borderRight: '1px solid #E2E8F0', display: 'flex',
        flexDirection: 'column', height: '100vh',
        position: 'fixed', top: 0, left: 0, zIndex: 20
      }}>
        {/* Logo area */}
        <div style={{ padding: 24, borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Prime</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0EA5A0' }}>Talk</span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
            {[
            { icon: '🏠', label: 'Dashboard', active: true },
            { icon: '🔍', label: 'Browse Teachers' },
            { icon: '📅', label: 'My Lessons' },
            { icon: '📚', label: 'Textbooks' },
            { icon: '💬', label: 'Messages' },
            { icon: '⚙️', label: 'Settings' }
          ].map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.label === "Browse Teachers") navigate("/student/online-teachers")
                if (item.label === "My Lessons") navigate("/student/lessons")
                if (item.label === "Textbooks") navigate("/student/book-lesson")
                if (item.label === "Messages") navigate("/student/messages")
                if (item.label === "Settings") navigate("/student/account")
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px', cursor: 'pointer', fontSize: 14,
                fontWeight: 500, color: item.active ? '#0EA5A0' : '#64748B', 
                transition: 'all 0.15s',
                borderLeft: item.active ? '3px solid #0EA5A0' : '3px solid transparent'
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: '#0EA5A0',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 700
            }}>
              {(user?.user_metadata?.full_name || 'S').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Student</div>
            </div>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/login')
              }}
              style={{
                marginLeft: 'auto', background: 'transparent', border: '1px solid #E2E8F0',
                padding: '8px', borderRadius: 8, color: '#64748B', fontSize: 13, cursor: 'pointer'
              }}
            >
              🔒
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* HEADER */}
        <header style={{
          height: 64, background: 'white', borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none', padding: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              ☰
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Dashboard</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#64748B' }}>{getCurrentDate()}</span>
            <button style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>🔔</button>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: '#0EA5A0',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 14, fontWeight: 700
            }}>
              AJ
            </div>
          </div>
        </header>

        {/* MAIN SCROLL AREA */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          {/* WELCOME BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #0EA5A0, #0C8F8A)',
            borderRadius: 20, padding: '32px 40px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: 'white', marginBottom: 6 }}>
                {getTimeGreeting()}, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'} 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>
                You have {mockUpcomingLessons.length} upcoming lessons today. Keep up the streak!
              </p>
            </div>
            <button 
              onClick={() => navigate("/browse", { state: { filter: 'online' } })}
              style={{
                background: 'white', color: '#0EA5A0', padding: '12px 24px',
                borderRadius: 10, fontWeight: 700, fontSize: 15, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
              }}
            >
              ⚡ Start Instant Lesson
            </button>
          </div>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {/* Learning Streak */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 20,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#FEF3C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>🔥</div>
                <span style={{ fontSize: 13, color: '#64748B' }}>Day Streak</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{mockStudent.streak}</div>
              <div style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>+2 this week</div>
            </div>

            {/* Total Lessons */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 20,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#CCFBF1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>📚</div>
                <span style={{ fontSize: 13, color: '#64748B' }}>Total Lessons</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{mockStudent.totalLessons}</div>
              <div style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>↑ 3 this week</div>
            </div>

            {/* Learning Hours */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 20,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>⏱️</div>
                <span style={{ fontSize: 13, color: '#64748B' }}>Learning Time</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{mockStudent.totalHours}h</div>
              <div style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>↑ 1.5h</div>
            </div>

            {/* Avg Rating */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 20,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#FEF3C7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>⭐</div>
                <span style={{ fontSize: 13, color: '#64748B' }}>Avg Rating</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{mockStudent.avgRating}</div>
              <div style={{ fontSize: 12, color: '#10B981', fontWeight: 500 }}>From your reviews</div>
            </div>
          </div>

          {/* TWO COLUMN GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Upcoming Lessons */}
              <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Upcoming Lessons</h3>
                  <a href="#" style={{ color: '#0EA5A0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>View all →</a>
                </div>
                
                <div style={{textAlign:'center', padding:'32px', color:'#64748B'}}>
                  <div style={{fontSize:'36px', marginBottom:'12px'}}>📅</div>
                  <p style={{fontWeight:600, color:'#0F172A', marginBottom:'4px'}}>No upcoming lessons</p>
                  <p style={{fontSize:'13px'}}>Book a lesson to get started!</p>
                  <button onClick={() => navigate('/student/book-lesson')}
                    style={{marginTop:'16px', background:'#0EA5A0', color:'white',
                            border:'none', padding:'10px 24px', borderRadius:'8px',
                            cursor:'pointer', fontWeight:600, fontSize:'14px'}}>
                    Browse Teachers
                  </button>
                </div>
              </div>

              {/* Recent Lessons */}
              <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Recent Lessons</h3>
                  <a href="#" style={{ color: '#0EA5A0', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>View all →</a>
                </div>
                
                <div style={{textAlign:'center', padding:'32px', color:'#64748B'}}>
                  <div style={{fontSize:'36px', marginBottom:'12px'}}>📚</div>
                  <p style={{fontWeight:600, color:'#0F172A', marginBottom:'4px'}}>No recent lessons</p>
                  <p style={{fontSize:'13px'}}>Your lessons will appear here after you complete them</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* My Teachers */}
              <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>My Teachers</h3>
                
                <div style={{textAlign:'center', padding:'32px', color:'#64748B'}}>
                  <div style={{fontSize:'36px', marginBottom:'12px'}}>👥</div>
                  <p style={{fontWeight:600, color:'#0F172A', marginBottom:'4px'}}>No favorite teachers yet</p>
                  <p style={{fontSize:'13px'}}>Book lessons with teachers to add them here</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Quick Actions</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button style={{
                    padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0',
                    background: 'white', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>⚡</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      Instant Lesson
                    </div>
                  </button>
                  
                  <button style={{
                    padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0',
                    background: 'white', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📅</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      Schedule
                    </div>
                  </button>
                  
                  <button style={{
                    padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0',
                    background: 'white', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📚</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      Textbooks
                    </div>
                  </button>
                  
                  <button style={{
                    padding: 16, borderRadius: 12, border: '1.5px solid #E2E8F0',
                    background: 'white', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      Progress
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PROGRESS SECTION */}
          <div id="progress-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Weekly Activity */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>This Week</h3>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, marginTop: 16 }}>
                {Object.entries(mockWeeklyActivity).map(([day, count], index) => (
                  <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      background: count === 0 ? '#E2E8F0' : '#0EA5A0',
                      height: Math.max(count * 20, 4)
                    }}></div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{day}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B', marginTop: 16 }}>
                7 lessons · 3h 45min total
              </div>
            </div>

            {/* Level & Progress */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Your Level</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{
                  padding: '8px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  background: '#0EA5A0', color: 'white'
                }}>
                  B2 — Upper Intermediate
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748B' }}>Progress toward C1</span>
                  <span style={{ fontSize: 13, color: '#0F172A' }}>68%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 999, marginBottom: 16 }}>
                  <div style={{ height: '100%', width: '68%', background: '#0EA5A0', borderRadius: 999 }}></div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(mockSkills).map(([skill, percentage]) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#64748B', textTransform: 'capitalize' }}>{skill}</span>
                        <span style={{ fontSize: 13, color: '#0F172A' }}>{percentage}%</span>
                      </div>
                      <div style={{ width: '60%', height: 8, background: '#E2E8F0', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: '#0EA5A0', borderRadius: 999 }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* LESSON NOTES MODAL */}
      {selectedLessonNotes && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            background: 'white', borderRadius: 20, width: '90%', maxWidth: 560,
            maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  {selectedLessonNotes.topic}
                </h2>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  with {selectedLessonNotes.teacher} • {formatDate(selectedLessonNotes.date)}
                </p>
              </div>
              <button 
                onClick={closeLessonNotes}
                style={{
                  padding: 8, background: 'transparent', border: 'none',
                  color: '#64748B', cursor: 'pointer', fontSize: 16
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
              {['vocabulary', 'grammar', 'feedback', 'my-notes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid #0EA5A0' : '2px solid transparent',
                    color: activeTab === tab ? '#0EA5A0' : '#64748B'
                  }}
                >
                  {tab === 'vocabulary' && 'Vocabulary'}
                  {tab === 'grammar' && 'Grammar'}
                  {tab === 'feedback' && 'Feedback'}
                  {tab === 'my-notes' && 'My Notes'}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {activeTab === 'vocabulary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mockLessonNotes.vocabulary.map((vocab, index) => (
                    <div key={index} style={{
                      border: '1px solid #E2E8F0', borderRadius: 12, padding: 16
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>{vocab.word}</div>
                      <div style={{ color: '#64748B' }}>{vocab.definition}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'grammar' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {mockLessonNotes.grammarPoints.map((point, index) => (
                    <div key={index} style={{
                      border: '1px solid #E2E8F0', borderRadius: 12, padding: 16
                    }}>
                      <div style={{ color: '#0F172A' }}>{point}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div style={{
                  border: '1px solid #E2E8F0', borderRadius: 12, padding: 16
                }}>
                  <div style={{ color: '#0F172A' }}>{mockLessonNotes.teacherFeedback}</div>
                </div>
              )}

              {activeTab === 'my-notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    border: '1px solid #E2E8F0', borderRadius: 12, padding: 16
                  }}>
                    <div style={{ color: '#0F172A' }}>{mockLessonNotes.myNotes}</div>
                  </div>
                  <textarea 
                    value={mockLessonNotes.myNotes}
                    onChange={(e) => console.log('Notes updated:', e.target.value)}
                    style={{
                      width: '100%', border: '1px solid #E2E8F0', borderRadius: 12,
                      padding: 16, color: '#0F172A', fontSize: 14, resize: 'vertical'
                    }}
                    rows={6}
                    placeholder="Write your notes here..."
                  ></textarea>
                  <button style={{
                    padding: '12px 20px', background: '#0EA5A0', color: 'white',
                    borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}>
                    Save Notes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard