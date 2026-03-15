// StatusBar: Displays time, LIVE indicator, viewer count, and teacher name
import React from 'react';

export default function StatusBar({ viewerCount, teacherName, currentTime }) {
  const now = currentTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 z-50 px-6 py-2">
      <div className="flex items-center justify-between text-white text-sm">
        {/* Left side: Time and LIVE indicator */}
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">{now}</span>
          <div className="flex items-center space-x-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-medium">LIVE</span>
            {viewerCount !== undefined && (
              <span className="text-gray-300">{viewerCount} viewing</span>
            )}
          </div>
        </div>

        {/* Right side: Teacher name */}
        {teacherName && (
          <span className="font-medium truncate max-w-[200px]">{teacherName}</span>
        )}
      </div>
    </div>
  );
}