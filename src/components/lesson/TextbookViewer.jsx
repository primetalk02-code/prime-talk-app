// TextbookViewer: Displays PDF or text content with page navigation and word click
import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';

// Try to import CSS, but don't fail if it doesn't exist
try {
  require('react-pdf/dist/esm/Page/AnnotationLayer.css');
} catch (e) {
  console.log('PDF annotation CSS not loaded - this is OK');
}

export default function TextbookViewer({ material, currentPage, totalPages, onPageChange, onWordClick }) {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);

  const handlePrev = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));

  if (!material) {
    return <div className="text-center text-gray-400">No material available</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold truncate">{material.title || 'Lesson Material'}</h2>
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Previous
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600"
          >
            Next
          </button>
          <button
            onClick={() => setScale(scale + 0.1)}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            +
          </button>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            -
          </button>
        </div>
      </div>

      {/* Content area - Simplified for now */}
      <div className="flex-1 overflow-auto bg-gray-700 rounded-lg p-6">
        {material.type === 'pdf' ? (
          <Document
            file={material.url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="text-center">Loading PDF...</div>}
            error={<div className="text-center text-red-400">Failed to load PDF</div>}
          >
            <Page 
              pageNumber={currentPage} 
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        ) : (
          // Text content with clickable words
          <div
            className="text-lg leading-relaxed"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
          >
            {material.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4">
                {paragraph.split(' ').map((word, i) => (
                  <span
                    key={i}
                    className="cursor-pointer hover:bg-yellow-500 hover:bg-opacity-30 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWordClick(word, { x: e.clientX, y: e.clientY });
                    }}
                  >
                    {word}{' '}
                  </span>
                ))}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}