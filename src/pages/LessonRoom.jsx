import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { JaaSMeeting } from '@jitsi/react-sdk';

export default function LessonRoom({ lessonId, userId, userName, email, jwt, roomName }) {
  const { id: urlLessonId } = useParams();
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJitsiReady, setIsJitsiReady] = useState(false);

  // Use props or URL params
  const finalLessonId = lessonId || urlLessonId;
  const finalRoomName = roomName || `lesson-${finalLessonId}`;

  // Handle Jitsi API ready
  const handleJitsiApiReady = (api) => {
    console.log('Jitsi API ready:', api);
    setIsJitsiReady(true);
    
    // Store API instance globally for controls
    window.jaasInstance = api;
    
    // Optional: Configure Jitsi further
    api.addEventListener('videoConferenceJoined', () => {
      console.log('User joined the conference');
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, {
        id: Date.now(),
        text: newMessage,
        user: userName || 'You',
        timestamp: new Date().toLocaleTimeString()
      }]);
      setNewMessage('');
    }
  };

  const toggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Content Area (95% height) */}
      <div className="flex-1 flex">
        {/* Textbook Section (80% width) */}
        <div className="flex-1 bg-gray-800 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Lesson Textbook</h1>
            <div className="bg-white text-black p-6 rounded-lg shadow-lg">
              <p className="text-gray-700 mb-4">
                Welcome to your English lesson! This is the textbook area where you can view 
                lesson materials, read passages, and follow along with the content.
              </p>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold mb-2">Today's Topic</h2>
                  <p className="text-gray-600">Daily Conversation Practice</p>
                </div>
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold mb-2">Learning Objectives</h2>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Practice everyday conversation phrases</li>
                    <li>Improve pronunciation and intonation</li>
                    <li>Build confidence in speaking</li>
                  </ul>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Conversation Practice</h2>
                  <div className="bg-gray-100 p-4 rounded">
                    <p className="text-gray-800 font-medium">Teacher:</p>
                    <p className="text-gray-700">"How was your weekend?"</p>
                    <p className="text-gray-800 font-medium mt-2">Student:</p>
                    <p className="text-gray-700">"It was great, thank you! I went to the park."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Section (15% width) */}
        <div className="w-3/12 bg-black relative">
          <JaaSMeeting
            domain="meet.jitsi.si"
            roomName={finalRoomName}
            jwt={jwt}
            configOverwrite={{
              toolbarButtons: ['microphone', 'camera', 'hangup'],
              filmstrip: { disabled: false, height: 60 },
              videoQuality: { standard: { maxBitrate: 200000 } },
              prejoinPageEnabled: false,
              disableDeepLinking: true,
              disableInviteFunctions: true,
              disableRemoteMute: true,
              disableModeratorIndicator: true
            }}
            interfaceConfigOverwrite={{
              TOOLBAR_ALWAYS_VISIBLE: false,
              SHOW_JITSI_WATERMARK: false,
              VERTICAL_FILMSTRIP: true,
              FILM_STRIP_MAX_HEIGHT: 60,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
              TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup'],
              VIDEO_LAYOUT_FIT: 'height'
            }}
            onApiReady={handleJitsiApiReady}
            style={{
              height: '100%',
              width: '100%',
              border: 'none'
            }}
          />
          
          {/* Compact Controls Overlay */}
          <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 rounded p-2">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => window.jaasInstance?.executeCommand('toggleAudio')}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
              >
                Mic
              </button>
              <button
                onClick={() => window.jaasInstance?.executeCommand('toggleVideo')}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
              >
                Cam
              </button>
              <button
                onClick={() => window.jaasInstance?.executeCommand('hangup')}
                className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
              >
                End
              </button>
            </div>
          </div>
        </div>

        {/* Chat Section (5% width, expands to 20%) */}
        <div 
          className={`bg-gray-800 border-l border-gray-700 transition-all duration-300 ${
            isChatExpanded ? 'w-1/5' : 'w-1/12'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <h3 className="font-semibold">Chat</h3>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-white"
              >
                {isChatExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.map((message) => (
                <div key={message.id} className="bg-gray-700 p-2 rounded">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{message.user}</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar (5% height) */}
      <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center justify-center space-x-4">
        <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
          Save Notes
        </button>
        <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded">
          Next Page
        </button>
        <button className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded">
          Vocabulary
        </button>
        <button 
          onClick={() => window.jaasInstance?.executeCommand('hangup')}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded"
        >
          End Lesson
        </button>
      </div>
    </div>
  );
}