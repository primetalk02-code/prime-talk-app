// api/teacher/go-offline.js
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
    // Update teacher_availability
    await supabase
      .from('teacher_availability')
      .upsert({ 
        teacher_id: teacherId, 
        status: 'offline',
        current_lesson_id: null,
        updated_at: new Date()
      }, { onConflict: 'teacher_id' });

    // Update profile
    await supabase
      .from('profiles')
      .update({ status: 'offline' })
      .eq('id', teacherId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error going offline:', error);
    res.status(500).json({ error: error.message });
  }
}