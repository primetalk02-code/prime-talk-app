import { supabase } from '../lib/supabaseClient'

export function startTeacherPresence(userId) {
  // Initial presence update
  updateTeacherPresence(userId)

  // Set up interval to update every 10 seconds
  const interval = setInterval(() => {
    updateTeacherPresence(userId)
  }, 10000)

  // Return cleanup function
  return () => {
    clearInterval(interval)
  }
}

export async function updateTeacherPresence(userId) {
  try {
    const { error } = await supabase
      .from('teacher_availability')
      .upsert({
        teacher_id: userId,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to update teacher presence:', error)
    }
  } catch (error) {
    console.error('Error updating teacher presence:', error)
  }
}

export async function getOnlineTeachers() {
  try {
    const { data, error } = await supabase
      .from('teacher_availability')
      .select(`
        teacher_id,
        updated_at,
        profiles (full_name, email)
      `)
      .gte('updated_at', new Date(Date.now() - 30000).toISOString())
      .order('updated_at', { ascending: false })

    if (error) throw error

    return {
      success: true,
      teachers: data || []
    }
  } catch (error) {
    console.error('Error getting online teachers:', error)
    return {
      success: false,
      error: error.message || 'Failed to get online teachers'
    }
  }
}

export async function stopTeacherPresence(userId) {
  try {
    // Optional: Remove teacher from availability when they go offline
    // This is optional since we rely on timestamp checks
    const { error } = await supabase
      .from('teacher_availability')
      .delete()
      .eq('teacher_id', userId)

    if (error) {
      console.error('Failed to remove teacher from presence:', error)
    }
  } catch (error) {
    console.error('Error removing teacher from presence:', error)
  }
}