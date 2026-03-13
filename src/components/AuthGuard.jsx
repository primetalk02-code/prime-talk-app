import { useAuth } from "../lib/authContext.jsx";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthGuard({ children }) {
  const { user, role, teacherStatus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    console.log("Logged in user:", user.id);
    console.log("User role:", role);
    console.log("Teacher status:", teacherStatus);
    if (role === "teacher") {
      if (teacherStatus === "pending") {
        navigate("/apply-teacher");
      } else if (teacherStatus === "approved") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/apply-teacher");
      }
    } else if (role === "student") {
      navigate("/student/dashboard");
    }
  }, [user, role, teacherStatus, navigate]);

  return children;
}
