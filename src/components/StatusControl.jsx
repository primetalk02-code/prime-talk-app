import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STATUS_OPTIONS = ["offline", "online", "standby", "standby_for_reservation"];

export default function StatusControl({ status, setStatus, availableForReservations, setAvailableForReservations, teacherId }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await supabase
      .from("teacher_status")
      .update({ status: newStatus })
      .eq("teacher_id", teacherId);
    setDropdownOpen(false);
  };

  const handleToggleReservations = async () => {
    setAvailableForReservations((prev) => !prev);
    await supabase
      .from("teacher_status")
      .update({ available_for_reservations: !availableForReservations })
      .eq("teacher_id", teacherId);
  };

  return (
    <div className="flex flex-col items-center mb-6">
      <div className={`text-lg font-bold mb-2 ${status === "standby_for_reservation" ? "border-4 border-yellow-400 animate-pulse rounded-full px-4" : ""}`}>Status: {status}</div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setDropdownOpen((open) => !open)}>
        Change Status
      </button>
      {dropdownOpen && (
        <div className="mt-2 bg-white border rounded shadow p-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              className="block w-full text-left px-2 py-1 hover:bg-blue-100"
              onClick={() => handleStatusChange(opt)}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      )}
      {status === "online" && (
        <div className="mt-4 flex items-center gap-2">
          <span>Available for Reservations:</span>
          <input type="checkbox" checked={availableForReservations} onChange={handleToggleReservations} />
        </div>
      )}
    </div>
  );
}
