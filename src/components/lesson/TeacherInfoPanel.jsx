// Inside the component, add fallbacks:
const safeTeacher = {
  name: teacher?.name || 'Teacher',
  avatar: teacher?.avatar || '/default-avatar.png',
  country: teacher?.country || 'Philippines',
  rating: teacher?.rating || 5.0,
  lessonCount: teacher?.lessonCount || 0,
  studentCount: teacher?.studentCount || 0,
  tags: teacher?.tags?.length ? teacher.tags : ['Friendly', 'Professional'],
  bio: teacher?.bio || 'Experienced English teacher',
  joinedDate: teacher?.joinedDate || '2026-01-01'
};