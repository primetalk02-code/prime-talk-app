import IncomingLessonSound from "./IncomingLessonSound";

export default function TeacherInstantLessonPopup({ visible, onAccept, studentEmail }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex animate-pulse items-center justify-center">
      <IncomingLessonSound play={visible} />
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 border-4 border-blue-500">
        <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Incoming Instant Lesson</h2>
        <div className="mb-4 text-center text-slate-700 dark:text-slate-200">
          Student: <span className="font-semibold">{studentEmail}</span>
        </div>
        <button
          className="bg-green-500 text-white px-6 py-2 rounded shadow hover:bg-green-600 text-lg font-bold w-full"
          onClick={onAccept}
        >
          Accept Lesson
        </button>
      </div>
    </div>
  );
}
