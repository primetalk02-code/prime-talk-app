-- Schedule calendar for teachers
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id),
  date DATE NOT NULL,
  slot_time TIME NOT NULL,
  status TEXT CHECK (status IN ('available', 'unavailable', 'reserved')) NOT NULL DEFAULT 'unavailable',
  reservation_id uuid REFERENCES reservations(id),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Index for fast calendar lookup
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id_date ON schedules(teacher_id, date);
