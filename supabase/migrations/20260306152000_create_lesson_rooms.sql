-- Daily.co lesson rooms
CREATE TABLE IF NOT EXISTS lesson_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id),
  room_url TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
