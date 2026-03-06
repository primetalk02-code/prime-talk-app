import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabaseClient'

function pickStudentName(profile, studentId = '') {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.username ||
    profile?.email?.split('@')?.[0] ||
    `Student ${String(studentId).slice(0, 6)}`
  )
}

function TeacherReservations() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState([])
  const [profilesById, setProfilesById] = useState({})

  const loadReservations = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
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

      const { data, error: reservationError } = await supabase
        .from('reservations')
        .select('id, student_id, lesson_date, lesson_time')
        .eq('teacher_id', user.id)
        .order('lesson_date', { ascending: true })
        .order('lesson_time', { ascending: true })
        .limit(300)

      if (reservationError) {
        throw reservationError
      }

      const nextReservations = data || []
      setReservations(nextReservations)

      const studentIds = Array.from(new Set(nextReservations.map((item) => item.student_id))).filter(Boolean)
      if (studentIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', studentIds)

        if (profilesError) {
          throw profilesError
        }

        const lookup = {}
        for (const profile of profiles || []) {
          lookup[profile.id] = profile
        }
        setProfilesById(lookup)
      } else {
        setProfilesById({})
      }
    } catch (loadError) {
      setError(loadError.message)
      setReservations([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const upcomingReservations = useMemo(
    () => reservations.filter((reservation) => reservation.lesson_date >= todayIso),
    [reservations, todayIso],
  )

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reservations</CardTitle>
            <CardDescription>Review upcoming bookings and enter reserved lesson rooms.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadReservations(true)} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading reservations...
            </div>
          ) : upcomingReservations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No upcoming reservations.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {reservation.lesson_date} {String(reservation.lesson_time || '').slice(0, 5)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Student:{' '}
                      {pickStudentName(profilesById[reservation.student_id], reservation.student_id)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/lesson-room/${reservation.id}`)}>
                      Enter Room
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/teacher/messages')}>
                      Message Student
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default TeacherReservations
