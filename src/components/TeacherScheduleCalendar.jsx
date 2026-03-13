import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

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

export default function TeacherScheduleCalendar({ teacherId }) {
  const [selectedSlots, setSelectedSlots] = useState({});
  const [weekDates] = useState(getWeekDates());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAvailability() {
      const { data } = await supabase
        .from("availability")
        .select("date, start_time, end_time, is_available")
        .eq("teacher_id", teacherId)
        .in("date", weekDates.map(d => d.toISOString().split("T")[0]));
      const slots = {};
      (data || []).forEach(av => {
        const key = `${av.date}-${av.start_time}`;
        slots[key] = av.is_available;
      });
      setSelectedSlots(slots);
    }
    fetchAvailability();
  }, [teacherId, weekDates]);

  const handleSlotToggle = (date, time) => {
    const key = `${date}-${time}`;
    setSelectedSlots(slots => ({ ...slots, [key]: !slots[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    for (const day of weekDates) {
      const dateStr = day.toISOString().split("T")[0];
      for (const time of TIMES) {
        const key = `${dateStr}-${time}`;
        const isAvailable = !!selectedSlots[key];
        await supabase
          .from("availability")
          .upsert({
            teacher_id: teacherId,
            date: dateStr,
            start_time: time,
            end_time: time,
            is_available: isAvailable,
          }, { onConflict: ["teacher_id", "date", "start_time"] });
      }
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl shadow-lg bg-white dark:bg-slate-900 p-6 mb-6">
      <h3 className="font-bold mb-4 text-lg">Availability Calendar</h3>
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
                  const isAvailable = !!selectedSlots[key];
                  return (
                    <td
                      key={key}
                      className={`px-2 py-1 border text-xs cursor-pointer rounded ${isAvailable ? "bg-green-200 dark:bg-green-700" : "bg-gray-100 dark:bg-slate-800"}`}
                      onClick={() => handleSlotToggle(dateStr, time)}
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
      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded shadow disabled:opacity-50"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
}
