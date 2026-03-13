import { useState } from "react";
import { createReservation } from "../lib/lessonEngine";

export default function StudentBookingModal({ teacherId, studentId, date, time, onClose }) {
  const [textbook, setTextbook] = useState("");
  const [lessonRequest, setLessonRequest] = useState("");
  const [selfIntro, setSelfIntro] = useState(false);
  const [correction, setCorrection] = useState(false);
  const [freeMessage, setFreeMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      const reservationTime = `${date}T${time}:00`;
      const lessonRequestObj = {
        textbook,
        lessonRequest,
        selfIntro,
        correction,
        freeMessage,
      };
      await createReservation(teacherId, studentId, reservationTime, lessonRequestObj);
      setSuccess(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow max-w-xs w-full">
        <h3 className="font-bold mb-2">Book Lesson Slot</h3>
        <div className="mb-2 text-xs">{date} {time}</div>
        <input
          type="text"
          placeholder="Textbook"
          value={textbook}
          onChange={e => setTextbook(e.target.value)}
          className="w-full mb-2 px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="Lesson Request"
          value={lessonRequest}
          onChange={e => setLessonRequest(e.target.value)}
          className="w-full mb-2 px-2 py-1 border rounded"
        />
        <label className="flex items-center mb-2 text-xs">
          <input type="checkbox" checked={selfIntro} onChange={() => setSelfIntro(v => !v)} /> Self Introduction
        </label>
        <label className="flex items-center mb-2 text-xs">
          <input type="checkbox" checked={correction} onChange={() => setCorrection(v => !v)} /> Correction Preference
        </label>
        <textarea
          placeholder="Free Message"
          value={freeMessage}
          onChange={e => setFreeMessage(e.target.value)}
          className="w-full mb-2 px-2 py-1 border rounded"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
          onClick={handleBook}
          disabled={loading || success}
        >
          {loading ? "Booking..." : success ? "Booked!" : "Book Lesson"}
        </button>
        {success && (
          <div className="mt-2 text-green-600 text-xs font-bold text-center">🎉 Congratulations! Your lesson has been booked.</div>
        )}
        <button className="mt-4 text-xs underline w-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
