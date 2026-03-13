import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SLOT_TIMES = HOURS.flatMap((h) => [
  `${h.toString().padStart(2, "0")}:00`,
  `${h.toString().padStart(2, "0")}:30`,
]);

export default function CalendarSchedule({ teacherId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);

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

  const handleSlotToggle = async (slotTime) => {
    const dateStr = selectedDate.toISOString().split("T")[0];
    const slot = slots.find((s) => s.slot_time === slotTime);
    if (slot) {
      const newStatus = slot.status === "available" ? "unavailable" : "available";
      await supabase
        .from("schedules")
        .update({ status: newStatus })
        .eq("id", slot.id);
    } else {
      await supabase
        .from("schedules")
        .insert({ teacher_id: teacherId, date: dateStr, slot_time: slotTime, status: "available" });
    }
    // Refresh slots
    const { data } = await supabase
      .from("schedules")
      .select("id, slot_time, status")
      .eq("teacher_id", teacherId)
      .eq("date", dateStr);
    setSlots(data || []);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
          style={{
            padding: '6px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          &lt;
        </button>
        <span style={{ fontWeight: '700', fontSize: '16px' }}>{selectedDate.toDateString()}</span>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
          style={{
            padding: '6px 12px',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer'
          }}
        >
          &gt;
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {SLOT_TIMES.map((slotTime) => {
          const slot = slots.find((s) => s.slot_time === slotTime);
          const status = slot ? slot.status : "unavailable";
          let backgroundColor = '#E2E8F0'; // unavailable
          if (status === "available") backgroundColor = '#DCFCE7';
          if (status === "reserved") backgroundColor = '#FEF3C7';
          
          return (
            <button
              key={slotTime}
              style={{
                padding: '8px 6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                backgroundColor,
                cursor: status === "reserved" ? 'not-allowed' : 'pointer',
                opacity: status === "reserved" ? 0.6 : 1
              }}
              onClick={() => handleSlotToggle(slotTime)}
              disabled={status === "reserved"}
            >
              {slotTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}
