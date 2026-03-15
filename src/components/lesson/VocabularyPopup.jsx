// VocabularyPopup: Dictionary popup that appears when clicking a word in the textbook
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function VocabularyPopup({ word, position, onClose, onSave }) {
  const [definition, setDefinition] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef();

  // Mock dictionary lookup – replace with actual API call
  useEffect(() => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setDefinition({
        word: word,
        pronunciation: '/rɪˈdjuːs/',
        partOfSpeech: 'verb',
        definition: 'to make something smaller or less in amount, degree, or size',
        example: 'We should reduce the amount of waste we produce.',
      });
      setLoading(false);
    }, 300);
  }, [word]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay within viewport
  const getAdjustedPosition = () => {
    const popupWidth = 320; // w-80 = 20rem = 320px
    const popupHeight = 250; // approximate
    let left = position.x;
    let top = position.y;

    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    if (top + popupHeight > window.innerHeight) {
      top = window.innerHeight - popupHeight - 10;
    }
    return { left, top };
  };

  const { left, top } = getAdjustedPosition();

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[100] w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 text-white"
      style={{ left, top }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <h3 className="font-bold text-lg">{word}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : definition ? (
          <>
            <div className="mb-2">
              <span className="text-sm text-gray-400">{definition.pronunciation}</span>
              <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded">{definition.partOfSpeech}</span>
            </div>
            <p className="text-sm mb-2">{definition.definition}</p>
            <p className="text-sm italic text-gray-400">"{definition.example}"</p>
          </>
        ) : (
          <p className="text-sm text-red-400">Definition not found.</p>
        )}
      </div>

      {/* Footer with save button */}
      <div className="flex justify-end p-2 border-t border-gray-700">
        <button
          onClick={() => {
            setIsSaved(!isSaved);
            onSave?.(word);
          }}
          className="flex items-center space-x-1 text-sm px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {isSaved ? (
            <BookmarkSolidIcon className="w-4 h-4 text-yellow-500" />
          ) : (
            <BookmarkIcon className="w-4 h-4" />
          )}
          <span>{isSaved ? 'Saved' : 'Save to vocabulary'}</span>
        </button>
      </div>
    </div>,
    document.body
  );
}