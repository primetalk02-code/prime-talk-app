import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [totalLessons, setTotalLessons] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [latestLesson, setLatestLesson] = useState(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(true)
  const [isTextbooksOpen, setIsTextbooksOpen] = useState(true)
  const [isDailyNewsOpen, setIsDailyNewsOpen] = useState(false)
  const [isDailyConversationOpen, setIsDailyConversationOpen] = useState(false)
  const profileDropdownRef = useRef(null)

  const displayName = user?.user_metadata?.full_name || user?.email || 'My Account'
  const profileInitial = (displayName || 'U').trim().charAt(0).toUpperCase()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session) {
          navigate('/login')
          return
        }

        const {
          data: { user: authenticatedUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !authenticatedUser) {
          navigate('/login')
          return
        }

        setUser(authenticatedUser)

        const [lessonsResult, categoriesResult, latestLessonResult] = await Promise.all([
          supabase.from('textbooks').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase
            .from('textbooks')
            .select('id, title')
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        if (lessonsResult.error) {
          console.error('Lessons count error:', lessonsResult.error)
        }

        if (categoriesResult.error) {
          console.error('Categories count error:', categoriesResult.error)
        }

        if (latestLessonResult.error) {
          console.error('Latest lesson fetch error:', latestLessonResult.error)
        }

        setTotalLessons(lessonsResult.count || 0)
        setTotalCategories(categoriesResult.count || 0)
        setLatestLesson(latestLessonResult.data?.[0] || null)

      } catch (err) {
        console.error('Auth error:', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev)
  }

  const handleProfilePlaceholder = () => {
    setIsProfileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
      }

      localStorage.clear()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      navigate('/login')
    }
  }

  const handleViewTextbook = () => {
    navigate('/textbook')
  }

  const handleBrowseLessons = () => {
    navigate('/browse-lessons')
  }

  const handleJoinLiveClass = () => {
    const zoomLink = 'https://zoom.us/j/1234567890'
    window.open(zoomLink, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-heading">
          <h1>Dashboard</h1>
          <p className="user-email-header">{user?.email}</p>
        </div>

        <div className="profile-dropdown" ref={profileDropdownRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={toggleProfileMenu}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
          >
            <span className="profile-avatar">{profileInitial}</span>
            <span className="profile-name">{displayName}</span>
            <span className={`profile-caret ${isProfileMenuOpen ? 'open' : ''}`}>▾</span>
          </button>

          {isProfileMenuOpen && (
            <div className="profile-menu" role="menu" aria-label="User profile menu">
              <button
                type="button"
                className="profile-menu-item"
                onClick={handleProfilePlaceholder}
              >
                My Profile
              </button>
              <button
                type="button"
                className="profile-menu-item logout-item"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-body">
          <aside className="student-sidebar" aria-label="Student sidebar navigation">
            <h2 className="sidebar-title">Student Menu</h2>

            <div className="sidebar-section">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setIsAccountOpen((prev) => !prev)}
                aria-expanded={isAccountOpen}
              >
                <span>Account</span>
                <span className="sidebar-caret">{isAccountOpen ? '▾' : '▸'}</span>
              </button>

              {isAccountOpen && (
                <ul className="sidebar-submenu">
                  <li className="sidebar-submenu-item">Profile Information</li>
                  <li className="sidebar-submenu-item">Gmail: {user?.email || 'N/A'}</li>
                  <li className="sidebar-submenu-item">
                    User ID: {user?.id ? `${user.id.substring(0, 12)}...` : 'N/A'}
                  </li>
                </ul>
              )}
            </div>

            <div className="sidebar-section">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setIsTextbooksOpen((prev) => !prev)}
                aria-expanded={isTextbooksOpen}
              >
                <span>Textbooks</span>
                <span className="sidebar-caret">{isTextbooksOpen ? '▾' : '▸'}</span>
              </button>

              {isTextbooksOpen && (
                <ul className="sidebar-submenu">
                  <li>
                    <button
                      type="button"
                      className="sidebar-nested-toggle"
                      onClick={() => setIsDailyNewsOpen((prev) => !prev)}
                      aria-expanded={isDailyNewsOpen}
                    >
                      <span>Daily News</span>
                      <span className="sidebar-caret">{isDailyNewsOpen ? '▾' : '▸'}</span>
                    </button>

                    {isDailyNewsOpen && (
                      <ul className="sidebar-nested-list">
                        <li className="sidebar-submenu-item">Level 1</li>
                        <li className="sidebar-submenu-item">Level 2</li>
                        <li className="sidebar-submenu-item">Level 3</li>
                      </ul>
                    )}
                  </li>

                  <li>
                    <button
                      type="button"
                      className="sidebar-nested-toggle"
                      onClick={() => setIsDailyConversationOpen((prev) => !prev)}
                      aria-expanded={isDailyConversationOpen}
                    >
                      <span>Daily Conversation</span>
                      <span className="sidebar-caret">{isDailyConversationOpen ? '▾' : '▸'}</span>
                    </button>

                    {isDailyConversationOpen && (
                      <ul className="sidebar-nested-list">
                        <li className="sidebar-submenu-item">Level 1</li>
                        <li className="sidebar-submenu-item">Level 2</li>
                        <li className="sidebar-submenu-item">Level 3</li>
                      </ul>
                    )}
                  </li>
                </ul>
              )}
            </div>
          </aside>

          <div className="dashboard-main-column">
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Total Lessons</p>
                <h3 className="stat-value">{totalLessons}</h3>
                <p className="stat-note">Lessons available in your library</p>
              </div>

              <div className="stat-card">
                <p className="stat-label">Total Categories</p>
                <h3 className="stat-value">{totalCategories}</h3>
                <p className="stat-note">Categories you can explore</p>
              </div>

              <div className="stat-card">
                <p className="stat-label">Latest Lesson</p>
                <h3 className="stat-value latest-title">{latestLesson?.title || 'No lessons yet'}</h3>
                <p className="stat-note">Most recently created lesson</p>
              </div>

              <div className="stat-card">
                <p className="stat-label">Welcome</p>
                <h3 className="stat-value">{user?.user_metadata?.full_name || 'Student'}</h3>
                <p className="stat-note">{user?.email}</p>
              </div>
            </div>

            <section className="upcoming-lesson-section" aria-labelledby="upcoming-lesson-heading">
              <h2 id="upcoming-lesson-heading" className="upcoming-lesson-heading">
                Upcoming Lesson
              </h2>

              <div className="stat-card upcoming-lesson-card">
                <h3 className="stat-value">Live Class</h3>
                <p className="stat-note">Your next online session is ready to join.</p>
                <button type="button" className="join-zoom-button" onClick={handleJoinLiveClass}>
                  Join Zoom Class
                </button>
              </div>
            </section>

            <div className="actions-grid">
              <button className="action-card" onClick={handleViewTextbook}>
                <div className="action-icon">📚</div>
                <h3>View Textbook</h3>
                <p>Access learning materials</p>
              </button>

              <button className="action-card" onClick={handleJoinLiveClass}>
                <div className="action-icon">🎥</div>
                <h3>Join Live Class</h3>
                <p>Connect with your teacher</p>
              </button>

              <button className="action-card" onClick={handleBrowseLessons}>
                <div className="action-icon">🧭</div>
                <h3>Browse Lessons</h3>
                <p>Explore available topics</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
