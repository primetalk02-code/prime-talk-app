export async function startInstantLesson(studentId) {
  // Call backend API to match teacher and create Daily room
  const res = await fetch("/api/create-instant-lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId }),
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error(data.error || "Failed to start instant lesson");
  return data;
}

export async function createReservation(teacherId, studentId, reservationTime, lessonRequest = {}) {
  const res = await fetch("/api/create-reservation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teacherId, studentId, reservationTime, lessonRequest }),
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error(data.error || "Failed to create reservation");
  return data;
}

export async function updateLessonStatus(lessonId, status, endedAt = null, recordingUrl = null) {
  const res = await fetch("/api/update-lesson-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonId, status, endedAt, recordingUrl }),
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error(data.error || "Failed to update lesson status");
  return data;
}
