import { useEffect } from "react";

export default function IncomingLessonSound({ play }) {
  useEffect(() => {
    if (play) {
      const audio = new Audio("/sounds/incoming.wav");
      audio.play();
    }
  }, [play]);
  return null;
}
