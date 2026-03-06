import { supabase } from './supabaseClient'

export const LESSON_PENDING_STATUS = 'waiting'
export const LESSON_ACTIVE_STATUS = 'active'
export const LESSON_COMPLETED_STATUS = 'finished'
export const LESSON_DECLINED_STATUS = 'declined'
export const JOINABLE_LESSON_STATUSES = [LESSON_PENDING_STATUS, LESSON_ACTIVE_STATUS]
export const SUDDEN_LESSON_REQUEST_TIMEOUT_MS = 30_000

function parseRoomFields(roomData) {
  return {
    room_url: roomData?.room_url || roomData?.url || '',
    room_name: roomData?.room_name || roomData?.name || '',
  }
}

function toYmd(value = new Date()) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().slice(0, 10)
  }

  return new Date(value).toISOString().slice(0, 10)
}

function normalizeTime(value = '') {
  const text = String(value || '').trim()
  if (!text) {
    return new Date().toTimeString().slice(0, 8)
  }

  if (/^\d{2}:\d{2}$/.test(text)) {
    return `${text}:00`
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) {
    return text
  }

  return new Date().toTimeString().slice(0, 8)
}

export async function createPendingLessonRequest({
  teacherId,
  studentId,
  duration = 10,
  textbook = 'Daily Conversation',
  source = 'sudden',
}) {
  const safeDuration = [5, 10, 25].includes(Number(duration)) ? Number(duration) : 10

  const { data: lesson, error: insertError } = await supabase
    .from('lessons')
    .insert({
      teacher_id: teacherId,
      student_id: studentId,
      duration: safeDuration,
      textbook: textbook || null,
      status: LESSON_PENDING_STATUS,
      source,
    })
    .select('id, teacher_id, student_id, duration, textbook, status, source, created_at')
    .single()

  if (insertError) {
    throw insertError
  }

  return lesson
}

export async function createRoomForLesson({ lessonId, teacherId, studentId }) {
  const { data, error } = await supabase.functions.invoke('create-room', {
    body: {
      lesson_id: lessonId,
      teacher_id: teacherId,
      student_id: studentId,
    },
  })

  if (error) {
    throw error
  }

  const { room_url, room_name } = parseRoomFields(data)

  if (!room_url) {
    throw new Error('Daily room was created without a room URL.')
  }

  return {
    room_url,
    room_name: room_name || null,
  }
}

export async function activateLessonWithRoom({ lessonId }) {
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, teacher_id, student_id, room_url, room_name')
    .eq('id', lessonId)
    .single()

  if (lessonError) {
    throw lessonError
  }

  let roomFields = {
    room_url: lesson.room_url || '',
    room_name: lesson.room_name || null,
  }

  if (!roomFields.room_url) {
    roomFields = await createRoomForLesson({
      lessonId: lesson.id,
      teacherId: lesson.teacher_id,
      studentId: lesson.student_id,
    })
  }

  const nowIso = new Date().toISOString()
  const { data: updatedLesson, error: updateError } = await supabase
    .from('lessons')
    .update({
      status: LESSON_ACTIVE_STATUS,
      start_time: nowIso,
      started_at: nowIso,
      room_url: roomFields.room_url,
      room_name: roomFields.room_name,
    })
    .eq('id', lesson.id)
    .select('id, teacher_id, student_id, duration, textbook, status, room_url, room_name, created_at')
    .single()

  if (updateError) {
    throw updateError
  }

  return updatedLesson
}

export async function declineLessonRequest(lessonId) {
  const { error } = await supabase
    .from('lessons')
    .update({ status: LESSON_DECLINED_STATUS })
    .eq('id', lessonId)
    .eq('status', LESSON_PENDING_STATUS)

  if (error) {
    throw error
  }
}

export async function completeLesson(lessonId) {
  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from('lessons')
    .update({
      status: LESSON_COMPLETED_STATUS,
      ended_at: nowIso,
    })
    .eq('id', lessonId)

  if (error) {
    throw error
  }
}

export async function saveLessonHistoryRecord({ lessonId, durationCompleted = 0 }) {
  if (!lessonId) {
    return
  }

  const safeDuration = Math.max(0, Math.round(Number(durationCompleted) || 0))

  const { error } = await supabase.from('lesson_history').upsert(
    {
      lesson_id: lessonId,
      duration_completed: safeDuration,
    },
    {
      onConflict: 'lesson_id',
    },
  )

  if (error) {
    throw error
  }
}

export async function createLessonWithDailyRoom({
  teacherId,
  studentId,
  duration = 10,
  textbook = 'Daily Conversation',
  source = 'reservation',
}) {
  const pendingLesson = await createPendingLessonRequest({
    teacherId,
    studentId,
    duration,
    textbook,
    source,
  })

  return await activateLessonWithRoom({ lessonId: pendingLesson.id })
}

export async function attachDailyRoomToLesson({ lessonId, teacherId, studentId }) {
  if (!lessonId || !teacherId || !studentId) {
    throw new Error('Missing required fields to attach Daily room to lesson.')
  }

  const roomFields = await createRoomForLesson({
    lessonId,
    teacherId,
    studentId,
  })

  const { error: updateError } = await supabase
    .from('lessons')
    .update({
      room_url: roomFields.room_url,
      room_name: roomFields.room_name,
    })
    .eq('id', lessonId)

  if (updateError) {
    throw updateError
  }

  return roomFields
}

export async function findJoinableLessonForStudent(studentId) {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, room_url, room_name, duration, textbook, status, created_at')
    .eq('student_id', studentId)
    .in('status', JOINABLE_LESSON_STATUSES)
    .not('room_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  return data?.[0] || null
}

export async function findAvailableSuddenLessonTeachers(limitOrOptions = 30) {
  const options = typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : limitOrOptions || {}
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 30
  const preferredLessonDay = toYmd(options.preferredLessonDay)
  const preferredLessonTime = normalizeTime(options.preferredLessonTime)

  // Get available teacher IDs for the preferred window
  const { data: availabilityRows, error: availabilityError } = await supabase
    .from('teacher_availability')
    .select('teacher_id, day, start_time, end_time')
    .eq('day', preferredLessonDay)
    .lte('start_time', preferredLessonTime)
    .gte('end_time', preferredLessonTime)
    .limit(limit * 5)

  if (availabilityError) {
    throw availabilityError
  }

  const teacherIds = Array.from(
    new Set((availabilityRows || []).map((row) => row.teacher_id).filter(Boolean)),
  )

  if (teacherIds.length === 0) {
    return []
  }

  // Query teachers from profiles (or users) table with correct filters and ordering
  const { data: teachers, error: teachersError } = await supabase
    .from('profiles')
    .select('id, full_name, role, status, photo_url')
    .eq('role', 'teacher')
    .eq('status', 'online')
    .in('id', teacherIds)
    .order('full_name', { ascending: true })
    .limit(limit)

  if (teachersError) {
    throw teachersError
  }

  return (teachers || []).map((teacher) => ({
    id: teacher.id,
    full_name: teacher.full_name || 'Teacher',
    role: teacher.role || 'teacher',
    status: teacher.status || '',
    photo_url: teacher.photo_url || '',
    availability: true,
  }))
}

export async function waitForLessonDecision(
  lessonId,
  timeoutMs = SUDDEN_LESSON_REQUEST_TIMEOUT_MS,
  { onTick } = {},
) {
  const { data: initialLesson, error: initialError } = await supabase
    .from('lessons')
    .select('id, status')
    .eq('id', lessonId)
    .maybeSingle()

  if (initialError) {
    throw initialError
  }

  const initialStatus = initialLesson?.status || ''
  if (initialStatus === LESSON_ACTIVE_STATUS || initialStatus === LESSON_DECLINED_STATUS) {
    return initialStatus
  }

  return await new Promise((resolve) => {
    const channelName = `lesson-decision-${lessonId}-${Date.now()}`
    let settled = false
    let timeoutId = null
    let tickInterval = null
    let decisionChannel = null
    let remainingSeconds = Math.ceil(timeoutMs / 1000)

    const clearHandles = async () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (tickInterval) {
        clearInterval(tickInterval)
      }
      if (decisionChannel) {
        await supabase.removeChannel(decisionChannel)
      }
    }

    const settle = async (status) => {
      if (settled) {
        return
      }

      settled = true
      await clearHandles()
      resolve(status)
    }

    tickInterval = setInterval(() => {
      remainingSeconds = Math.max(remainingSeconds - 1, 0)
      onTick?.(remainingSeconds)
    }, 1000)

    timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const { data: latestLesson } = await supabase
            .from('lessons')
            .select('status')
            .eq('id', lessonId)
            .maybeSingle()

          if (latestLesson?.status === LESSON_ACTIVE_STATUS) {
            await settle(LESSON_ACTIVE_STATUS)
            return
          }

          await supabase
            .from('lessons')
            .update({ status: LESSON_DECLINED_STATUS })
            .eq('id', lessonId)
            .eq('status', LESSON_PENDING_STATUS)
        } catch (error) {
          console.error('Failed to auto-decline timed out lesson request:', error)
        }

        await settle(LESSON_DECLINED_STATUS)
      })()
    }, timeoutMs)

    onTick?.(remainingSeconds)

    decisionChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lessons',
          filter: `id=eq.${lessonId}`,
        },
        async (payload) => {
          const nextStatus = payload.new?.status
          if (nextStatus === LESSON_ACTIVE_STATUS || nextStatus === LESSON_DECLINED_STATUS) {
            await settle(nextStatus)
          }
        },
      )
      .subscribe()
  })
}

