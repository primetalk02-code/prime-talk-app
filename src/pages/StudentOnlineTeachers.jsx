import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { supabase } from '../lib/supabaseClient'
import { createSuddenLesson } from '../api/lessons/createSuddenLesson'
import { getOnlineTeachers } from '../lib/presence'
import { createDailyRoom, createDailyToken, getDailyRoomUrl } from '../lib/daily'
import DurationSelector from '../components/DurationSelector'

const SUDDEN_LESSON_REQUEST_TIMEOUT_MS = 30000

const DURATION_OPTIONS = [5, 10, 25]
const TEXTBOOK_OPTIONS = [
  'Daily Conversation',
  'Business English',
  'IELTS Speaking',
  'Travel English',
  'Grammar Focus',
]
const LESSON_TIME_OPTIONS = [
  { value: 'now', label: 'Now' },
  { value: 'scheduled', label: 'Scheduled' },
]

function isMissingPreferenceColumnsError(error) {
  const details = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return (
    details.includes('student_preferences') &&
    (details.includes('preferred_teacher_type') || details.includes('preferred_lesson_time')) &&
    (details.includes('does not exist') || details.includes('schema cache') || details.includes('column'))
  )
}

function getCurrentDay() {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentTime() {
  return new Date().toTimeString().slice(0, 5)
}

function toTimeWithSeconds(value) {
  if (/^\d{2}:\d{2}$/.test(value || '')) {
    return `${value}:00`
  }
  return value || `${getCurrentTime()}:00`
}

function pickTeacherName(teacher) {
  if (teacher.full_name) {
    return teacher.full_name
  }

  const shortId = String(teacher.id || '').slice(0, 8)
  return shortId ? `Teacher ${shortId}` : 'Teacher'
}

function pickTeacherPhoto(teacher) {
  return teacher.photo_url || teacher.avatar_url || teacher.profile_image_url || ''
}

function StudentOnlineTeachers() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teachers, setTeachers] = useState([])
  const [isMatching, setIsMatching] = useState(false)
  const [matchMessage, setMatchMessage] = useState('')
  const [countdownSeconds, setCountdownSeconds] = useState(0)
  const [lessonDuration, setLessonDuration] = useState(10)
  const [textbook, setTextbook] = useState('Daily Conversation')
  const [preferredLessonMode, setPreferredLessonMode] = useState('now')
  const [preferredLessonDate, setPreferredLessonDate] = useState(getCurrentDay())
  const [preferredLessonClock, setPreferredLessonClock] = useState(getCurrentTime())
  const [savingPreference, setSavingPreference] = useState(false)

  const requestTimeoutSeconds = useMemo(
    () => Math.ceil(SUDDEN_LESSON_REQUEST_TIMEOUT_MS / 1000),
    [],
  )

  const getPreferredWindow = useCallback(() => {
    if (preferredLessonMode === 'scheduled') {
      return {
        day: preferredLessonDate || getCurrentDay(),
        time: toTimeWithSeconds(preferredLessonClock || getCurrentTime()),
      }
    }

    return {
      day: getCurrentDay(),
      time: toTimeWithSeconds(getCurrentTime()),
    }
  }, [preferredLessonClock, preferredLessonDate, preferredLessonMode])

  const loadTeacherPool = useCallback(
    async (windowOverride = null) => {
      const preferredWindow = windowOverride || getPreferredWindow()

      const teacherData = await findAvailableSuddenLessonTeachers({
        preferredLessonDay: preferredWindow.day,
        preferredLessonTime: preferredWindow.time,
        limit: 30,
      })

      setTeachers(teacherData || [])
    },
    [getPreferredWindow],
  )

  const loadOnlineTeachers = useCallback(async () => {
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

      setCurrentUser(user)

      // Get online teachers using presence API
      const teachersResult = await getOnlineTeachers()
      if (teachersResult.success) {
        setTeachers(teachersResult.teachers)
      } else {
        setError(teachersResult.error)
        setTeachers([])
      }

      // Load preferences
      const primaryPreferencesResult = await supabase
        .from('student_preferences')
        .select('lesson_duration, textbook, preferred_lesson_time')
        .eq('student_id', user.id)
        .maybeSingle()

      let preferencesData = primaryPreferencesResult.data
      let preferencesError = primaryPreferencesResult.error

      if (preferencesError && isMissingPreferenceColumnsError(preferencesError)) {
        const fallbackPreferencesResult = await supabase
          .from('student_preferences')
          .select('lesson_duration, textbook')
          .eq('student_id', user.id)
          .maybeSingle()

        preferencesData = fallbackPreferencesResult.data
        preferencesError = fallbackPreferencesResult.error
      }

      if (preferencesError) {
        throw preferencesError
      }

      const dbDuration = Number(preferencesData?.lesson_duration)
      const nextDuration = DURATION_OPTIONS.includes(dbDuration) ? dbDuration : 10
      const nextTextbook = preferencesData?.textbook || 'Daily Conversation'
      const nextMode = preferencesData?.preferred_lesson_time === 'scheduled' ? 'scheduled' : 'now'

      setLessonDuration(nextDuration)
      setTextbook(nextTextbook)
      setPreferredLessonMode(nextMode)

    } catch (loadError) {
      setError(loadError.message)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadOnlineTeachers()
  }, [loadOnlineTeachers])

  const saveQuickPreferences = useCallback(async () => {
    if (!currentUser || savingPreference) {
      return
    }

    try {
      setSavingPreference(true)

      const primaryUpsert = await supabase.from('student_preferences').upsert(
        {
          student_id: currentUser.id,
          lesson_duration: lessonDuration,
          textbook,
          preferred_teacher_type: 'any',
          preferred_lesson_time: preferredLessonMode || 'now',
        },
        {
          onConflict: 'student_id',
        },
      )

      let upsertError = primaryUpsert.error

      if (upsertError && isMissingPreferenceColumnsError(upsertError)) {
        const fallbackUpsert = await supabase.from('student_preferences').upsert(
          {
            student_id: currentUser.id,
            lesson_duration: lessonDuration,
            textbook,
          },
          {
            onConflict: 'student_id',
          },
        )

        upsertError = fallbackUpsert.error
      }

      if (upsertError) {
        throw upsertError
      }
    } finally {
      setSavingPreference(false)
    }
  }, [currentUser, lessonDuration, preferredLessonMode, savingPreference, textbook])

  const handleRequestTeacher = async (teacher) => {
    if (!currentUser || isMatching) return
    setIsMatching(true)
    setError('')
    setMatchMessage(`Connecting to ${teacher.full_name || 'teacher'}...`)
    try {
      // 1. Create lesson record
      const { data: lesson, error: insertError } = await supabase
        .from('lessons')
        .insert({
          teacher_id: teacher.id,
          student_id: currentUser.id,
          duration: lessonDuration,
          textbook: textbook,
          status: 'waiting',
          source: 'sudden',
        })
        .select('id')
        .single()
      if (insertError) throw insertError

      // 2. Create Daily room
      const roomName = `lesson-${lesson.id}`
      let roomUrl = getDailyRoomUrl(roomName)
      try {
        const room = await createDailyRoom(lesson.id)
        roomUrl = room.url || getDailyRoomUrl(roomName)
      } catch (roomErr) {
        console.warn('Room creation failed, using default URL:', roomErr)
      }

      // 3. Generate student token
      let studentToken = null
      try {
        studentToken = await createDailyToken(roomName, currentUser.id, false)
      } catch (tokenErr) {
        console.warn('Token creation failed:', tokenErr)
      }

      // 4. Update lesson with room info
      await supabase
        .from('lessons')
        .update({
          room_name: roomName,
          room_url: roomUrl,
          student_token: studentToken,
        })
        .eq('id', lesson.id)

      setMatchMessage('Waiting for teacher to accept...')

      // 5. Poll for teacher acceptance (30 second timeout)
      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('status, room_url, student_token')
          .eq('id', lesson.id)
          .single()

        if (lessonData?.status === 'active') {
          clearInterval(pollInterval)
          // Go to lesson room
          window.location.href = `/lesson/${lesson.id}`
        } else if (lessonData?.status === 'declined' || attempts >= maxAttempts) {
          clearInterval(pollInterval)
          // Auto-cancel if timeout
          if (attempts >= maxAttempts) {
            await supabase
              .from('lessons')
              .update({ status: 'declined' })
              .eq('id', lesson.id)
            setMatchMessage('Teacher did not respond. Please try another teacher.')
          } else {
            setMatchMessage('Teacher unavailable. Please try another.')
          }
          setIsMatching(false)
        }
      }, 1000)

    } catch (e) {
      setError(e.message)
      setIsMatching(false)
    }
  }

  const handleRefreshTeachers = async () => {
    try {
      setError('')
      await loadTeacherPool()
    } catch (refreshError) {
      setError(refreshError.message)
      setTeachers([])
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">⚡ Instant Lesson</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Pick a teacher and start a lesson right now
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefreshTeachers()}
          disabled={loading}
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </header>

      <div className="space-y-4 glass border-0 shadow-xl p-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <DurationSelector
            value={lessonDuration}
            onChange={setLessonDuration}
            disabled={isMatching}
            options={DURATION_OPTIONS}
          />

          <div>
            <label htmlFor="textbook-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Textbook
            </label>
            <select
              id="textbook-select"
              value={textbook}
              onChange={(event) => setTextbook(event.target.value)}
              disabled={isMatching}
              className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-3 text-sm text-slate-700 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-cyan-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-cyan-900"
            >
              {TEXTBOOK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Preferred Time</p>
            <div className="flex flex-wrap gap-2">
              {LESSON_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreferredLessonMode(option.value)}
                  disabled={isMatching}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 shadow hover:scale-105 focus:ring-2 focus:ring-sky-400 dark:focus:ring-cyan-400 ${
                    preferredLessonMode === option.value
                      ? 'border-sky-500 bg-sky-50 dark:bg-cyan-900/40 text-sky-700 dark:text-cyan-200 shadow-md animate-pulse'
                      : 'border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {preferredLessonMode === 'scheduled' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="preferred-day" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Preferred Day
              </label>
              <input
                id="preferred-day"
                type="date"
                min={getCurrentDay()}
                value={preferredLessonDate}
                disabled={isMatching}
                onChange={(event) => setPreferredLessonDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-3 text-sm text-slate-700 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-cyan-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-cyan-900"
              />
            </div>
            <div>
              <label htmlFor="preferred-clock" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                Preferred Time
              </label>
              <input
                id="preferred-clock"
                type="time"
                value={preferredLessonClock}
                disabled={isMatching}
                onChange={(event) => setPreferredLessonClock(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-3 text-sm text-slate-700 dark:text-white outline-none transition focus:border-sky-400 dark:focus:border-cyan-400 focus:ring-2 focus:ring-sky-100 dark:focus:ring-cyan-900"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleRefreshTeachers()}
            disabled={loading}
            className="h-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh Teachers
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {matchMessage && <p className="text-sm font-medium text-slate-600 dark:text-slate-200">{matchMessage}</p>}
        {isMatching && countdownSeconds > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/40 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:text-amber-200 animate-pulse">
            Waiting for teacher: {countdownSeconds}s
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-200 animate-fade-up">
          {error}
        </div>
      )}

      {isMatching && (
        <div style={{position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)',
                     background:'#0F172A', color:'white', padding:'16px 24px',
                     borderRadius:'12px', fontSize:'14px', fontWeight:600,
                     boxShadow:'0 8px 24px rgba(0,0,0,0.3)', zIndex:999}}>
          ⏳ {matchMessage || 'Waiting for teacher to accept...'}
          <button onClick={() => { setIsMatching(false); setMatchMessage('') }}
            style={{marginLeft:'16px', background:'rgba(255,255,255,0.1)', border:'none',
                    color:'white', padding:'4px 10px', borderRadius:'6px', cursor:'pointer'}}>
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-sky-200 bg-white dark:bg-slate-900 shadow-card">
          <div className="inline-flex items-center gap-2 rounded-xl bg-sky-100 dark:bg-cyan-900/40 px-4 py-2 text-sm font-semibold text-sky-700 dark:text-cyan-200">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700 dark:border-cyan-700 dark:border-t-cyan-200" />
            <span>Loading available teachers...</span>
          </div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-300 shadow-card">
          No teachers are available for the selected time.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => {
            const teacherName = pickTeacherName(teacher)
            const teacherPhoto = pickTeacherPhoto(teacher)
            return (
              <article
                key={teacher.id}
                className="glass border-0 shadow-card p-5 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center gap-3">
                  {teacherPhoto ? (
                    <img
                      src={teacherPhoto}
                      alt={teacherName}
                      className="h-14 w-14 rounded-full border border-slate-200 dark:border-slate-700 object-cover shadow"
                    />
                  ) : (
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 dark:bg-cyan-900 text-lg font-bold text-sky-700 dark:text-cyan-200 shadow">
                      {(teacherName || 'T').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{teacherName}</p>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]" title="Online" />
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">AVAILABLE</span>
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleRequestTeacher(teacher)}
                    disabled={isMatching}
                    className="flex-1 rounded-xl bg-gradient-to-r from-sky-400 to-cyan-400 text-white font-bold px-4 py-2 text-sm shadow-md hover:from-sky-500 hover:to-cyan-500 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isMatching ? '⏳ Waiting for teacher...' : '⚡ Join Now'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default StudentOnlineTeachers
