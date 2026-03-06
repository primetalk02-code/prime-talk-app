import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabaseClient'

function pickTeacherName(teacher) {
  return (
    teacher.full_name ||
    teacher.display_name ||
    teacher.name ||
    teacher.username ||
    teacher.email ||
    'Teacher'
  )
}

function StudentReservations() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState('')
  const [teachers, setTeachers] = useState([])
  const [reservations, setReservations] = useState([])
  const [teacherId, setTeacherId] = useState('')
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [lessonTime, setLessonTime] = useState('09:00')

  const loadReservations = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      setSuccess('')

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

      setUserId(user.id)

      const [teachersResult, reservationsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'teacher')
          .order('full_name', { ascending: true }),
        supabase
          .from('reservations')
          .select('id, teacher_id, lesson_date, lesson_time')
          .eq('student_id', user.id)
          .order('lesson_date', { ascending: true })
          .order('lesson_time', { ascending: true })
          .limit(200),
      ])

      if (teachersResult.error) throw teachersResult.error
      if (reservationsResult.error) throw reservationsResult.error

      const teacherList = teachersResult.data || []
      setTeachers(teacherList)
      setReservations(reservationsResult.data || [])
      setTeacherId((current) => {
        if (teacherList.length === 0) {
          return ''
        }
        if (teacherList.some((teacher) => teacher.id === current)) {
          return current
        }
        return teacherList[0].id
      })
    } catch (loadError) {
      setError(loadError.message)
      setTeachers([])
      setReservations([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  const teacherNameById = useMemo(() => {
    const map = {}
    for (const teacher of teachers) {
      map[teacher.id] = pickTeacherName(teacher)
    }
    return map
  }, [teachers])

  const handleCreateReservation = async (event) => {
    event.preventDefault()

    if (!userId || !teacherId || !lessonDate || !lessonTime || saving) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const normalizedTime = lessonTime.length === 5 ? `${lessonTime}:00` : lessonTime

      const { error: insertError } = await supabase.from('reservations').insert({
        student_id: userId,
        teacher_id: teacherId,
        lesson_date: lessonDate,
        lesson_time: normalizedTime,
      })

      if (insertError) {
        throw insertError
      }

      setSuccess('Reservation created.')
      await loadReservations(true)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reservations</CardTitle>
            <CardDescription>Book upcoming sessions and enter scheduled lesson rooms.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadReservations(true)} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleCreateReservation} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="reservation-teacher" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Teacher
              </label>
              <select
                id="reservation-teacher"
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                disabled={saving || teachers.length === 0}
                required
              >
                {teachers.length === 0 ? (
                  <option value="">No teacher available</option>
                ) : (
                  teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {pickTeacherName(teacher)}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label htmlFor="reservation-date" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Date
              </label>
              <Input
                id="reservation-date"
                type="date"
                value={lessonDate}
                onChange={(event) => setLessonDate(event.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                disabled={saving}
                required
              />
            </div>
            <div>
              <label htmlFor="reservation-time" className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                Time
              </label>
              <Input
                id="reservation-time"
                type="time"
                value={lessonTime}
                onChange={(event) => setLessonTime(event.target.value)}
                step="1800"
                disabled={saving}
                required
              />
            </div>
            <div className="md:col-span-4 flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || !teacherId}>
                {saving ? 'Booking...' : 'Create Reservation'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/student/book-lesson')}>
                Open Lesson Browser
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading reservations...
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No reservations yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <article
                  key={reservation.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {reservation.lesson_date} {String(reservation.lesson_time || '').slice(0, 5)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Teacher: {teacherNameById[reservation.teacher_id] || String(reservation.teacher_id).slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/lesson-room/${reservation.id}`)}>
                      Enter Room
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/student/messages')}>
                      Message Teacher
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

export default StudentReservations
