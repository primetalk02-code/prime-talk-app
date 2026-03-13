import { supabase } from '../../lib/supabaseClient'
import { createDailyRoom, createDailyToken, extractRoomNameFromUrl } from '../daily'

export async function createSuddenLesson(studentId, textbook = 'English Lesson') {
  try {
    // 1. Find available teacher (active within last 30 seconds)
    const { data: teachers, error: teacherError } = await supabase
      .from('teacher_availability')
      .select('teacher_id, updated_at')
      .gte('updated_at', new Date(Date.now() - 30000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(1)

    if (teacherError) throw teacherError
    if (!teachers || teachers.length === 0) {
      throw new Error('No teachers available at this time. Please try again in a moment.')
    }

    const teacherId = teachers[0].teacher_id

    // 2. Create lesson record
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        status: 'waiting',
        source: 'sudden',
        textbook: textbook,
        duration: 25
      })
      .select()
      .single()

    if (lessonError) throw lessonError

    // 3. Create Daily room
    const roomUrl = await createDailyRoom(26)
    const roomName = await extractRoomNameFromUrl(roomUrl)

    // 4. Generate tokens
    const teacherToken = await createDailyToken(roomName, teacherId, true)
    const studentToken = await createDailyToken(roomName, studentId, false)

    // 5. Update lesson with room info and tokens
    const { data: updatedLesson, error: updateError } = await supabase
      .from('lessons')
      .update({
        room_url: roomUrl,
        room_name: roomName,
        teacher_token: teacherToken,
        student_token: studentToken
      })
      .eq('id', lesson.id)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      success: true,
      lesson: updatedLesson,
      teacherToken,
      studentToken
    }

  } catch (error) {
    console.error('Error creating sudden lesson:', error)
    return {
      success: false,
      error: error.message || 'Failed to create sudden lesson'
    }
  }
}