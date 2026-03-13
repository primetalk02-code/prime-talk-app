import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import StudentBookingModal from "./StudentBookingModal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = Array.from({ length: 24 }, (_, h) => [
  `${h.toString().padStart(2, "0")}:00`,
  `${h.toString().padStart(2, "0")}:30`,
]).flat();

function getWeekDates() {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function StudentBookingCalendar({ teacherId, studentId }) {
  const [weekDates] = useState(getWeekDates());
  const [availability, setAvailability] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    async function fetchAvailability() {
      const { data } = await supabase
        .from("availability")
        .select("date, start_time, is_available")
        .eq("teacher_id", teacherId)
        .in("date", weekDates.map(d => d.toISOString().split("T")[0]));
      const slots = {};
      (data || []).forEach(av => {
        const key = `${av.date}-${av.start_time}`;
        slots[key] = av.is_available;
      });
      setAvailability(slots);
    }
    fetchAvailability();
  }, [teacherId, weekDates]);

  const handleSlotClick = (date, time) => {
    const key = `${date}-${time}`;
    if (availability[key]) {
      setSelectedSlot({ date, time });
    }
  };

  return (
    <div className="rounded-xl shadow-lg bg-white dark:bg-slate-900 p-6 mb-6">
      <h3 className="font-bold mb-4 text-lg">Book a Lesson</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg">
          <thead>
            <tr>
              <th className="px-2 py-1 border bg-slate-100 dark:bg-slate-800"></th>
              {weekDates.map((d, i) => (
                <th key={i} className="px-2 py-1 border bg-slate-100 dark:bg-slate-800">
                  {DAYS[i]}<br />{d.toLocaleDateString()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((time) => (
              <tr key={time}>
                <td className="px-2 py-1 border bg-slate-50 dark:bg-slate-700 text-xs">{time}</td>
                {weekDates.map((d) => {
                  const dateStr = d.toISOString().split("T")[0];
                  const key = `${dateStr}-${time}`;
                  const isAvailable = !!availability[key];
                  return (
                    <td
                      key={key}
                      className={`px-2 py-1 border text-xs cursor-pointer rounded ${isAvailable ? "bg-green-200 dark:bg-green-700" : "bg-gray-100 dark:bg-slate-800"}`}
                      onClick={() => handleSlotClick(dateStr, time)}
                    >
                      {isAvailable ? "✓" : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedSlot && (
        <StudentBookingModal
          teacherId={teacherId}
          studentId={studentId}
          date={selectedSlot.date}
          time={selectedSlot.time}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
