-- Lesson recordings
CREATE TABLE IF NOT EXISTS lesson_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_rooms(id),
  teacher_id uuid REFERENCES teachers(id),
  student_id uuid REFERENCES students(id),
  recording_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
