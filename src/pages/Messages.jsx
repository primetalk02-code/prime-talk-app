import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Messages = () => {
  const [activeTab, setActiveTab] = useState('inbox')

  // Mock data
  const mockConversations = [
    { id: 1, name: "Sarah Kim", initials: "SK", color: "#0EA5A0", lastMessage: "Hi Alex! How was your lesson today?", time: "2 min ago", unread: 2 },
    { id: 2, name: "James Okafor", initials: "JO", color: "#0C8F8A", lastMessage: "Let's schedule our next lesson for...", time: "1 hour ago", unread: 0 },
    { id: 3, name: "Amina Rossi", initials: "AR", color: "#F59E0B", lastMessage: "Thanks for the great conversation today!", time: "3 hours ago", unread: 1 },
    { id: 4, name: "Maria Garcia", initials: "MG", color: "#8B5CF6", lastMessage: "I'm available tomorrow afternoon if...", time: "1 day ago", unread: 0 },
    { id: 5, name: "Tom Wilson", initials: "TW", color: "#EF4444", lastMessage: "Can we move our lesson to next week?", time: "2 days ago", unread: 0 }
  ]

  const mockMessages = [
    { id: 1, sender: 'teacher', text: "Hi Alex! How was your lesson today?", time: "10:30 AM" },
    { id: 2, sender: 'student', text: "It was great! I learned a lot about business vocabulary.", time: "10:32 AM" },
    { id: 3, sender: 'teacher', text: "That's wonderful to hear! Keep practicing those new words.", time: "10:35 AM" },
    { id: 4, sender: 'teacher', text: "By the way, I have some additional exercises if you'd like.", time: "10:40 AM" }
  ]

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
            { icon: '📅', label: 'My Lessons' },
            { icon: '📚', label: 'Textbooks' },
            { icon: '💬', label: 'Messages', active: true },
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Messages</h1>
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
            {['inbox', 'sent', 'archived'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 16px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #0EA5A0' : '2px solid transparent',
                  color: activeTab === tab ? '#0EA5A0' : '#64748B'
                }}
              >
                {tab === 'inbox' && 'Inbox'}
                {tab === 'sent' && 'Sent'}
                {tab === 'archived' && 'Archived'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
            {/* Conversations list */}
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #E2E8F0',
              height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column'
            }}>
              {/* Search */}
              <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0' }}>
                <input 
                  placeholder="Search conversations..."
                  style={{
                    width: '100%', padding: '12px', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A'
                  }}
                />
              </div>

              {/* Conversations */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {mockConversations.map((conv) => (
                  <div key={conv.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                    borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: conv.color,
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700
                    }}>
                      {conv.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{conv.name}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage}
                      </div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>{conv.time}</div>
                    </div>
                    {conv.unread > 0 && (
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: '#0EA5A0',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600
                      }}>
                        {conv.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat area */}
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #E2E8F0',
              height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column'
            }}>
              {/* Chat header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#0EA5A0',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700
                }}>
                  SK
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Sarah Kim</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Online</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button style={{
                    padding: '8px 12px', background: 'transparent', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontSize: 13, cursor: 'pointer'
                  }}>
                    📞
                  </button>
                  <button style={{
                    padding: '8px 12px', background: 'transparent', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontSize: 13, cursor: 'pointer'
                  }}>
                    📹
                  </button>
                  <button style={{
                    padding: '8px 12px', background: 'transparent', border: '1px solid #E2E8F0',
                    borderRadius: 8, fontSize: 13, cursor: 'pointer'
                  }}>
                    ⋮
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                {mockMessages.map((msg) => (
                  <div key={msg.id} style={{
                    marginBottom: 16, display: 'flex', justifyContent: msg.sender === 'student' ? 'flex-end' : 'flex-start'
                  }}>
                    {msg.sender === 'teacher' && (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#0EA5A0',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, marginRight: 12
                      }}>
                        SK
                      </div>
                    )}
                    <div style={{
                      maxWidth: '70%', padding: '12px 16px', borderRadius: 12,
                      background: msg.sender === 'student' ? '#0EA5A0' : '#F8FAFC',
                      color: msg.sender === 'student' ? 'white' : '#0F172A'
                    }}>
                      <div style={{ fontSize: 14 }}>{msg.text}</div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4, textAlign: msg.sender === 'student' ? 'right' : 'left' }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: '12px 16px', border: '1px solid #E2E8F0',
                      borderRadius: 24, fontSize: 14, color: '#0F172A'
                    }}
                  />
                  <button style={{
                    padding: '12px 20px', background: '#0EA5A0', color: 'white',
                    borderRadius: 24, fontWeight: 600, border: 'none', cursor: 'pointer'
                  }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Messages