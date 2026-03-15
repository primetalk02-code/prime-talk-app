// TeacherInfoPanel: Right sidebar with teacher details, ratings, tags, and actions
import React, { useState } from 'react';
import { HeartIcon, ShareIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function TeacherInfoPanel({ teacher, onClose, onFavorite, onShare, onNote }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'details', 'review'

  if (!teacher) return null;

  // Safe fallbacks for teacher data
  const safeTeacher = {
    name: teacher?.name || 'Teacher',
    avatar: teacher?.avatar || '/default-avatar.png',
    country: teacher?.country || 'Philippines',
    rating: teacher?.rating || 5.0,
    lessonCount: teacher?.lessonCount || 0,
    studentCount: teacher?.studentCount || 0,
    tags: teacher?.tags?.length ? teacher.tags : ['Friendly', 'Professional'],
    bio: teacher?.bio || 'Experienced English teacher',
    joinedDate: teacher?.joinedDate || '2026-01-01'
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto">
      {/* Header with close button */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="font-bold text-lg">Teacher Info</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Teacher profile summary */}
      <div className="p-4 text-center border-b border-gray-700">
        <img
          src={safeTeacher.avatar}
          alt={safeTeacher.name}
          className="w-20 h-20 rounded-full mx-auto mb-2 object-cover"
        />
        <h3 className="font-bold text-xl">{safeTeacher.name}</h3>
        <p className="text-sm text-gray-400">{safeTeacher.country}</p>

        {/* Stats row */}
        <div className="flex justify-center space-x-3 mt-2 text-xs">
          <span className="bg-green-600 px-2 py-1 rounded flex items-center">
            <span>⭐</span> {safeTeacher.rating.toFixed(2)}
          </span>
          <span className="bg-gray-700 px-2 py-1 rounded">
            {safeTeacher.lessonCount} lessons
          </span>
          <span className="bg-gray-700 px-2 py-1 rounded">
            {safeTeacher.studentCount} students
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3 justify-center">
          {safeTeacher.tags.map(tag => (
            <span key={tag} className="bg-gray-700 text-xs px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-around mt-4">
          <button
            onClick={() => {
              setIsFavorited(!isFavorited);
              onFavorite?.();
            }}
            className="flex flex-col items-center text-xs"
          >
            {isFavorited ? (
              <HeartSolidIcon className="w-6 h-6 text-red-500" />
            ) : (
              <HeartIcon className="w-6 h-6 text-gray-300" />
            )}
            <span>Favorite</span>
          </button>
          <button onClick={onShare} className="flex flex-col items-center text-xs">
            <ShareIcon className="w-6 h-6 text-gray-300" />
            <span>Share</span>
          </button>
          <button onClick={onNote} className="flex flex-col items-center text-xs">
            <PencilSquareIcon className="w-6 h-6 text-gray-300" />
            <span>Keep Note</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {['profile', 'details', 'review'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium uppercase ${
              activeTab === tab ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
            }`}
          >
            {tab === 'profile' ? "TUTOR'S PROFILE" : tab === 'details' ? 'LESSON DETAILS' : 'REVIEW'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4 flex-1">
        {activeTab === 'profile' && (
          <div>
            <p className="text-sm text-gray-300">{safeTeacher.bio}</p>
            <p className="text-sm text-gray-400 mt-2">Member since: {safeTeacher.joinedDate}</p>
          </div>
        )}
        {activeTab === 'details' && (
          <div className="text-sm text-gray-300">
            <p>Lesson style: Conversational, structured</p>
            <p>Materials: Daily News, Free Talk</p>
            <p>Cancellation policy: 24h notice</p>
          </div>
        )}
        {activeTab === 'review' && (
          <div className="text-sm text-gray-300">
            <p>No reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}