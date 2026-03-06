import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabaseClient'

function pickTeacherName(profile, teacherId = '') {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.username ||
    profile?.email?.split('@')?.[0] ||
    `Teacher ${String(teacherId).slice(0, 6)}`
  )
}

function StudentReviews() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetLessonId = searchParams.get('lessonId') || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState('')
  const [lessons, setLessons] = useState([])
  const [reviews, setReviews] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [selectedLessonId, setSelectedLessonId] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const loadData = useCallback(async (silent = false) => {
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

      const [lessonsResult, reviewsResult] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, teacher_id, status, created_at')
          .eq('student_id', user.id)
          .in('status', ['finished', 'completed', 'active'])
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('lesson_reviews')
          .select('id, lesson_id, teacher_id, rating, comment, created_at')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
      ])

      if (lessonsResult.error) throw lessonsResult.error
      if (reviewsResult.error) throw reviewsResult.error

      const nextLessons = lessonsResult.data || []
      const nextReviews = reviewsResult.data || []
      setLessons(nextLessons)
      setReviews(nextReviews)

      const teacherIds = Array.from(
        new Set([...nextLessons.map((item) => item.teacher_id), ...nextReviews.map((item) => item.teacher_id)]),
      ).filter(Boolean)

      if (teacherIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', teacherIds)

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

      const hasPresetLesson = presetLessonId && nextLessons.some((lesson) => lesson.id === presetLessonId)
      setSelectedLessonId((current) => {
        if (hasPresetLesson) {
          return presetLessonId
        }
        if (nextLessons.some((lesson) => lesson.id === current)) {
          return current
        }
        return nextLessons[0]?.id || ''
      })
    } catch (loadError) {
      setError(loadError.message)
      setLessons([])
      setReviews([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate, presetLessonId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const lessonLookup = useMemo(() => {
    const lookup = {}
    for (const lesson of lessons) {
      lookup[lesson.id] = lesson
    }
    return lookup
  }, [lessons])

  const reviewByLessonId = useMemo(() => {
    const lookup = {}
    for (const review of reviews) {
      lookup[review.lesson_id] = review
    }
    return lookup
  }, [reviews])

  useEffect(() => {
    const existingReview = reviewByLessonId[selectedLessonId]
    if (existingReview) {
      setRating(existingReview.rating || 5)
      setComment(existingReview.comment || '')
    } else {
      setRating(5)
      setComment('')
    }
  }, [reviewByLessonId, selectedLessonId])

  const handleSubmitReview = async (event) => {
    event.preventDefault()
    if (!userId || !selectedLessonId || saving) {
      return
    }

    const lesson = lessonLookup[selectedLessonId]
    if (!lesson?.teacher_id) {
      setError('Selected lesson is not eligible for review.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const payload = {
        lesson_id: selectedLessonId,
        teacher_id: lesson.teacher_id,
        student_id: userId,
        rating: Number(rating),
        comment: comment.trim() || null,
      }

      const { error: upsertError } = await supabase.from('lesson_reviews').upsert(payload, {
        onConflict: 'lesson_id,student_id',
      })

      if (upsertError) {
        throw upsertError
      }

      setSuccess('Review saved.')
      await loadData(true)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Rate your lessons and share feedback for each teacher.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadData(true)} disabled={loading || refreshing}>
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

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading reviews...
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No finished lesson available for review yet.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="space-y-2">
                <label htmlFor="review-lesson" className="text-sm font-semibold text-slate-700">
                  Lesson
                </label>
                <select
                  id="review-lesson"
                  value={selectedLessonId}
                  onChange={(event) => setSelectedLessonId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  required
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {new Date(lesson.created_at).toLocaleDateString('en-US')} -{' '}
                      {pickTeacherName(profilesById[lesson.teacher_id], lesson.teacher_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="review-rating" className="text-sm font-semibold text-slate-700">
                  Rating
                </label>
                <select
                  id="review-rating"
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="review-comment" className="text-sm font-semibold text-slate-700">
                  Comment
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  placeholder="Share what went well and what can improve."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || !selectedLessonId}>
                  {saving ? 'Saving...' : reviewByLessonId[selectedLessonId] ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/student/lessons')}>
                  Back to Lessons
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Your Recent Reviews</p>
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                No submitted reviews yet.
              </div>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {pickTeacherName(profilesById[review.teacher_id], review.teacher_id)}
                    </p>
                    <Badge variant="info">{review.rating}/5</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.comment || 'No comment provided.'}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleString('en-US')}
                  </p>
                </article>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default StudentReviews
