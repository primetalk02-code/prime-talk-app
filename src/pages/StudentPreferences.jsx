import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Switch } from '../components/ui/switch'
import DurationSelector from '../components/DurationSelector'
import { supabase } from '../lib/supabaseClient'

const DURATION_OPTIONS = [5, 10, 25]
const TEXTBOOK_OPTIONS = [
  'Daily Conversation',
  'Business English',
  'IELTS Speaking',
  'Travel English',
  'Grammar Focus',
]
const TEACHER_TYPE_OPTIONS = [
  { value: 'any', label: 'No preference' },
  { value: 'General English', label: 'General English' },
  { value: 'Business English', label: 'Business English' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'Conversation', label: 'Conversation' },
  { value: 'Grammar', label: 'Grammar' },
]
const LESSON_TIME_OPTIONS = [
  { value: 'now', label: 'Now (instant matching)' },
  { value: 'scheduled', label: 'Scheduled (book later)' },
]

const DEFAULT_PREFERENCES = {
  need_self_intro: false,
  correct_mistakes: true,
  lesson_style: 'mixed',
  lesson_duration: 10,
  textbook: 'Daily Conversation',
  preferred_teacher_type: 'any',
  preferred_lesson_time: 'now',
}

function isMissingPreferenceColumnsError(error) {
  const details = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase()
  return (
    details.includes('student_preferences') &&
    (details.includes('preferred_teacher_type') || details.includes('preferred_lesson_time')) &&
    (details.includes('does not exist') || details.includes('schema cache') || details.includes('column'))
  )
}

function StudentPreferences() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
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

      const primaryResult = await supabase
        .from('student_preferences')
        .select(
          'need_self_intro, correct_mistakes, lesson_style, lesson_duration, textbook, preferred_teacher_type, preferred_lesson_time',
        )
        .eq('student_id', user.id)
        .maybeSingle()

      let data = primaryResult.data
      let fetchError = primaryResult.error

      if (fetchError && isMissingPreferenceColumnsError(fetchError)) {
        const fallbackResult = await supabase
          .from('student_preferences')
          .select('need_self_intro, correct_mistakes, lesson_style, lesson_duration, textbook')
          .eq('student_id', user.id)
          .maybeSingle()

        data = fallbackResult.data
        fetchError = fallbackResult.error
      }

      if (fetchError) {
        throw fetchError
      }

      const duration = Number(data?.lesson_duration)
      const normalizedPreferredTeacherType = String(data?.preferred_teacher_type || '').trim()
      const preferredLessonTime =
        data?.preferred_lesson_time === 'scheduled' ? 'scheduled' : DEFAULT_PREFERENCES.preferred_lesson_time

      setPreferences({
        need_self_intro: Boolean(data?.need_self_intro ?? DEFAULT_PREFERENCES.need_self_intro),
        correct_mistakes: Boolean(data?.correct_mistakes ?? DEFAULT_PREFERENCES.correct_mistakes),
        lesson_style: data?.lesson_style || DEFAULT_PREFERENCES.lesson_style,
        lesson_duration: DURATION_OPTIONS.includes(duration)
          ? duration
          : DEFAULT_PREFERENCES.lesson_duration,
        textbook: data?.textbook || DEFAULT_PREFERENCES.textbook,
        preferred_teacher_type:
          normalizedPreferredTeacherType || DEFAULT_PREFERENCES.preferred_teacher_type,
        preferred_lesson_time: preferredLessonTime,
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  const handleSave = async () => {
    if (!userId || saving) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        student_id: userId,
        need_self_intro: preferences.need_self_intro,
        correct_mistakes: preferences.correct_mistakes,
        lesson_style: preferences.lesson_style,
        lesson_duration: preferences.lesson_duration,
        textbook: preferences.textbook || null,
        preferred_teacher_type: preferences.preferred_teacher_type || 'any',
        preferred_lesson_time: preferences.preferred_lesson_time || 'now',
      }

      const primaryUpsert = await supabase.from('student_preferences').upsert(payload, {
        onConflict: 'student_id',
      })

      let upsertError = primaryUpsert.error

      if (upsertError && isMissingPreferenceColumnsError(upsertError)) {
        const fallbackUpsert = await supabase.from('student_preferences').upsert(
          {
            student_id: userId,
            need_self_intro: preferences.need_self_intro,
            correct_mistakes: preferences.correct_mistakes,
            lesson_style: preferences.lesson_style,
            lesson_duration: preferences.lesson_duration,
            textbook: preferences.textbook || null,
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

      setSuccess('Preferences saved.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES)
    setSuccess('')
    setError('')
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Student Preferences</CardTitle>
            <CardDescription>
              Set lesson duration, teacher type, and lesson time preference before starting class.
            </CardDescription>
          </div>
          <Button variant="secondary" onClick={() => navigate('/student/online-teachers')}>
            Start Lesson
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading preferences...
            </div>
          ) : (
            <div className="space-y-5">
              <DurationSelector
                value={preferences.lesson_duration}
                onChange={(option) =>
                  setPreferences((current) => ({
                    ...current,
                    lesson_duration: option,
                  }))
                }
                options={DURATION_OPTIONS}
              />

              <div className="space-y-2">
                <label htmlFor="preferred-teacher-type" className="text-sm font-semibold text-slate-700">
                  Preferred Teacher Type (Optional)
                </label>
                <select
                  id="preferred-teacher-type"
                  value={preferences.preferred_teacher_type}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      preferred_teacher_type: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {TEACHER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Preferred Lesson Time</p>
                <div className="flex flex-wrap gap-2">
                  {LESSON_TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setPreferences((current) => ({
                          ...current,
                          preferred_lesson_time: option.value,
                        }))
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        preferences.preferred_lesson_time === option.value
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="preferred-textbook" className="text-sm font-semibold text-slate-700">
                  Preferred Textbook
                </label>
                <select
                  id="preferred-textbook"
                  value={preferences.textbook}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      textbook: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {TEXTBOOK_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Need Self Introduction</p>
                    <p className="text-xs text-slate-500">Ask teachers to start with a short introduction.</p>
                  </div>
                  <Switch
                    checked={preferences.need_self_intro}
                    onCheckedChange={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        need_self_intro: value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Correct Mistakes</p>
                    <p className="text-xs text-slate-500">Allow live grammar and pronunciation correction.</p>
                  </div>
                  <Switch
                    checked={preferences.correct_mistakes}
                    onCheckedChange={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        correct_mistakes: value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lesson-style" className="text-sm font-semibold text-slate-700">
                  Preferred Lesson Style
                </label>
                <select
                  id="lesson-style"
                  value={preferences.lesson_style}
                  onChange={(event) =>
                    setPreferences((current) => ({
                      ...current,
                      lesson_style: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  <option value="conversation">Conversation-focused</option>
                  <option value="grammar">Grammar-focused</option>
                  <option value="mixed">Balanced mix</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={saving}>
                  Reset
                </Button>
                <Button variant="secondary" onClick={() => void loadPreferences()} disabled={saving}>
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default StudentPreferences
