import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Fixed: using supabaseClient.js

export default function useLessonData(id) {
  const [data, setData] = useState({
    loading: true,
    lesson: null,
    teacher: null,
    material: null,
    viewerCount: 0
  });

  useEffect(() => {
    if (!id) return;

    async function fetchLessonData() {
      try {
        setData(prev => ({ ...prev, loading: true }));

        // 1. Fetch lesson details with teacher info
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select(`
            *,
            teacher:teacher_id (
              id,
              name,
              avatar_url,
              country,
              rating,
              total_lessons,
              total_students,
              tags,
              bio,
              created_at
            )
          `)
          .eq('id', id)
          .single();

        if (lessonError) throw lessonError;

        // 2. Fetch lesson material/textbook
        const { data: material, error: materialError } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('lesson_id', id)
          .maybeSingle();

        // 3. Format teacher data with fallbacks
        const teacher = lesson.teacher ? {
          name: lesson.teacher.name || 'Teacher',
          avatar: lesson.teacher.avatar_url || '/default-avatar.png',
          country: lesson.teacher.country || 'Philippines',
          rating: lesson.teacher.rating || 5.0,
          lessonCount: lesson.teacher.total_lessons || 0,
          studentCount: lesson.teacher.total_students || 0,
          tags: lesson.teacher.tags?.length ? lesson.teacher.tags : ['Friendly', 'Professional'],
          bio: lesson.teacher.bio || 'Experienced English teacher',
          joinedDate: lesson.teacher.created_at ? new Date(lesson.teacher.created_at).toLocaleDateString() : '2026-01-01'
        } : {
          name: 'Teacher',
          avatar: '/default-avatar.png',
          country: 'Philippines',
          rating: 5.0,
          lessonCount: 0,
          studentCount: 0,
          tags: ['Friendly'],
          bio: 'English teacher',
          joinedDate: '2026-01-01'
        };

        // 4. Format material data with fallbacks
        const formattedMaterial = material ? {
          type: material.type || 'text',
          title: material.title || 'Lesson Material',
          content: material.content || '',
          url: material.url || null,
          totalPages: material.total_pages || 1
        } : {
          type: 'text',
          title: 'Lesson Material',
          content: 'No material available for this lesson.',
          totalPages: 1
        };

        // 5. Set the final data
        setData({
          loading: false,
          lesson: {
            roomName: lesson.room_name || lesson.room_url,
            jwt: lesson.jwt_token || '' // You'll generate this on backend
          },
          teacher,
          material: formattedMaterial,
          viewerCount: 0 // Will be updated by presence subscription
        });

      } catch (error) {
        console.error('Error fetching lesson data:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    }

    fetchLessonData();

    // 6. Set up real-time presence for viewer count
    const channel = supabase.channel(`lesson:${id}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const count = Object.keys(presenceState).length;
        setData(prev => ({ ...prev, viewerCount: count }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as present
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ user_id: user.id });
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

  return data;
}