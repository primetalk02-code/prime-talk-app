import StudentProfile from "./StudentProfile";
import StudentCalendarSchedule from "./StudentCalendarSchedule";
import StudentInstantLessonPanel from "./StudentInstantLessonPanel";
import { useState } from "react";

export default function StudentDashboard({ studentId, teacherId }) {
  const [instantLessonUrl, setInstantLessonUrl] = useState("");

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Student Dashboard</h2>
      <StudentProfile studentId={studentId} />
      <StudentCalendarSchedule teacherId={teacherId} studentId={studentId} />
      <StudentInstantLessonPanel studentId={studentId} onStartLesson={setInstantLessonUrl} />
      {instantLessonUrl && (
        <div className="mt-4">
          <a
            href={instantLessonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Join Instant Lesson
          </a>
        </div>
      )}
    </div>
  );
}
