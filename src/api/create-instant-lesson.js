import {
  assertPostMethod,
  createDailyRoomForLesson,
  getServerSupabaseClient,
  requireStringField,
  sendError,
} from './_helpers.js'

export default async function handler(req, res) {
  if (!assertPostMethod(req, res)) {
    return
  }

  try {
    const studentId = requireStringField(req.body, 'studentId')
    const supabase = getServerSupabaseClient()

    const { data: availableTeachers, error: teacherError } = await supabase
      .from('teacher_availability')
      .select('teacher_id')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (teacherError) {
      return sendError(res, 500, 'Failed to load available teachers', teacherError.message)
    }

    const teacherId = availableTeachers?.[0]?.teacher_id
    if (!teacherId) {
      return sendError(res, 404, 'No teachers available. Please try again.')
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        status: 'waiting',
        source: 'sudden',
      })
      .select('id, teacher_id, student_id')
      .single()

    if (lessonError || !lesson) {
      return sendError(res, 500, 'Failed to create lesson', lessonError?.message)
    }

    const room = await createDailyRoomForLesson({ lessonId: lesson.id })

    const { error: updateError } = await supabase
      .from('lessons')
      .update({
        room_url: room.roomUrl,
        room_name: room.roomName,
      })
      .eq('id', lesson.id)

    if (updateError) {
      return sendError(res, 500, 'Lesson created but room update failed', updateError.message)
    }

    return res.status(200).json({
      success: true,
      lessonId: lesson.id,
      teacherId: lesson.teacher_id,
      studentId: lesson.student_id,
      roomUrl: room.roomUrl,
      roomName: room.roomName,
    })
  } catch (error) {
    return sendError(res, 400, error.message || 'Failed to create instant lesson')
  }
}
