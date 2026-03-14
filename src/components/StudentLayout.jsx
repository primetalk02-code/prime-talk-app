import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const studentMenuItems = [
  { label: 'Dashboard', to: '/student/dashboard', icon: '🏠' },
  { label: 'Book Lesson', to: '/student/book-lesson', icon: '📚' },
  { label: 'Online Teachers', to: '/student/online-teachers', icon: '🌐' },
  { label: 'Reservations', to: '/student/reservations', icon: '📋' },
  { label: 'My Lessons', to: '/student/lessons', icon: '🎓' },
  { label: 'Reviews', to: '/student/reviews', icon: '⭐' },
  { label: 'Messages', to: '/student/messages', icon: '💬' },
  { label: 'Account', to: '/student/account', icon: '👤' },
]

const SIDEBAR_W = 260
const HEADER_H = 56

function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [studentName, setStudentName] = useState('Student')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  const todayLabel = useMemo(() =>
    new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }).format(new Date()), [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return }
      setStudentName(
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        'Student'
      )
    })
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    navigate('/login')
  }

  const sidebarVisible = !isMobile || sidebarOpen

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>

      {/* Sidebar overlay on mobile */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
          zIndex: 30
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: `${SIDEBAR_W}px`,
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column',
        zIndex: 40,
        transform: sidebarVisible ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
        transition: 'transform 0.3s ease',
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none',
      }}>
        {/* Logo */}
        <div style={{
          height: `${HEADER_H}px`, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px',
          borderBottom: '1px solid #E2E8F0'
        }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#0EA5A0',
              textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Prime Talk</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Student</p>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px'
            }}>✕</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          {studentMenuItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              marginBottom: '2px',
              background: isActive ? '#F0FDFC' : 'transparent',
              color: isActive ? '#0EA5A0' : '#475569',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid #E2E8F0' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 12px', borderRadius: '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600, color: '#EF4444',
          }}>
            <span>🚪</span><span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{
        marginLeft: isMobile ? 0 : `${SIDEBAR_W}px`,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.3s ease',
      }}>
        {/* Header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 20,
          height: `${HEADER_H}px`,
          background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{
                background: 'none', border: '1px solid #E2E8F0',
                borderRadius: '8px', padding: '6px 10px',
                cursor: 'pointer', fontSize: '16px', color: '#475569'
              }}>☰</button>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                Student Workspace
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{todayLabel}</p>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setProfileOpen(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: '1px solid #E2E8F0',
              borderRadius: '10px', padding: '6px 10px',
              cursor: 'pointer', fontSize: '13px', color: '#0F172A',
            }}>
              <span style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: '#F0FDFC', color: '#0EA5A0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '12px'
              }}>
                {studentName.charAt(0).toUpperCase()}
              </span>
              <span style={{ maxWidth: '100px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {studentName}
              </span>
              <span style={{ fontSize: '10px' }}>▼</span>
            </button>

            {profileOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '44px',
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                borderRadius: '12px', padding: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '160px', zIndex: 50
              }}>
                <button onClick={() => navigate('/student/account')} style={{
                  display: 'block', width: '100%', padding: '8px 12px',
                  textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '13px', color: '#0F172A',
                  borderRadius: '8px',
                }}>Account</button>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '8px 12px',
                  textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '13px', color: '#EF4444',
                  borderRadius: '8px',
                }}>Logout</button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default StudentLayout