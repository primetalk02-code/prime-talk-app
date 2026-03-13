import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import StudentReservationModal from "./StudentReservationModal";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_TIMES = HOURS.flatMap((h) => [
  `${h.toString().padStart(2, "0")}:00`,
  `${h.toString().padStart(2, "0")}:30`,
]);

export default function StudentCalendarSchedule({ teacherId, studentId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [modalSlot, setModalSlot] = useState(null);

  useEffect(() => {
    async function fetchSlots() {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const { data } = await supabase
        .from("schedules")
        .select("id, slot_time, status")
        .eq("teacher_id", teacherId)
        .eq("date", dateStr);
      setSlots(data || []);
    }
    fetchSlots();
  }, [teacherId, selectedDate]);

  const handleReserve = (slotTime) => {
    setModalSlot(slotTime);
  };

  const handleReserved = async () => {
    // Refresh slots after reservation
    const dateStr = selectedDate.toISOString().split("T")[0];
    const { data } = await supabase
      .from("schedules")
      .select("id, slot_time, status")
      .eq("teacher_id", teacherId)
      .eq("date", dateStr);
    setSlots(data || []);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}>&lt;</button>
        <span className="font-bold">{selectedDate.toDateString()}</span>
        <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}>&gt;</button>
      </div>
      <div className="grid grid-cols-6 gap-2">
        {SLOT_TIMES.map((slotTime) => {
          const slot = slots.find((s) => s.slot_time === slotTime);
          const status = slot ? slot.status : "unavailable";
          return (
            <button
              key={slotTime}
              className={`px-2 py-1 rounded border text-xs ${status === "available" ? "bg-green-200" : status === "reserved" ? "bg-yellow-200" : "bg-gray-200"}`}
              onClick={() => status === "available" && handleReserve(slotTime)}
              disabled={status !== "available"}
            >
              {slotTime}
            </button>
          );
        })}
      </div>
      {modalSlot && (
        <StudentReservationModal
          teacherId={teacherId}
          studentId={studentId}
          slotTime={modalSlot}
          onClose={() => setModalSlot(null)}
          onReserved={handleReserved}
        />
      )}
    </div>
  );
}
