import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabaseClient'

const LESSON_RATE_USD = 5

function TeacherEarnings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('30d')
  const [lessons, setLessons] = useState([])

  const loadEarnings = useCallback(async (silent = false) => {
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

      const { data, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, student_id, status, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500)

      if (lessonsError) {
        throw lessonsError
      }

      setLessons(data || [])
    } catch (loadError) {
      setError(loadError.message)
      setLessons([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadEarnings()
  }, [loadEarnings])

  const finishedLessons = useMemo(() => {
    return lessons.filter((lesson) => ['finished', 'completed'].includes(String(lesson.status)))
  }, [lessons])

  const periodFilteredLessons = useMemo(() => {
    if (period === 'all') {
      return finishedLessons
    }

    const days = period === '7d' ? 7 : 30
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - days)

    return finishedLessons.filter((lesson) => new Date(lesson.created_at) >= threshold)
  }, [finishedLessons, period])

  const monthlyBreakdown = useMemo(() => {
    const monthMap = new Map()

    for (const lesson of finishedLessons) {
      const date = new Date(lesson.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const current = monthMap.get(key) || { key, label, count: 0 }
      current.count += 1
      monthMap.set(key, current)
    }

    return Array.from(monthMap.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6)
  }, [finishedLessons])

  const totalLessons = periodFilteredLessons.length
  const totalEarnings = totalLessons * LESSON_RATE_USD

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Earnings</CardTitle>
            <CardDescription>Track lesson-based earnings and recent payout trends.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadEarnings(true)} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: 'all', label: 'All time' },
            ].map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={period === option.value ? 'default' : 'outline'}
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading earnings...
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase text-slate-500">Completed Lessons</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{totalLessons}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase text-slate-500">Estimated Earnings</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">${totalEarnings.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase text-slate-500">Rate per Lesson</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">${LESSON_RATE_USD.toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Monthly Breakdown</p>
                {monthlyBreakdown.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">No completed lessons yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {monthlyBreakdown.map((month) => (
                      <div
                        key={month.key}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-slate-700">{month.label}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {month.count} lessons · ${(month.count * LESSON_RATE_USD).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default TeacherEarnings
