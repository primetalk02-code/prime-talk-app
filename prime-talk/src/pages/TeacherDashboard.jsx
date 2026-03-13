import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  LESSON_PENDING_STATUS,
  SUDDEN_LESSON_REQUEST_TIMEOUT_MS,
  activateLessonWithRoom,
  declineLessonRequest,
} from '../lib/lessonSessions'
import { supabase } from '../lib/supabaseClient'

const REQUEST_TIMEOUT_SECONDS = Math.ceil(SUDDEN_LESSON_REQUEST_TIMEOUT_MS / 1000)
const alarm = new Audio('/sounds/incoming.wav')
alarm.loop = true

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'offline', label: 'Offline' },
]

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function playAlarm() {
  alarm.currentTime = 0
  alarm.play().catch(() => {
    console.log('Audio playback was blocked until user interaction.')
  })
}

function stopAlarm() {
  alarm.pause()
  alarm.currentTime = 0
}

function TeacherDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teacherName, setTeacherName] = useState('Teacher')
  const [availabilityDay, setAvailabilityDay] = useState(todayYmd())
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('23:00')
  const [status, setStatus] = useState('offline')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [lessonHistory, setLessonHistory] = useState([])
  const [incomingLesson, setIncomingLesson] = useState(null)
  const [handlingRequest, setHandlingRequest] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(REQUEST_TIMEOUT_SECONDS)

  const timeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  const clearIncomingAlertTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const loadDashboard = useCallback(async () => {
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

      const fallbackName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')?.[0] ||
        user.email ||
        'Teacher'

      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUserError) {
        throw existingUserError
      }

      if (!existingUser) {
        const { error: insertUserError } = await supabase.from('users').insert({
          id: user.id,
          name: fallbackName,
          role: 'teacher',
        })

        if (insertUserError) {
          throw insertUserError
        }

        setTeacherName(fallbackName)
      } else {
        if (existingUser.role !== 'teacher') {
          throw new Error('This account is not configured as teacher.')
        }

        setTeacherName(existingUser.name || fallbackName)
      }

      setTeacherId(user.id)

      const [availabilityResult, historyResult] = await Promise.all([
        supabase
          .from('teacher_availability')
          .select('day, start_time, end_time')
          .eq('teacher_id', user.id)
          .eq('day', availabilityDay)
          .maybeSingle(),
        supabase
          .from('lessons')
          .select('id, student_id, duration, textbook, status, created_at')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      if (availabilityResult.error) {
        throw availabilityResult.error
      }
      if (historyResult.error) {
        throw historyResult.error
      }

      const slot = availabilityResult.data
      if (slot) {
        setStatus('available')
        setStartTime(String(slot.start_time || '08:00').slice(0, 5))
        setEndTime(String(slot.end_time || '23:00').slice(0, 5))
      }

      setLessonHistory(historyResult.data || [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [availabilityDay, navigate])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const setAvailabilityStatus = async (nextStatus) => {
    if (!teacherId || updatingStatus) {
      return
    }

    try {
      setUpdatingStatus(true)
      setError('')
      setStatus(nextStatus)

      if (nextStatus === 'available') {
        const normalizedStart = /^\d{2}:\d{2}$/.test(startTime) ? `${startTime}:00` : '08:00:00'
        const normalizedEnd = /^\d{2}:\d{2}$/.test(endTime) ? `${endTime}:00` : '23:00:00'

        if (normalizedStart >= normalizedEnd) {
          throw new Error('End time must be later than start time.')
        }

        const { error: upsertError } = await supabase.from('teacher_availability').upsert(
          {
            teacher_id: teacherId,
            day: availabilityDay,
            start_time: normalizedStart,
            end_time: normalizedEnd,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'teacher_id,day',
          },
        )

        if (upsertError) {
          throw upsertError
        }
      } else {
        const { error: deleteError } = await supabase
          .from('teacher_availability')
          .delete()
          .eq('teacher_id', teacherId)
          .eq('day', availabilityDay)

        if (deleteError) {
          throw deleteError
        }
      }
    } catch (statusError) {
      setError(statusError.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDeclineLesson = useCallback(
    async (lessonId) => {
      if (!lessonId) {
        return
      }

      stopAlarm()
      clearIncomingAlertTimers()

      try {
        await declineLessonRequest(lessonId)
        setIncomingLesson(null)
        setHandlingRequest(false)
        await loadDashboard()
      } catch (declineError) {
        setError(declineError.message)
      }
    },
    [clearIncomingAlertTimers, loadDashboard],
  )

  const showIncomingLessonPopup = useCallback(
    (lesson) => {
      if (!lesson?.id) {
        return
      }

      clearIncomingAlertTimers()
      setIncomingLesson(lesson)
      setCountdownSeconds(REQUEST_TIMEOUT_SECONDS)
      playAlarm()

      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds((value) => (value > 0 ? value - 1 : 0))
      }, 1000)

      timeoutRef.current = setTimeout(() => {
        void handleDeclineLesson(lesson.id)
      }, SUDDEN_LESSON_REQUEST_TIMEOUT_MS)
    },
    [clearIncomingAlertTimers, handleDeclineLesson],
  )

  useEffect(() => {
    if (!teacherId) {
      return
    }

    const channel = supabase
      .channel(`teacher-lesson-alert-${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lessons',
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          const lesson = payload.new
          if (!lesson || lesson.status !== LESSON_PENDING_STATUS) {
            return
          }

          if (incomingLesson?.id && incomingLesson.id !== lesson.id) {
            return
          }

          void (async () => {
            let studentName = `Student ${String(lesson.student_id).slice(0, 6)}`

            try {
              const { data: studentUser } = await supabase
                .from('users')
                .select('name')
                .eq('id', lesson.student_id)
                .maybeSingle()

              if (studentUser?.name) {
                studentName = studentUser.name
              }
            } catch (nameError) {
              console.error('Failed to load student name:', nameError)
            }

            showIncomingLessonPopup({
              ...lesson,
              student_name: studentName,
            })
          })()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearIncomingAlertTimers()
      stopAlarm()
    }
  }, [teacherId, clearIncomingAlertTimers, incomingLesson?.id, showIncomingLessonPopup])

  const handleAcceptLesson = async () => {
    if (!incomingLesson?.id || handlingRequest) {
      return
    }

    try {
      setHandlingRequest(true)
      setError('')
      stopAlarm()
      clearIncomingAlertTimers()

      const lesson = await activateLessonWithRoom({ lessonId: incomingLesson.id })
      setIncomingLesson(null)
      await loadDashboard()
      window.location.href = `/lesson/${lesson.id}`
    } catch (acceptError) {
      setError(acceptError.message)
    } finally {
      setHandlingRequest(false)
    }
  }

  return (
    <section className="space-y-6">
      <Card className="border-slate-200 bg-white">
        <CardContent className="space-y-4 p-6">
          <div>
            <Badge variant="info">Teacher Dashboard</Badge>
            <h1 className="mt-2 text-2xl font-black text-slate-900">Welcome, {teacherName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Set availability, watch incoming requests, and join lessons.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Day</label>
              <input
                type="date"
                value={availabilityDay}
                min={todayYmd()}
                onChange={(event) => setAvailabilityDay(event.target.value)}
                disabled={loading || updatingStatus}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                disabled={loading || updatingStatus}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                disabled={loading || updatingStatus}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => void setAvailabilityStatus(option.value)}
                disabled={loading || updatingStatus}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  status === option.value
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {option.label}
              </button>
            ))}
            <Badge variant={status === 'available' ? 'success' : status === 'busy' ? 'warning' : 'secondary'}>
              {updatingStatus ? 'Saving...' : status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Lessons</CardTitle>
          <CardDescription>Incoming and completed lesson records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-slate-500">Loading dashboard...</div>
          ) : lessonHistory.length === 0 ? (
            <div className="text-sm text-slate-500">No lesson history yet.</div>
          ) : (
            lessonHistory.map((lesson) => (
              <div key={lesson.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">
                  {lesson.duration || 10} min - {lesson.textbook || 'Daily Conversation'}
                </p>
                <p className="text-xs text-slate-500">
                  Student: {String(lesson.student_id).slice(0, 8)} | Status: {lesson.status}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {incomingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md animate-pulse rounded-2xl border-2 border-rose-300 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-rose-700">Incoming Lesson Request</h2>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {incomingLesson.student_name || 'Student'} is waiting
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Duration: {incomingLesson.duration || 10} min | Textbook: {incomingLesson.textbook || 'Daily Conversation'}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void handleAcceptLesson()}
                disabled={handlingRequest}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {handlingRequest ? 'Please wait...' : `Accept (${countdownSeconds})`}
              </button>
              <button
                type="button"
                onClick={() => void handleDeclineLesson(incomingLesson.id)}
                disabled={handlingRequest}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default TeacherDashboard
