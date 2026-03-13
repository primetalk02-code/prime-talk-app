import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MyLessons = () => {
  const [activeTab, setActiveTab] = useState('upcoming')

  // Mock data
  const mockUpcomingLessons = [
    { id: 1, teacher: "Sarah Kim", initials: "SK", color: "#0EA5A0", specialty: "Business English", datetime: "Today, 3:00 PM", duration: 25, status: "confirmed", timeUntil: "2h 14m" },
    { id: 2, teacher: "James Okafor", initials: "JO", color: "#0C8F8A", specialty: "IELTS Prep", datetime: "Tomorrow, 10:00 AM", duration: 25, status: "confirmed", timeUntil: "1d 5h 30m" },
    { id: 3, teacher: "Amina Rossi", initials: "AR", color: "#F59E0B", specialty: "Conversation", datetime: "Mar 15, 2025, 2:00 PM", duration: 25, status: "confirmed", timeUntil: "4d 3h 15m" }
  ]

  const mockPastLessons = [
    { id: 1, teacher: "Sarah Kim", initials: "SK", color: "#0EA5A0", date: "Mar 7, 2025", duration: 25, topic: "Business Email Writing", rating: 5, feedback: "Great lesson! Learned useful phrases for professional emails." },
    { id: 2, teacher: "Amina Rossi", initials: "AR", color: "#F59E0B", date: "Mar 5, 2025", duration: 25, topic: "Casual Conversation", rating: 5, feedback: "Fun and engaging conversation practice." },
    { id: 3, teacher: "James Okafor", initials: "JO", color: "#0C8F8A", date: "Mar 3, 2025", duration: 25, topic: "IELTS Reading Strategies", rating: 4, feedback: "Good strategies, but could go deeper into time management." },
    { id: 4, teacher: "Maria Garcia", initials: "MG", color: "#8B5CF6", date: "Mar 1, 2025", duration: 25, topic: "Pronunciation Practice", rating: 5, feedback: "Excellent pronunciation tips and exercises." }
  ]

  const mockRescheduledLessons = [
    { id: 1, teacher: "Tom Wilson", initials: "TW", color: "#EF4444", originalDate: "Mar 8, 2025", newDate: "Mar 12, 2025", reason: "Teacher unavailable" },
    { id: 2, teacher: "Lisa Chen", initials: "LC", color: "#10B981", originalDate: "Mar 6, 2025", newDate: "Mar 14, 2025", reason: "Student request" }
  ]

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', 
      background: '#F8FAFC', overflow: 'hidden' 
    }}>
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
            { icon: '🏠', label: 'Dashboard' },
            { icon: '🔍', label: 'Browse Teachers' },
            { icon: '📅', label: 'My Lessons', active: true },
            { icon: '📚', label: 'Textbooks' },
            { icon: '💬', label: 'Messages' },
            { icon: '⚙️', label: 'Settings' }
          ].map((item, index) => (
            <div
              key={index}
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
              AJ
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Alex Johnson</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>Student</div>
            </div>
            <button 
              onClick={() => navigate("/login")}
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>My Lessons</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
            {['upcoming', 'past', 'rescheduled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #0EA5A0' : '2px solid transparent',
                  color: activeTab === tab ? '#0EA5A0' : '#64748B'
                }}
              >
                {tab === 'upcoming' && 'Upcoming Lessons'}
                {tab === 'past' && 'Past Lessons'}
                {tab === 'rescheduled' && 'Rescheduled'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0' }}>
            {activeTab === 'upcoming' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Upcoming Lessons</h2>
                  <button style={{
                    padding: '12px 20px', background: '#0EA5A0', color: 'white',
                    borderRadius: 10, fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}>
                    Book New Lesson
                  </button>
                </div>
                
                {mockUpcomingLessons.map((lesson) => (
                  <div key={lesson.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                    borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: lesson.color,
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, flexShrink: 0
                    }}>
                      {lesson.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{lesson.teacher}</div>
                        <span style={{
                          fontSize: 12, padding: '2px 8px', borderRadius: 999,
                          background: '#F0FDFA', color: '#0EA5A0'
                        }}>
                          {lesson.specialty}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>{lesson.datetime} • {lesson.duration} min</div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>Starts in {lesson.timeUntil}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        padding: '8px 16px', background: '#0EA5A0', color: 'white',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                      }}>
                        Join
                      </button>
                      <button style={{
                        padding: '8px 16px', background: 'transparent', color: '#64748B',
                        borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13
                      }}>
                        Reschedule
                      </button>
                      <button style={{
                        padding: '8px 16px', background: 'transparent', color: '#64748B',
                        borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13
                      }}>
                        Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'past' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Past Lessons</h2>
                
                {mockPastLessons.map((lesson) => (
                  <div key={lesson.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: lesson.color,
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700
                      }}>
                        {lesson.initials}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>{lesson.teacher}</div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} style={{ color: i < lesson.rating ? '#F59E0B' : '#E2E8F0', fontSize: 12 }}>★</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>{formatDate(lesson.date)} • {lesson.duration} min</div>
                        <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 4 }}>{lesson.topic}</div>
                        <div style={{ fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
                          "{lesson.feedback}"
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        padding: '8px 16px', background: '#0EA5A0', color: 'white',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                      }}>
                        Book Again
                      </button>
                      <button style={{
                        padding: '8px 16px', background: 'transparent', color: '#64748B',
                        borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', fontSize: 13
                      }}>
                        View Notes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rescheduled' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Rescheduled Lessons</h2>
                
                {mockRescheduledLessons.map((lesson) => (
                  <div key={lesson.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                    borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12,
                    background: '#F8FAFC'
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: lesson.color,
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, flexShrink: 0
                    }}>
                      {lesson.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{lesson.teacher}</div>
                      <div style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>
                        <span style={{ textDecoration: 'line-through' }}>{formatDate(lesson.originalDate)}</span> → {formatDate(lesson.newDate)}
                      </div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>Reason: {lesson.reason}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{
                        padding: '8px 16px', background: '#0EA5A0', color: 'white',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13
                      }}>
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default MyLessons