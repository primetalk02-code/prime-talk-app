import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DailyIframe from '@daily-co/daily-js'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { LESSON_ACTIVE_STATUS, LESSON_COMPLETED_STATUS, saveLessonHistoryRecord } from '../lib/lessonSessions'
import { supabase } from '../lib/supabaseClient'

const DAILY_BASE_URL = 'https://primetalk.daily.co'
const DEFAULT_LESSON_DURATION_SECONDS = 15 * 60
const PRE_JOIN_COUNTDOWN_SECONDS = 10
const TEXTBOOK_OPTIONS = [
  'Daily Conversation',
  'Business English',
  'IELTS Speaking',
  'Travel English',
  'Grammar Focus',
]

function buildMeetingUrl(roomName) {
  return `${DAILY_BASE_URL}/${roomName}`
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function LessonRoom() {
  const { roomId = '', reservationId = '' } = useParams()
  const navigate = useNavigate()

  const frameContainerRef = useRef(null)
  const callFrameRef = useRef(null)
  const lessonTimerRef = useRef(null)
  const preJoinIntervalRef = useRef(null)
  const activeLessonIdRef = useRef('')
  const hasSeenTwoParticipantsRef = useRef(false)
  const completionInProgressRef = useRef(false)
  const hasMarkedLessonActiveRef = useRef(false)
  const remainingSecondsRef = useRef(DEFAULT_LESSON_DURATION_SECONDS)
  const lessonStartedAtRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('student')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [activeLessonId, setActiveLessonId] = useState('')
  const [lessonDurationSeconds, setLessonDurationSeconds] = useState(DEFAULT_LESSON_DURATION_SECONDS)
  const [timerDisplay, setTimerDisplay] = useState(formatTimer(DEFAULT_LESSON_DURATION_SECONDS))
  const [participantCount, setParticipantCount] = useState(0)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [lessonTextbook, setLessonTextbook] = useState('Daily Conversation')
  const [savingTextbook, setSavingTextbook] = useState(false)
  const [isFrameReady, setIsFrameReady] = useState(false)
  const [hasJoinedMeeting, setHasJoinedMeeting] = useState(false)
  const [joiningMeeting, setJoiningMeeting] = useState(false)
  const [preJoinSeconds, setPreJoinSeconds] = useState(PRE_JOIN_COUNTDOWN_SECONDS)
  const [lessonStarted, setLessonStarted] = useState(false)

  const clearLessonTimer = useCallback(() => {
    if (lessonTimerRef.current) {
      window.clearInterval(lessonTimerRef.current)
      lessonTimerRef.current = null
    }
  }, [])

  const clearPreJoinTimer = useCallback(() => {
    if (preJoinIntervalRef.current) {
      window.clearInterval(preJoinIntervalRef.current)
      preJoinIntervalRef.current = null
    }
  }, [])

  const updateLessonStatus = useCallback(async (lessonId, status) => {
    if (!lessonId) {
      return
    }

    const payload = {
      status,
    }

    const nowIso = new Date().toISOString()
    if (status === LESSON_ACTIVE_STATUS) {
      payload.started_at = nowIso
      payload.start_time = nowIso
    }
    if (status === LESSON_COMPLETED_STATUS) {
      payload.ended_at = nowIso
    }

    const { error: updateError } = await supabase.from('lessons').update(payload).eq('id', lessonId)

    if (updateError && updateError.code !== '42P01') {
      throw updateError
    }
  }, [])

  const completeLessonAndExit = useCallback(
    async () => {
      if (completionInProgressRef.current) {
        return
      }

      completionInProgressRef.current = true
      clearLessonTimer()
      clearPreJoinTimer()

      try {
        const lessonId = activeLessonIdRef.current || activeLessonId
        await updateLessonStatus(lessonId, LESSON_COMPLETED_STATUS)
        const totalSeconds = Number(lessonDurationSeconds) || 0
        const remainingSeconds = Math.max(0, Number(remainingSecondsRef.current) || 0)
        const completedSeconds = lessonStarted ? Math.max(totalSeconds - remainingSeconds, 0) : 0
        const completedMinutes = Math.ceil(completedSeconds / 60)
        await saveLessonHistoryRecord({
          lessonId,
          durationCompleted: completedMinutes,
        })
      } catch (statusError) {
        console.error('Failed to finalize lesson completion:', statusError)
      }

      try {
        if (callFrameRef.current) {
          await callFrameRef.current.leave()
        }
      } catch (leaveError) {
        console.error('Failed to leave Daily room:', leaveError)
      }

      if (userRole === 'teacher') {
        navigate('/teacher/dashboard', { replace: true })
      } else {
        navigate('/student/dashboard', { replace: true })
      }
    },
    [activeLessonId, clearLessonTimer, clearPreJoinTimer, lessonDurationSeconds, lessonStarted, navigate, updateLessonStatus, userRole],
  )

  const syncParticipantState = useCallback(() => {
    if (!callFrameRef.current) {
      return
    }

    const participants = callFrameRef.current.participants() || {}
    const count = Object.values(participants).filter((participant) => Boolean(participant?.session_id)).length
    setParticipantCount(count)

    const localParticipant = participants.local
    setIsMicOn(Boolean(localParticipant?.audio))
    setIsCameraOn(Boolean(localParticipant?.video))
    setIsScreenSharing(Boolean(localParticipant?.screen))

    if (count >= 2) {
      hasSeenTwoParticipantsRef.current = true
      setLessonStarted(true)
      if (!lessonStartedAtRef.current) {
        lessonStartedAtRef.current = Date.now()
      }

      if (activeLessonIdRef.current && !hasMarkedLessonActiveRef.current) {
        hasMarkedLessonActiveRef.current = true
        void updateLessonStatus(activeLessonIdRef.current, LESSON_ACTIVE_STATUS).catch((statusError) => {
          console.error('Failed to mark lesson active:', statusError)
        })
      }
      return
    }

    if (hasSeenTwoParticipantsRef.current && count < 2) {
      void completeLessonAndExit()
    }
  }, [completeLessonAndExit, updateLessonStatus])

  useEffect(() => {
    let cancelled = false

    const initLessonMetadata = async () => {
      try {
        setLoading(true)
        setError('')

        if (!roomId && !reservationId) {
          throw new Error('No active lesson yet')
        }

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

        let resolvedRole = 'student'
        let resolvedMeetingUrl = ''
        let resolvedLessonId = ''
        let resolvedDurationSeconds = DEFAULT_LESSON_DURATION_SECONDS
        let resolvedTextbook = 'Daily Conversation'

        if (roomId) {
          const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .select('id, teacher_id, student_id, room_url, status, duration, textbook')
            .eq('id', roomId)
            .maybeSingle()

          if (lessonError && lessonError.code !== '42P01') {
            throw lessonError
          }

          if (!lesson || !lesson.room_url) {
            throw new Error('No active lesson yet')
          }

          if (user.id !== lesson.teacher_id && user.id !== lesson.student_id) {
            throw new Error('You do not have access to this lesson room.')
          }

          resolvedRole = user.id === lesson.teacher_id ? 'teacher' : 'student'
          resolvedMeetingUrl = lesson.room_url
          resolvedLessonId = lesson.id

          const durationMinutes = Number(lesson.duration)
          if ([5, 10, 15, 20, 25].includes(durationMinutes)) {
            resolvedDurationSeconds = durationMinutes * 60
          }

          if (lesson.textbook) {
            resolvedTextbook = lesson.textbook
          }
        } else {
          const { data: reservation, error: reservationError } = await supabase
            .from('reservations')
            .select('id, teacher_id, student_id')
            .eq('id', reservationId)
            .single()

          if (reservationError) {
            throw reservationError
          }

          if (!reservation) {
            throw new Error('No active lesson yet')
          }

          if (user.id !== reservation.teacher_id && user.id !== reservation.student_id) {
            throw new Error('You do not have access to this lesson room.')
          }

          resolvedRole = user.id === reservation.teacher_id ? 'teacher' : 'student'
          resolvedMeetingUrl = buildMeetingUrl(`lesson-${reservation.id}`)
        }

        if (cancelled) {
          return
        }

        setUserRole(resolvedRole)
        setMeetingUrl(resolvedMeetingUrl)
        setActiveLessonId(resolvedLessonId)
        setLessonDurationSeconds(resolvedDurationSeconds)
        setTimerDisplay(formatTimer(resolvedDurationSeconds))
        remainingSecondsRef.current = resolvedDurationSeconds
        setLessonTextbook(resolvedTextbook)
        setPreJoinSeconds(PRE_JOIN_COUNTDOWN_SECONDS)
        setHasJoinedMeeting(false)
        setJoiningMeeting(false)
        setLessonStarted(false)

        activeLessonIdRef.current = resolvedLessonId
        hasSeenTwoParticipantsRef.current = false
        completionInProgressRef.current = false
        hasMarkedLessonActiveRef.current = false
        lessonStartedAtRef.current = null
      } catch (initError) {
        if (!cancelled) {
          setError(initError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initLessonMetadata()

    return () => {
      cancelled = true
      clearLessonTimer()
      clearPreJoinTimer()
      activeLessonIdRef.current = ''
      hasSeenTwoParticipantsRef.current = false
      completionInProgressRef.current = false
      hasMarkedLessonActiveRef.current = false
      lessonStartedAtRef.current = null
    }
  }, [clearLessonTimer, clearPreJoinTimer, navigate, reservationId, roomId])

  useEffect(() => {
    if (loading || !meetingUrl || !frameContainerRef.current || callFrameRef.current) {
      return
    }

    const callFrame = DailyIframe.createFrame(frameContainerRef.current, {
      showLeaveButton: false,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '16px',
      },
    })

    callFrameRef.current = callFrame
    setIsFrameReady(true)

    callFrame.on('joined-meeting', syncParticipantState)
    callFrame.on('participant-joined', syncParticipantState)
    callFrame.on('participant-left', syncParticipantState)
    callFrame.on('participant-updated', syncParticipantState)
    callFrame.on('left-meeting', syncParticipantState)

    return () => {
      setIsFrameReady(false)
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
    }
  }, [loading, meetingUrl, syncParticipantState])

  const joinMeeting = useCallback(async () => {
    if (!callFrameRef.current || hasJoinedMeeting || joiningMeeting || !meetingUrl) {
      return
    }

    try {
      setError('')
      setJoiningMeeting(true)
      await callFrameRef.current.join({ url: meetingUrl })
      setHasJoinedMeeting(true)
      syncParticipantState()
    } catch (joinError) {
      setError(joinError.message)
    } finally {
      setJoiningMeeting(false)
    }
  }, [hasJoinedMeeting, joiningMeeting, meetingUrl, syncParticipantState])

  useEffect(() => {
    if (loading || !meetingUrl || !isFrameReady || hasJoinedMeeting || joiningMeeting) {
      return
    }

    clearPreJoinTimer()
    setPreJoinSeconds(PRE_JOIN_COUNTDOWN_SECONDS)

    preJoinIntervalRef.current = window.setInterval(() => {
      setPreJoinSeconds((current) => {
        if (current <= 1) {
          clearPreJoinTimer()
          void joinMeeting()
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      clearPreJoinTimer()
    }
  }, [clearPreJoinTimer, hasJoinedMeeting, isFrameReady, joinMeeting, joiningMeeting, loading, meetingUrl])

  useEffect(() => {
    if (loading || !hasJoinedMeeting || !lessonStarted) {
      return
    }

    clearLessonTimer()
    setTimerDisplay(formatTimer(lessonDurationSeconds))

    let seconds = lessonDurationSeconds
    remainingSecondsRef.current = seconds

    lessonTimerRef.current = window.setInterval(() => {
      seconds -= 1
      remainingSecondsRef.current = Math.max(seconds, 0)
      setTimerDisplay(formatTimer(Math.max(seconds, 0)))

      if (seconds <= 0) {
        void completeLessonAndExit()
      }
    }, 1000)

    return () => {
      clearLessonTimer()
    }
  }, [clearLessonTimer, completeLessonAndExit, hasJoinedMeeting, lessonDurationSeconds, lessonStarted, loading])

  useEffect(() => {
    if (!activeLessonId) {
      return
    }

    const channel = supabase
      .channel(`lesson-room-status-${activeLessonId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lessons',
          filter: `id=eq.${activeLessonId}`,
        },
        (payload) => {
          const nextStatus = payload.new?.status
          if (nextStatus === LESSON_COMPLETED_STATUS) {
            void completeLessonAndExit()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeLessonId, completeLessonAndExit])

  const handleToggleCamera = async () => {
    if (!callFrameRef.current || loading || !hasJoinedMeeting) {
      return
    }

    try {
      setError('')
      const nextState = !isCameraOn
      await callFrameRef.current.setLocalVideo(nextState)
      setIsCameraOn(nextState)
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  const handleToggleMicrophone = async () => {
    if (!callFrameRef.current || loading || !hasJoinedMeeting) {
      return
    }

    try {
      setError('')
      const nextState = !isMicOn
      await callFrameRef.current.setLocalAudio(nextState)
      setIsMicOn(nextState)
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  const handleToggleScreenShare = async () => {
    if (!callFrameRef.current || loading || !hasJoinedMeeting) {
      return
    }

    try {
      setError('')
      if (isScreenSharing) {
        await callFrameRef.current.stopScreenShare()
        setIsScreenSharing(false)
      } else {
        await callFrameRef.current.startScreenShare()
        setIsScreenSharing(true)
      }
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  const handleTextbookChange = async (nextTextbook) => {
    setLessonTextbook(nextTextbook)

    const lessonId = activeLessonIdRef.current || activeLessonId
    if (!lessonId) {
      return
    }

    try {
      setSavingTextbook(true)
      setError('')

      const { error: updateError } = await supabase
        .from('lessons')
        .update({ textbook: nextTextbook })
        .eq('id', lessonId)

      if (updateError) {
        throw updateError
      }
    } catch (textbookError) {
      setError(textbookError.message)
    } finally {
      setSavingTextbook(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (leaving) {
      return
    }

    try {
      setLeaving(true)
      setError('')
      await completeLessonAndExit()
    } catch (leaveError) {
      setError(leaveError.message)
      setLeaving(false)
    }
  }

  return (
    <section className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl animate-fade-up flex-col gap-4">
        <Card className="border-slate-200 bg-white/90 shadow-card backdrop-blur">
          <CardContent className="flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Video Lesson</h1>
              <p className="mt-1 text-sm text-slate-600">
                Live Daily.co lesson with mic, camera, and screen controls.
              </p>
              {meetingUrl && (
                <p className="mt-2 max-w-xl truncate text-xs text-slate-500">Meeting URL: {meetingUrl}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 text-right sm:flex-row sm:items-center sm:gap-3 sm:text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">Participants: {participantCount}</Badge>
                <Badge variant={lessonStarted ? 'warning' : 'secondary'}>
                  {lessonStarted ? `Time Left: ${timerDisplay}` : 'Waiting to start'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  Duration: {Math.round(lessonDurationSeconds / 60)} min
                </Badge>
                {savingTextbook && <Badge variant="secondary">Saving textbook...</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="border-slate-200 bg-white shadow-card">
            <CardContent className="flex min-h-[320px] items-center justify-center p-6">
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                Preparing lesson...
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {!hasJoinedMeeting && (
              <Card className="border-amber-200 bg-amber-50 shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Entering room in {preJoinSeconds}s</p>
                    <p className="text-xs text-amber-700">
                      A short countdown runs before joining the live class.
                    </p>
                  </div>
                  <Button onClick={() => void joinMeeting()} disabled={joiningMeeting || !isFrameReady}>
                    {joiningMeeting ? 'Connecting...' : 'Enter Now'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 bg-white shadow-card">
              <CardContent className="p-3">
                <div className="h-[72vh] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                  <div ref={frameContainerRef} className="h-full w-full overflow-hidden rounded-2xl bg-slate-950" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-card">
              <CardContent className="flex flex-wrap items-center justify-center gap-3 p-4">
                <div className="min-w-[220px]">
                  <label htmlFor="lesson-textbook" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Textbook
                  </label>
                  <select
                    id="lesson-textbook"
                    value={lessonTextbook}
                    onChange={(event) => void handleTextbookChange(event.target.value)}
                    disabled={savingTextbook || leaving}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  >
                    {TEXTBOOK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant={isCameraOn ? 'secondary' : 'outline'}
                  onClick={() => void handleToggleCamera()}
                  disabled={!hasJoinedMeeting}
                  className={
                    isCameraOn
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }
                >
                  {isCameraOn ? 'Camera On' : 'Camera Off'}
                </Button>

                <Button
                  variant={isMicOn ? 'secondary' : 'outline'}
                  onClick={() => void handleToggleMicrophone()}
                  disabled={!hasJoinedMeeting}
                  className={
                    isMicOn
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }
                >
                  {isMicOn ? 'Mic On' : 'Mic Off'}
                </Button>

                <Button
                  variant={isScreenSharing ? 'secondary' : 'outline'}
                  onClick={() => void handleToggleScreenShare()}
                  disabled={!hasJoinedMeeting}
                  className={
                    isScreenSharing
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }
                >
                  {isScreenSharing ? 'Stop Share' : 'Share Screen'}
                </Button>

                <Button variant="destructive" onClick={() => void handleLeaveRoom()} disabled={leaving}>
                  {leaving ? 'Ending...' : 'End Lesson'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </section>
  )
}

export default LessonRoom
