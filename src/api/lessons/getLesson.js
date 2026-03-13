import { supabase } from '../../lib/supabaseClient'

export async function getLesson(lessonId, userId) {
  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        id,
        teacher_id,
        student_id,
        status,
        source,
        textbook,
        duration,
        room_url,
        room_name,
        teacher_token,
        student_token,
        created_at,
        started_at,
        profiles!teacher_id (full_name, email),
        student_profiles:profiles!student_id (full_name, email)
      `)
      .eq('id', lessonId)
      .in('status', ['waiting', 'active'])
      .single()

    if (error) throw error
    if (!lesson) throw new Error('Lesson not found')

    // Verify user has access to this lesson
    if (lesson.teacher_id !== userId && lesson.student_id !== userId) {
      throw new Error('Access denied')
    }

    return {
      success: true,
      lesson
    }

  } catch (error) {
    console.error('Error getting lesson:', error)
    return {
      success: false,
      error: error.message || 'Failed to get lesson'
    }
  }
}