import {
  assertPostMethod,
  getServerSupabaseClient,
  parseOptionalIsoDate,
  requireStringField,
  sendError,
} from './_helpers.js'

function parseReservationDateTime(reservationTime) {
  const normalized = parseOptionalIsoDate(reservationTime)
  if (!normalized) {
    return {
      lessonDate: null,
      lessonTime: null,
    }
  }

  const date = new Date(normalized)
  const lessonDate = date.toISOString().slice(0, 10)
  const lessonTime = date.toISOString().slice(11, 19)

  return {
    lessonDate,
    lessonTime,
  }
}

export default async function handler(req, res) {
  if (!assertPostMethod(req, res)) {
    return
  }

  try {
    const teacherId = requireStringField(req.body, 'teacherId')
    const studentId = requireStringField(req.body, 'studentId')
    const reservationTime = requireStringField(req.body, 'reservationTime')
    const lessonRequest = req.body?.lessonRequest ?? {}

    const parsedReservation = parseReservationDateTime(reservationTime)
    const supabase = getServerSupabaseClient()

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        status: 'waiting',
        source: 'reservation',
        start_time: reservationTime,
      })
      .select('id, teacher_id, student_id')
      .single()

    if (lessonError || !lesson) {
      return sendError(res, 500, 'Failed to create lesson', lessonError?.message)
    }

    // TODO: Create JaaS room and update lesson with room details
    const roomName = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { error: lessonUpdateError } = await supabase
      .from('lessons')
      .update({
        room_name: roomName,
      })
      .eq('id', lesson.id)

    if (lessonUpdateError) {
      return sendError(res, 500, 'Lesson created but room update failed', lessonUpdateError.message)
    }

    const reservationPayload = {
      teacher_id: teacherId,
      student_id: studentId,
      lesson_id: lesson.id,
      room_id: lesson.id,
      status: 'booked',
      lesson_request: lessonRequest,
      reservation_time: reservationTime,
      lesson_date: parsedReservation.lessonDate,
      lesson_time: parsedReservation.lessonTime,
    }

    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservationPayload)
      .select('id, lesson_id, room_id')
      .single()

    if (reservationError || !reservation) {
      return sendError(res, 500, 'Failed to create reservation', reservationError?.message)
    }

    return res.status(200).json({
      success: true,
      reservationId: reservation.id,
      lessonId: lesson.id,
      roomId: reservation.room_id,
      roomName: roomName,
    })
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create reservation')
  }
}