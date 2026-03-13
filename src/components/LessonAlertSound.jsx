import { useEffect } from "react";

export default function LessonAlertSound({ play }) {
  useEffect(() => {
    if (play) {
      const audio = new Audio("/sounds/lesson-alert.wav");
      audio.play();
    }
  }, [play]);
  return null;
}
