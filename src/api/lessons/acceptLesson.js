import { supabase } from '../../lib/supabaseClient'

export async function acceptLesson(lessonId, teacherId) {
  try {
    // Verify this lesson belongs to the teacher
    const { data: lesson, error: verifyError } = await supabase
      .from('lessons')
      .select('id, teacher_id, status, student_id, room_url, student_token')
      .eq('id', lessonId)
      .eq('teacher_id', teacherId)
      .single()

    if (verifyError) throw verifyError
    if (!lesson) throw new Error('Lesson not found or does not belong to you')

    // Update lesson status to active
    const { data: updatedLesson, error: updateError } = await supabase
      .from('lessons')
      .update({
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (updateError) throw updateError

    return {
      success: true,
      lesson: updatedLesson
    }

  } catch (error) {
    console.error('Error accepting lesson:', error)
    return {
      success: false,
      error: error.message || 'Failed to accept lesson'
    }
  }
}