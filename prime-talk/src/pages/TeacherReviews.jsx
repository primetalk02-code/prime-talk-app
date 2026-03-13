import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
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

function TeacherReviews() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [ratingFilter, setRatingFilter] = useState('all')

  const loadReviews = useCallback(async (silent = false) => {
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

      const { data, error: reviewsError } = await supabase
        .from('lesson_reviews')
        .select('id, lesson_id, student_id, rating, comment, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(300)

      if (reviewsError) {
        throw reviewsError
      }

      const nextReviews = data || []
      setReviews(nextReviews)

      const studentIds = Array.from(new Set(nextReviews.map((item) => item.student_id))).filter(Boolean)
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
      setReviews([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const filteredReviews = useMemo(() => {
    if (ratingFilter === 'all') {
      return reviews
    }
    return reviews.filter((review) => String(review.rating) === ratingFilter)
  }, [ratingFilter, reviews])

  const metrics = useMemo(() => {
    if (reviews.length === 0) {
      return { average: 0, total: 0, fiveStar: 0 }
    }

    const total = reviews.length
    const sum = reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0)
    const fiveStar = reviews.filter((review) => Number(review.rating) === 5).length

    return {
      average: sum / total,
      total,
      fiveStar,
    }
  }, [reviews])

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Monitor student ratings and feedback over time.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadReviews(true)} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Average Rating</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.average.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">Total Reviews</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.total}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase text-slate-500">5-Star Reviews</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.fiveStar}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', '5', '4', '3', '2', '1'].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={ratingFilter === value ? 'default' : 'outline'}
                onClick={() => setRatingFilter(value)}
              >
                {value === 'all' ? 'All' : `${value} stars`}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading reviews...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No reviews found for this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {pickStudentName(profilesById[review.student_id], review.student_id)}
                    </p>
                    <Badge variant="info">{review.rating}/5</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{review.comment || 'No comment provided.'}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleString('en-US')}
                  </p>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default TeacherReviews
