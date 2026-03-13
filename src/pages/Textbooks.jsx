import { useNavigate } from 'react-router-dom'

const Textbooks = () => {
  const navigate = useNavigate()

  const books = [
    { emoji: '📗', title: 'Business English Essentials', level: 'B2' },
    { emoji: '📘', title: 'IELTS Writing Guide', level: 'C1' },
    { emoji: '📙', title: 'Everyday Conversation', level: 'A2' },
    { emoji: '📕', title: 'Grammar Fundamentals', level: 'B1' },
    { emoji: '📔', title: 'Pronunciation Masterclass', level: 'B2' },
    { emoji: '📒', title: 'Academic Vocabulary', level: 'C1' }
  ]

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
            { icon: '🏠', label: 'Dashboard', active: false },
            { icon: '🔍', label: 'Browse Teachers' },
            { icon: '📅', label: 'My Lessons' },
            { icon: '📚', label: 'Textbooks' },
            { icon: '💬', label: 'Messages' },
            { icon: '⚙️', label: 'Settings' }
          ].map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.label === "Dashboard") navigate("/student/dashboard")
                if (item.label === "Browse Teachers") navigate("/browse")
                if (item.label === "My Lessons") navigate("/lessons")
                if (item.label === "Textbooks") navigate("/textbooks")
                if (item.label === "Messages") navigate("/messages")
                if (item.label === "Settings") navigate("/settings")
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>Textbooks 📚</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {books.map((book, index) => (
              <div key={index} style={{
                background: 'white', borderRadius: 16, padding: 24,
                border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: 16, cursor: 'pointer'
              }}
              onClick={() => navigate('/lesson')}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 64, marginBottom: 8 }}>{book.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                    {book.title}
                  </div>
                  <span style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 999,
                    background: '#E0F2F1', color: '#00695C'
                  }}>
                    {book.level}
                  </span>
                </div>
                <button style={{
                  marginTop: 'auto', padding: '12px', background: '#0EA5A0', color: 'white',
                  borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                  Open Textbook
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Textbooks