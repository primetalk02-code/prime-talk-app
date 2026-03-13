import TeacherReservations from "./TeacherReservations";
import TeacherScheduleCalendar from "./TeacherScheduleCalendar";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import TeacherStatusControl from "./TeacherStatusControl";
import CalendarSchedule from "./CalendarSchedule";
import ReservationList from "./ReservationList";
import InstantLessonPanel from "./InstantLessonPanel";

export default function TeacherDashboard({ teacherId }) {
  const [status, setStatus] = useState("offline");
  const [availableForReservations, setAvailableForReservations] = useState(false);
  const [instantLessonUrl, setInstantLessonUrl] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      const { data } = await supabase
        .from("teacher_status")
        .select("status, available_for_reservations")
        .eq("teacher_id", teacherId)
        .maybeSingle();
      if (data) {
        setStatus(data.status);
        setAvailableForReservations(data.available_for_reservations);
      }
    }
    fetchStatus();
  }, [teacherId]);

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '16px' }}>
      <TeacherStatusControl
        teacherId={teacherId}
        status={status}
        setStatus={setStatus}
        availableForReservations={availableForReservations}
        setAvailableForReservations={setAvailableForReservations}
      />
      <TeacherScheduleCalendar teacherId={teacherId} />
      <CalendarSchedule teacherId={teacherId} />
      <ReservationList teacherId={teacherId} />
      <TeacherReservations teacherId={teacherId} />
      <InstantLessonPanel teacherId={teacherId} status={status} onStartLesson={setInstantLessonUrl} />
      {instantLessonUrl && (
        <div style={{ marginTop: '16px' }}>
          <a
            href={instantLessonUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#10B981',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Join Instant Lesson
          </a>
        </div>
      )}
    </div>
  );
}
