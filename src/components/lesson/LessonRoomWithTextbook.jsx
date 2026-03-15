// LessonRoomWithTextbook: Main layout orchestrating the split-screen lesson experience
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import JaaSMeeting from './JaaSMeeting';
import TextbookViewer from './TextbookViewer';
import TeacherInfoPanel from './TeacherInfoPanel';
import LessonControls from './LessonControls';
import StatusBar from './StatusBar';
import useResizable from '../../hooks/useResizable';
// Assume you have a custom hook to fetch lesson data
import useLessonData from '../../hooks/useLessonData';
console.log('✅ LessonRoomWithTextbook mounted');
export default function LessonRoomWithTextbook() {
  const { lessonId, reservationId } = useParams();
  const { size: videoWidth, startResize, isResizing } = useResizable(30, 20, 50);
  const [showTeacherPanel, setShowTeacherPanel] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWord, setSelectedWord] = useState(null);
  const [showDictionary, setShowDictionary] = useState(false);

  // Fetch lesson data using your existing hook
  const { lesson, teacher, material, viewerCount, loading } = useLessonData(lessonId || reservationId);

  // Handle word click from textbook
  const handleWordClick = (word, position) => {
    setSelectedWord({ word, position });
    setShowDictionary(true);
  };

  if (loading) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading lesson...</div>;
  if (!lesson) return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Lesson not found</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Status Bar */}
      <StatusBar viewerCount={viewerCount} teacherName={teacher?.name} />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-12"> {/* pt-12 to offset fixed status bar */}
        {/* Video Area - Resizable */}
        <div
          className="relative bg-black transition-all duration-300"
          style={{ width: `${videoWidth}%` }}
        >
          <JaaSMeeting
            roomName={lesson.roomName}
            jwt={lesson.jwt}
            onReady={() => console.log('JaaS ready')}
          />
          {/* Floating Controls */}
          <LessonControls
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            onToggleCamera={() => window.jaasInstance?.executeCommand('toggleCamera')}
            onToggleMic={() => window.jaasInstance?.executeCommand('toggleAudio')}
            onFilter={() => {}}
            onReconnect={() => window.jaasInstance?.executeCommand('reconnect')}
            onInterpretation={() => {}}
          />
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:bg-opacity-50 transition-colors"
            onMouseDown={startResize}
          />
        </div>

        {/* Textbook Area - 70% default, adjusts with resize */}
        <div className="flex-1 bg-gray-800 p-4 overflow-auto">
          <TextbookViewer
            material={material}
            currentPage={currentPage}
            totalPages={material?.totalPages || 1}
            onPageChange={setCurrentPage}
            onWordClick={handleWordClick}
          />
        </div>

        {/* Teacher Info Panel (toggleable) */}
        {showTeacherPanel && (
          <TeacherInfoPanel
            teacher={teacher}
            onClose={() => setShowTeacherPanel(false)}
            onFavorite={() => {}}
            onShare={() => {}}
            onNote={() => {}}
          />
        )}
      </div>

      {/* Dictionary Popup */}
      {showDictionary && selectedWord && (
        <VocabularyPopup
          word={selectedWord.word}
          position={selectedWord.position}
          onClose={() => setShowDictionary(false)}
          onSave={(word) => console.log('Save to vocab:', word)}
        />
      )}
    </div>
  );
}