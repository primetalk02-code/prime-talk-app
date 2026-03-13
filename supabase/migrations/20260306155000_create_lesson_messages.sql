-- Lesson chat messages
CREATE TABLE IF NOT EXISTS lesson_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_rooms(id),
  sender_id uuid,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
