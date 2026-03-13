import { useEffect, useRef, useState } from "react";

export default function ReconnectionProtection({ onTimeout, timeout = 60 }) {
  const [remaining, setRemaining] = useState(timeout);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (remaining <= 0) {
      clearInterval(timerRef.current);
      onTimeout && onTimeout();
    }
  }, [remaining, onTimeout]);

  return (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mt-2 text-xs">
      Reconnect within {remaining} seconds...
    </div>
  );
}
