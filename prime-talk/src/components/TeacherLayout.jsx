import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  CloseIcon,
  DashboardIcon,
  EarningsIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  StarIcon,
  UserIcon,
} from './layoutIcons'

const teacherMenuItems = [
  { label: 'Dashboard', to: '/teacher/dashboard', icon: DashboardIcon },
  { label: 'Reservations', to: '/teacher/reservations', icon: CalendarIcon },
  { label: 'Schedule', to: '/teacher/schedule', icon: ClockIcon },
  { label: 'Lesson History', to: '/teacher/history', icon: ClockIcon },
  { label: 'Earnings', to: '/teacher/earnings', icon: EarningsIcon },
  { label: 'Reviews', to: '/teacher/reviews', icon: StarIcon },
  { label: 'Messages', to: '/teacher/messages', icon: MessageIcon },
  { label: 'Account', to: '/teacher/account', icon: UserIcon },
]

function TeacherLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teacherName, setTeacherName] = useState('Teacher')

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadTeacher = async () => {
      try {
        setError('')
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          navigate('/login', { replace: true })
          return
        }

        if (isMounted) {
          setTeacherName(
            user.user_metadata?.full_name ||
              user.email?.split('@')?.[0] ||
              user.email ||
              'Teacher',
          )
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTeacher()

    return () => {
      isMounted = false
    }
  }, [navigate])

  useEffect(() => {
    setSidebarOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      setError('')
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        throw signOutError
      }

      localStorage.clear()

      navigate('/login', { replace: true })
    } catch (signOutFailure) {
      setError(signOutFailure.message)
    }
  }

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200/80 bg-white/95 text-slate-700 shadow-soft backdrop-blur transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Prime Talk</p>
            <p className="text-lg font-bold text-slate-900">Teacher</p>
          </div>

          <button
            type="button"
            className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {teacherMenuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <LogoutIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close menu overlay"
        />
      )}

      <div className="flex min-h-screen flex-col lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-900">Teacher Workspace</p>
              <p className="text-xs text-slate-500">{todayLabel}</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {loading ? (
                <>
                  <span className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {(teacherName || 'T').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{teacherName}</span>
                </>
              )}
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card">
                <button
                  type="button"
                  onClick={() => navigate('/teacher/account')}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  Account
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout
