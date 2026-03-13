import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function StudentProfile({ studentId }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from("students")
        .select("id, name, preferences")
        .eq("id", studentId)
        .maybeSingle();
      setProfile(data);
    }
    fetchProfile();
  }, [studentId]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="mb-4">
      <div className="font-bold">Name: {profile.name}</div>
      <div className="text-xs">Preferences: {profile.preferences}</div>
    </div>
  );
}
