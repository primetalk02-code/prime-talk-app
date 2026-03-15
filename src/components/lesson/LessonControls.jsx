// LessonControls: Floating control bar over video (camera, mic, filter, reconnect, interpretation)
import React, { useState } from 'react';
import {
  CameraIcon,
  MicrophoneIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  LanguageIcon,
} from '@heroicons/react/24/solid';

export default function LessonControls({ className, onToggleCamera, onToggleMic, onFilter, onReconnect, onInterpretation }) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const handleCamera = () => {
    setCameraOn(!cameraOn);
    onToggleCamera?.();
  };

  const handleMic = () => {
    setMicOn(!micOn);
    onToggleMic?.();
  };

  return (
    <div className={`flex space-x-2 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-2 ${className}`}>
      <button
        onClick={handleCamera}
        className={`p-3 rounded-full transition-colors ${cameraOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
        title="Toggle camera"
      >
        <CameraIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={handleMic}
        className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
        title="Toggle microphone"
      >
        <MicrophoneIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={onFilter}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        title="Video filters"
      >
        <AdjustmentsHorizontalIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={onReconnect}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        title="Reconnect"
      >
        <ArrowPathIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={onInterpretation}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        title="Interpretation"
      >
        <LanguageIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}