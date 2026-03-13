import { supabase } from './supabaseClient'

let heartbeatInterval = null

export async function startTeacherPresence(userId) {
  // Immediately update
  await updatePresence(userId)
  // Then every 10 seconds
  heartbeatInterval = setInterval(() => updatePresence(userId), 10000)
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => stopTeacherPresence(userId))
}

export async function stopTeacherPresence(userId) {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  // Mark offline
  await supabase
    .from('profiles')
    .update({ status: 'offline' })
    .eq('id', userId)
  // Remove from availability
  await supabase
    .from('teacher_availability')
    .delete()
    .eq('teacher_id', userId)
}

async function updatePresence(userId) {
  await supabase
    .from('teacher_availability')
    .upsert({
      teacher_id: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'teacher_id' })
}

export async function getOnlineTeachers() {
  // Teachers active in last 30 seconds
  const threshold = new Date(Date.now() - 30000).toISOString()
  const { data, error } = await supabase
    .from('teacher_availability')
    .select('teacher_id, updated_at')
    .gte('updated_at', threshold)
    .order('updated_at', { ascending: false })
  if (error) throw error
  if (!data || data.length === 0) return []
  const teacherIds = data.map(r => r.teacher_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, photo_url, status')
    .in('id', teacherIds)
    .eq('role', 'teacher')
  return profiles || []
}