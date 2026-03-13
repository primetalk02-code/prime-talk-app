import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ReservationList({ teacherId }) {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    async function fetchReservations() {
      const { data } = await supabase
        .from("reservations")
        .select("id, student_id, lesson_id, slot_time, status, created_at")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      setReservations(data || []);
    }
    fetchReservations();
  }, [teacherId]);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontWeight: '700', marginBottom: '8px', fontSize: '18px' }}>Reservations</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', border: '1px solid #E2E8F0', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'left' }}>Student</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'left' }}>Lesson</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'left' }}>Slot</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '8px', border: '1px solid #E2E8F0', textAlign: 'left' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{r.student_id}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{r.lesson_id}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{r.slot_time}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{r.status}</td>
                <td style={{ padding: '8px', border: '1px solid #E2E8F0' }}>{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
