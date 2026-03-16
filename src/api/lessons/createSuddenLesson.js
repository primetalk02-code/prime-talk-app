import { supabase } from '../../lib/supabaseClient'

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

    // 3. Create JaaS room
    const roomName = `lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const roomUrl = `https://meet.jitsi.si/${roomName}`

    // 4. Update lesson with room info
    const { data: updatedLesson, error: updateError } = await supabase
      .from('lessons')
      .update({
        room_url: roomUrl,
        room_name: roomName
      })
      .eq('id', lesson.id)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      success: true,
      lesson: updatedLesson
    }

  } catch (error) {
    console.error('Error creating sudden lesson:', error)
    return {
      success: false,
      error: error.message || 'Failed to create sudden lesson'
    }
  }
}