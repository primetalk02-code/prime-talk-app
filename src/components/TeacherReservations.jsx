import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TeacherReservations({ teacherId }) {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    async function fetchReservations() {
      const { data } = await supabase
        .from("reservations")
        .select("id, student_id, reservation_time, lesson_request")
        .eq("teacher_id", teacherId)
        .order("reservation_time", { ascending: true });
      setReservations(data || []);
    }
    fetchReservations();
  }, [teacherId]);

  return (
    <div className="rounded-xl shadow-lg bg-white dark:bg-slate-900 p-6 mb-6">
      <h3 className="font-bold mb-4 text-lg">Reservations</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 border bg-slate-100 dark:bg-slate-800">Student</th>
              <th className="px-2 py-1 border bg-slate-100 dark:bg-slate-800">Time</th>
              <th className="px-2 py-1 border bg-slate-100 dark:bg-slate-800">Request</th>
              <th className="px-2 py-1 border bg-slate-100 dark:bg-slate-800">Textbook</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td className="px-2 py-1 border">{r.student_id}</td>
                <td className="px-2 py-1 border">{new Date(r.reservation_time).toLocaleString()}</td>
                <td className="px-2 py-1 border">{r.lesson_request?.lessonRequest || ""}</td>
                <td className="px-2 py-1 border">{r.lesson_request?.textbook || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
