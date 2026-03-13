import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STATUS_OPTIONS = [
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
  { value: "standby", label: "Standby" },
  { value: "busy", label: "Busy" },
];

export default function TeacherStatusControl({ teacherId, status, setStatus, availableForReservations, setAvailableForReservations }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setLoading(true);
    await supabase
      .from("teacher_status")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("teacher_id", teacherId);
    setStatus(newStatus);
    setLoading(false);
  };

  const handleReservationToggle = async () => {
    setLoading(true);
    await supabase
      .from("teacher_status")
      .update({ available_for_reservations: !availableForReservations })
      .eq("teacher_id", teacherId);
    setAvailableForReservations((v) => !v);
    setLoading(false);
  };

  return (
    <div className="mb-4 flex items-center gap-4">
      <select
        value={status}
        onChange={handleStatusChange}
        className="px-2 py-1 rounded border"
        disabled={loading}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={availableForReservations}
          onChange={handleReservationToggle}
          disabled={loading}
        />
        Available for reservations
      </label>
      {status === "standby" && (
        <span className="animate-pulse text-green-500 font-bold">Standby</span>
      )}
    </div>
  );
}
