
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function AvailableTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true);
      // Find teachers with at least one available slot today
      const today = new Date().toISOString().split("T")[0];
      const { data: slots } = await supabase
        .from("teacher_availability")
        .select("teacher_id, start_time, end_time")
        .eq("day", today);
      const teacherIds = [...new Set((slots || []).map((s) => s.teacher_id))];
      if (teacherIds.length === 0) {
        setTeachers([]);
        setLoading(false);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .in("id", teacherIds);
      setTeachers(
        (profiles || []).map((profile) => {
          const slot = slots.find((s) => s.teacher_id === profile.id);
          return {
            ...profile,
            start_time: slot?.start_time,
            end_time: slot?.end_time,
          };
        })
      );
      setLoading(false);
    }
    fetchTeachers();
  }, []);

  return (
    <section className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Available Teachers</h2>
      {loading ? (
        <div className="rounded-xl bg-white p-4 shadow">Loading...</div>
      ) : teachers.length === 0 ? (
        <div className="rounded-xl bg-white p-4 shadow">No teachers available right now.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="rounded-xl bg-white p-4 shadow flex items-center justify-between">
              <div className="flex items-center gap-4">
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-500">
                    {t.full_name ? t.full_name[0] : t.email[0]}
                  </div>
                )}
                <div>
                  <div className="font-bold text-lg">{t.full_name || t.email}</div>
                  <div className="text-xs text-slate-500">{t.email}</div>
                  <div className="text-xs text-slate-400">Available: {t.start_time?.slice(0,5)} - {t.end_time?.slice(0,5)}</div>
                </div>
              </div>
              <button
                className="bg-sky-600 text-white px-4 py-2 rounded shadow hover:bg-sky-700 font-semibold transition"
                onClick={() => navigate(`/start-lesson/${t.id}`)}
              >
                Start Lesson
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
