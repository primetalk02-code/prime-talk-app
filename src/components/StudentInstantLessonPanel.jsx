import InstantLessonPanel from "./InstantLessonPanel";

export default function StudentInstantLessonPanel({ studentId, onStartLesson }) {
  return (
    <InstantLessonPanel studentId={studentId} onStartLesson={onStartLesson} />
  );
}
