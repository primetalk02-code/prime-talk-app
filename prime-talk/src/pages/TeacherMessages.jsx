import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabaseClient'

function pickStudentName(profile, fallbackId = '') {
  return (
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    profile?.username ||
    profile?.email?.split('@')?.[0] ||
    `Student ${String(fallbackId).slice(0, 6)}`
  )
}

function TeacherMessages() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [conversations, setConversations] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [thread, setThread] = useState([])
  const [messageText, setMessageText] = useState('')

  const hydrateProfiles = useCallback(async (ids) => {
    if (!ids.length) {
      setProfilesById({})
      return
    }

    const { data, error: profileError } = await supabase.from('profiles').select('*').in('id', ids)

    if (profileError) {
      throw profileError
    }

    const lookup = {}
    for (const profile of data || []) {
      lookup[profile.id] = profile
    }
    setProfilesById(lookup)
  }, [])

  const loadThread = useCallback(async (teacherUserId, studentUserId) => {
    if (!teacherUserId || !studentUserId) {
      setThread([])
      return
    }

    const { data, error: threadError } = await supabase
      .from('messages')
      .select('id, teacher_id, student_id, content, created_at')
      .eq('teacher_id', teacherUserId)
      .eq('student_id', studentUserId)
      .order('created_at', { ascending: true })
      .limit(200)

    if (threadError) {
      throw threadError
    }

    setThread(data || [])
  }, [])

  const loadMessageContext = useCallback(async () => {
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

      setTeacherId(user.id)

      const [messagesResult, reservationsResult, lessonsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('id, student_id, content, created_at')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('reservations')
          .select('student_id, lesson_date, lesson_time')
          .eq('teacher_id', user.id)
          .order('lesson_date', { ascending: false })
          .limit(100),
        supabase
          .from('lessons')
          .select('student_id, created_at')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ])

      if (messagesResult.error) throw messagesResult.error
      if (reservationsResult.error) throw reservationsResult.error
      if (lessonsResult.error) throw lessonsResult.error

      const conversationMap = new Map()

      for (const item of messagesResult.data || []) {
        if (!item.student_id || conversationMap.has(item.student_id)) {
          continue
        }
        conversationMap.set(item.student_id, {
          student_id: item.student_id,
          last_message: item.content || '',
          last_message_at: item.created_at || '',
        })
      }

      for (const reservation of reservationsResult.data || []) {
        if (!reservation.student_id || conversationMap.has(reservation.student_id)) {
          continue
        }
        conversationMap.set(reservation.student_id, {
          student_id: reservation.student_id,
          last_message: '',
          last_message_at: reservation.lesson_date
            ? `${reservation.lesson_date}T${reservation.lesson_time || '00:00:00'}`
            : '',
        })
      }

      for (const lesson of lessonsResult.data || []) {
        if (!lesson.student_id || conversationMap.has(lesson.student_id)) {
          continue
        }
        conversationMap.set(lesson.student_id, {
          student_id: lesson.student_id,
          last_message: '',
          last_message_at: lesson.created_at || '',
        })
      }

      const nextConversations = Array.from(conversationMap.values()).sort((a, b) =>
        String(b.last_message_at).localeCompare(String(a.last_message_at)),
      )

      setConversations(nextConversations)

      const studentIds = nextConversations.map((item) => item.student_id)
      await hydrateProfiles(studentIds)

      const nextSelectedStudent = studentIds.includes(selectedStudentId)
        ? selectedStudentId
        : studentIds[0] || ''

      setSelectedStudentId(nextSelectedStudent)
      await loadThread(user.id, nextSelectedStudent)
    } catch (loadError) {
      setError(loadError.message)
      setConversations([])
      setThread([])
    } finally {
      setLoading(false)
    }
  }, [hydrateProfiles, loadThread, navigate, selectedStudentId])

  useEffect(() => {
    void loadMessageContext()
  }, [loadMessageContext])

  const selectedStudentName = useMemo(
    () => pickStudentName(profilesById[selectedStudentId], selectedStudentId),
    [profilesById, selectedStudentId],
  )

  const handleSelectConversation = async (studentUserId) => {
    if (!studentUserId || studentUserId === selectedStudentId) {
      return
    }

    setSelectedStudentId(studentUserId)
    setError('')
    try {
      await loadThread(teacherId, studentUserId)
    } catch (threadError) {
      setError(threadError.message)
    }
  }

  const handleSendMessage = async () => {
    const content = messageText.trim()
    if (!content || !teacherId || !selectedStudentId || sending) {
      return
    }

    try {
      setSending(true)
      setError('')

      const { error: insertError } = await supabase.from('messages').insert({
        teacher_id: teacherId,
        student_id: selectedStudentId,
        content,
      })

      if (insertError) {
        throw insertError
      }

      setMessageText('')
      await loadThread(teacherId, selectedStudentId)
      await loadMessageContext()
    } catch (sendError) {
      setError(sendError.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Keep students informed before and after lessons.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void loadMessageContext()} disabled={loading || sending}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate('/teacher/reservations')}>
              Open Reservations
            </Button>
          </div>
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
              Loading messages...
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No student conversation yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {conversations.map((conversation) => {
                  const isActive = selectedStudentId === conversation.student_id
                  const studentName = pickStudentName(
                    profilesById[conversation.student_id],
                    conversation.student_id,
                  )
                  return (
                    <button
                      key={conversation.student_id}
                      type="button"
                      onClick={() => void handleSelectConversation(conversation.student_id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-sky-200 bg-sky-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-900">{studentName}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {conversation.last_message || 'No message preview yet.'}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">Conversation with {selectedStudentName}</p>

                <div className="max-h-[320px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {thread.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
                  ) : (
                    thread.map((message) => (
                      <div key={message.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="text-sm text-slate-700">{message.content}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(message.created_at).toLocaleString('en-US')}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Write a message..."
                    disabled={sending}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        void handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={() => void handleSendMessage()}
                    disabled={sending || !messageText.trim() || !selectedStudentId}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default TeacherMessages
