import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LESSON_ACTIVE_STATUS,
  SUDDEN_LESSON_REQUEST_TIMEOUT_MS,
  createPendingLessonRequest,
  findAvailableSuddenLessonTeachers,
  waitForLessonDecision,
} from '../lib/lessonSessions'
import { supabase } from '../lib/supabaseClient'
import DurationSelector from '../components/DurationSelector'

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

      const preferredWindow =
        nextMode === 'scheduled'
          ? { day: getCurrentDay(), time: toTimeWithSeconds(getCurrentTime()) }
          : { day: getCurrentDay(), time: toTimeWithSeconds(getCurrentTime()) }

      await loadTeacherPool(preferredWindow)
    } catch (loadError) {
      setError(loadError.message)
      setTeachers([])
    } finally {
      setLoading(false)
    }
  }, [loadTeacherPool, navigate])

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

  const handleStartSuddenLesson = async () => {
    if (!currentUser || isMatching) {
      return
    }

    try {
      setError('')
      setIsMatching(true)
      setMatchMessage('Searching for available teachers...')

      await saveQuickPreferences()

      const preferredWindow = getPreferredWindow()

      const { data: lockResult, error: lockError } = await supabase.rpc('acquire_sudden_matching_lock')

      if (lockError) {
        throw lockError
      }

      const lockAcquired = Boolean(lockResult)

      if (!lockAcquired) {
        setMatchMessage('Another matching request is running. Please wait and try again.')
        return
      }

      const triedTeacherIds = new Set()
      let matchedLessonId = ''

      while (true) {
        const availableTeachers = await findAvailableSuddenLessonTeachers({
          preferredLessonDay: preferredWindow.day,
          preferredLessonTime: preferredWindow.time,
          limit: 30,
        })
        const teacher = availableTeachers.find((candidate) => !triedTeacherIds.has(candidate.id))

        if (!teacher) {
          break
        }

        triedTeacherIds.add(teacher.id)
        const teacherName = pickTeacherName(teacher)
        setMatchMessage(`Sending request to ${teacherName}...`)
        setCountdownSeconds(requestTimeoutSeconds)

        try {
          const lesson = await createPendingLessonRequest({
            teacherId: teacher.id,
            studentId: currentUser.id,
            duration: lessonDuration,
            textbook,
            source: 'sudden',
          })

          const decision = await waitForLessonDecision(lesson.id, SUDDEN_LESSON_REQUEST_TIMEOUT_MS, {
            onTick: (remaining) => {
              setCountdownSeconds(remaining)
            },
          })

          if (decision === LESSON_ACTIVE_STATUS) {
            matchedLessonId = lesson.id
            break
          }

          setMatchMessage(`${teacherName} did not accept. Trying next teacher...`)
          setCountdownSeconds(0)
        } catch (matchError) {
          console.error('Failed sudden lesson request for teacher:', teacher.id, matchError)
          setMatchMessage(`Could not request ${teacherName}. Trying next teacher...`)
        }
      }

      setCountdownSeconds(0)

      if (matchedLessonId) {
        await supabase.rpc('release_sudden_matching_lock').catch(() => {})
        window.location.href = `/lesson/${matchedLessonId}`
        return
      }

      setMatchMessage('No teachers available at that time. Please adjust your preference and try again.')
    } catch (startError) {
      setError(startError.message)
    } finally {
      try {
        await supabase.rpc('release_sudden_matching_lock')
      } catch {
        // ignore release errors
      }
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Find Teacher</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick duration and preferred lesson time, then start matching.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefreshTeachers()}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh
        </button>
      </header>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid gap-4 lg:grid-cols-3">
          <DurationSelector
            value={lessonDuration}
            onChange={setLessonDuration}
            disabled={isMatching}
            options={DURATION_OPTIONS}
          />

          <div>
            <label htmlFor="textbook-select" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Textbook
            </label>
            <select
              id="textbook-select"
              value={textbook}
              onChange={(event) => setTextbook(event.target.value)}
              disabled={isMatching}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              {TEXTBOOK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preferred Time</p>
            <div className="flex flex-wrap gap-2">
              {LESSON_TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPreferredLessonMode(option.value)}
                  disabled={isMatching}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    preferredLessonMode === option.value
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
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
              <label htmlFor="preferred-day" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Preferred Day
              </label>
              <input
                id="preferred-day"
                type="date"
                min={getCurrentDay()}
                value={preferredLessonDate}
                disabled={isMatching}
                onChange={(event) => setPreferredLessonDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label htmlFor="preferred-clock" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Preferred Time
              </label>
              <input
                id="preferred-clock"
                type="time"
                value={preferredLessonClock}
                disabled={isMatching}
                onChange={(event) => setPreferredLessonClock(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => void handleStartSuddenLesson()}
            disabled={loading || isMatching || !currentUser || savingPreference}
            className="h-11 rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMatching ? 'Matching Teacher...' : 'Start Lesson'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {matchMessage && <p className="text-sm font-medium text-slate-600">{matchMessage}</p>}
        {isMatching && countdownSeconds > 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            Waiting for teacher: {countdownSeconds}s
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-sky-200 bg-white shadow-card">
          <div className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-700">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" />
            <span>Loading available teachers...</span>
          </div>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-card">
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
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
              >
                <div className="flex items-center gap-3">
                  {teacherPhoto ? (
                    <img
                      src={teacherPhoto}
                      alt={teacherName}
                      className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-lg font-bold text-sky-700">
                      {(teacherName || 'T').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-slate-900">{teacherName}</p>
                    <p className="text-xs font-semibold text-emerald-600">AVAILABLE</p>
                  </div>
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
