// api/teacher/go-online.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { teacherId } = req.body;
  if (!teacherId) {
    return res.status(400).json({ error: 'teacherId required' });
  }

  try {
    // Check if teacher already has a current lesson
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('current_lesson_id')
      .eq('id', teacherId)
      .single();

    if (profileError) throw profileError;

    if (profile.current_lesson_id) {
      // Teacher is already online; return the existing lesson
      return res.status(200).json({ 
        lessonId: profile.current_lesson_id,
        alreadyOnline: true
      });
    }

    // Create a JaaS room (you'll need to implement this)
    // For now, we'll create a lesson without JaaS room
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        teacher_id: teacherId,
        status: 'standby',
        room_name: `teacher-${teacherId}-${Date.now()}`,
      })
      .select()
      .single();

    if (lessonError) throw lessonError;

    // Update teacher's profile with current_lesson_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_lesson_id: lesson.id, status: 'online' })
      .eq('id', teacherId);

    if (updateError) throw updateError;

    // Update teacher_availability table
    await supabase
      .from('teacher_availability')
      .upsert({ 
        teacher_id: teacherId, 
        status: 'online',
        current_lesson_id: lesson.id,
        updated_at: new Date()
      }, { onConflict: 'teacher_id' });

    res.status(200).json({ 
      lessonId: lesson.id,
      roomName: lesson.room_name
    });
  } catch (error) {
    console.error('Error in go-online:', error);
    res.status(500).json({ error: error.message });
  }
}