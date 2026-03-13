-- Index for fast teacher online lookup
CREATE INDEX IF NOT EXISTS idx_teacher_status_online ON teacher_status(status);
