import React, { useState, useEffect, useRef } from 'react';

export default function IncomingLessonAlert({ onAccept, onDecline }) {
  const [seconds, setSeconds] = useState(30);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onDecline]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Incoming Lesson Request</h2>
        <p className="mb-4">A teacher wants to start a lesson with you.</p>
        <p className="mb-6 text-center text-2xl font-mono">{seconds}s</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onAccept}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Decline
          </button>
        </div>
        <audio ref={audioRef} src="/sounds/incoming.mp3" loop />
      </div>
    </div>
  );
}