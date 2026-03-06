import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, MessageIcon, SlidersIcon, TrendIcon } from '../components/layoutIcons'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabaseClient'
import { findJoinableLessonForStudent } from '../lib/lessonSessions'

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return 'TBD'
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function StudentDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookedLessons, setBookedLessons] = useState(0)
  const [upcomingLessons, setUpcomingLessons] = useState(0)
  const [messageCount, setMessageCount] = useState(0)
  const [hasPreferences, setHasPreferences] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [joiningLesson, setJoiningLesson] = useState(false)
  const [joinMessage, setJoinMessage] = useState('')
  const [recentReservations, setRecentReservations] = useState([])
  const [lessonHistory, setLessonHistory] = useState([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
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

      setCurrentUserId(user.id)

      const todayYmd = new Date().toISOString().slice(0, 10)

      const [allLessonsResult, upcomingLessonsResult, reservationsResult, historyResult, preferencesResult] = await Promise.all([
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id),
        supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .gte('lesson_date', todayYmd),
        supabase
          .from('reservations')
          .select('id, teacher_id, lesson_date, lesson_time')
          .eq('student_id', user.id)
          .order('lesson_date', { ascending: true })
          .order('lesson_time', { ascending: true })
          .limit(6),
        supabase
          .from('lessons')
          .select('id, teacher_id, status, created_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('student_preferences')
          .select('student_id')
          .eq('student_id', user.id)
          .maybeSingle(),
      ])

      if (allLessonsResult.error) {
        throw allLessonsResult.error
      }

      if (upcomingLessonsResult.error) {
        throw upcomingLessonsResult.error
      }

      if (reservationsResult.error) {
        throw reservationsResult.error
      }

      if (historyResult.error) {
        throw historyResult.error
      }
      if (preferencesResult.error) {
        throw preferencesResult.error
      }

      setBookedLessons(allLessonsResult.count || 0)
      setUpcomingLessons(upcomingLessonsResult.count || 0)
      setRecentReservations(reservationsResult.data || [])
      setLessonHistory(historyResult.data || [])
      setMessageCount(0)
      setHasPreferences(Boolean(preferencesResult.data))
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const handleJoinLesson = useCallback(async () => {
    if (!currentUserId || joiningLesson) {
      return
    }

    try {
      setJoiningLesson(true)
      setJoinMessage('')

      const lesson = await findJoinableLessonForStudent(currentUserId)

      if (!lesson?.id) {
        setJoinMessage('No active lesson yet')
        return
      }

      navigate(`/lesson/${lesson.id}`)
    } catch (joinError) {
      setJoinMessage(joinError.message)
    } finally {
      setJoiningLesson(false)
    }
  }, [currentUserId, joiningLesson, navigate])

  const cards = useMemo(() => {
    return [
      {
        label: 'Reservations',
        value: String(bookedLessons),
        helper: 'Total booked sessions',
        icon: CalendarIcon,
        accent: 'bg-sky-100 text-sky-700',
      },
      {
        label: 'Upcoming',
        value: String(upcomingLessons),
        helper: 'From today onward',
        icon: TrendIcon,
        accent: 'bg-indigo-100 text-indigo-700',
      },
      {
        label: 'Messages',
        value: String(messageCount),
        helper: 'Unread and archived chat',
        icon: MessageIcon,
        accent: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Preferences',
        value: hasPreferences ? 'Saved' : 'Not set',
        helper: 'Learning profile status',
        icon: SlidersIcon,
        accent: 'bg-violet-100 text-violet-700',
      },
    ]
  }, [bookedLessons, hasPreferences, messageCount, upcomingLessons])

  return (
    <section className="space-y-6">
      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-white">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="info">Student Workspace</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Modern Learning Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Start sudden lessons quickly, track reservations, and stay consistent.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/student/online-teachers')}>Start Sudden Lesson</Button>
            <Button variant="outline" onClick={() => navigate('/student/book-lesson')}>
              Browse Teachers
            </Button>
            <Button variant="secondary" onClick={() => navigate('/student/lessons')}>
              Lesson History
            </Button>
            <Button variant="ghost" onClick={() => void handleJoinLesson()} disabled={loading || joiningLesson}>
              {joiningLesson ? 'Checking...' : 'Join Active Lesson'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {joinMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-card">
          {joinMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex min-h-[180px] items-center justify-center p-6">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading dashboard...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <Card key={card.label} className="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{card.label}</p>
                      </div>
                      <span className={`inline-flex rounded-xl p-2 ${card.accent}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{card.helper}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reservations</CardTitle>
                <CardDescription>Upcoming sessions from your booking queue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentReservations.length === 0 ? (
                  <p className="text-sm text-slate-500">No reservations yet.</p>
                ) : (
                  recentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDateLabel(reservation.lesson_date)} {reservation.lesson_time || ''}
                        </p>
                        <p className="text-xs text-slate-500">Teacher: {String(reservation.teacher_id).slice(0, 8)}</p>
                      </div>
                      <Badge variant="info">Reserved</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lesson History</CardTitle>
                <CardDescription>Recent lesson requests and completion states.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessonHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">No lesson history yet.</p>
                ) : (
                  lessonHistory.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Lesson #{String(lesson.id).slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">Teacher: {String(lesson.teacher_id).slice(0, 8)}</p>
                      </div>
                      <Badge
                        variant={lesson.status === 'active' ? 'success' : lesson.status === 'declined' ? 'destructive' : 'secondary'}
                      >
                        {lesson.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  )
}

export default StudentDashboard
