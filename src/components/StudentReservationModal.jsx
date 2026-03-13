import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function StudentReservationModal({ teacherId, studentId, slotTime, onClose, onReserved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReserve = async () => {
    setLoading(true);
    setError("");
    try {
      const { error: insertError } = await supabase
        .from("reservations")
        .insert({ teacher_id: teacherId, student_id: studentId, slot_time: slotTime, status: "reserved" });
      if (insertError) throw insertError;
      onReserved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-xs w-full">
        <h3 className="font-bold mb-2">Reserve Lesson Slot</h3>
        <div className="mb-4 text-xs">Slot: {slotTime}</div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
          onClick={handleReserve}
          disabled={loading}
        >
          {loading ? "Reserving..." : "Reserve"}
        </button>
        {error && <div className="text-red-500 mt-2 text-xs">{error}</div>}
        <button className="mt-4 text-xs underline w-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
