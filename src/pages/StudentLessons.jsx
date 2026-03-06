import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabaseClient'

function StudentLessons() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingLessonId, setUpdatingLessonId] = useState('')
  const [error, setError] = useState('')
  const [lessons, setLessons] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  const loadLessons = useCallback(async (silent = false) => {
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

      setUserId(user.id)

      const { data, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, teacher_id, status, source, room_url, room_name, duration, textbook, created_at, started_at, ended_at')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)

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
    void loadLessons()
  }, [loadLessons])

  const filteredLessons = useMemo(() => {
    if (statusFilter === 'all') {
      return lessons
    }
    return lessons.filter((lesson) => lesson.status === statusFilter)
  }, [lessons, statusFilter])

  const handleMarkFinished = async (lessonId) => {
    if (!lessonId || updatingLessonId) {
      return
    }

    try {
      setUpdatingLessonId(lessonId)
      setError('')

      const { error: updateError } = await supabase
        .from('lessons')
        .update({ status: 'finished', ended_at: new Date().toISOString() })
        .eq('id', lessonId)
        .eq('student_id', userId)

      if (updateError) {
        throw updateError
      }

      await loadLessons(true)
    } catch (updateFailure) {
      setError(updateFailure.message)
    } finally {
      setUpdatingLessonId('')
    }
  }

  const renderStatusBadge = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'active') {
      return <Badge variant="success">active</Badge>
    }
    if (normalized === 'declined') {
      return <Badge variant="destructive">declined</Badge>
    }
    if (normalized === 'finished' || normalized === 'completed') {
      return <Badge variant="secondary">{normalized}</Badge>
    }
    return <Badge variant="warning">{normalized || 'unknown'}</Badge>
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lesson History</CardTitle>
            <CardDescription>Track sudden and reserved lessons, then rejoin active rooms.</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => void loadLessons(true)} disabled={loading || refreshing}>
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
            {['all', 'waiting', 'active', 'finished', 'declined'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading lessons...
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No lessons found for this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => {
                const canJoin = ['waiting', 'active'].includes(lesson.status) && Boolean(lesson.room_url)
                const canFinish = lesson.status === 'active'
                return (
                  <article
                    key={lesson.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-card"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Lesson #{String(lesson.id).slice(0, 8)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Teacher: {String(lesson.teacher_id).slice(0, 8)} | Source: {lesson.source}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Duration: {lesson.duration ? `${lesson.duration} min` : 'N/A'} | Textbook:{' '}
                          {lesson.textbook || 'Daily Conversation'}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Started:{' '}
                          {lesson.started_at
                            ? new Date(lesson.started_at).toLocaleString('en-US')
                            : new Date(lesson.created_at).toLocaleString('en-US')}
                        </p>
                        {lesson.ended_at && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Ended: {new Date(lesson.ended_at).toLocaleString('en-US')}
                          </p>
                        )}
                      </div>
                      {renderStatusBadge(lesson.status)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/lesson/${lesson.id}`)}
                        disabled={!canJoin}
                      >
                        Join Lesson
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleMarkFinished(lesson.id)}
                        disabled={!canFinish || updatingLessonId === lesson.id}
                      >
                        {updatingLessonId === lesson.id ? 'Updating...' : 'Mark Finished'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/student/reviews?lessonId=${lesson.id}`)}
                      >
                        Write Review
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default StudentLessons

