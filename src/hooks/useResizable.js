// useResizable: Custom hook for drag-to-resize functionality
import { useState, useEffect } from 'react';

export default function useResizable(initialSize = 30, minSize = 20, maxSize = 50) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newSize = (e.clientX / window.innerWidth) * 100;
      if (newSize >= minSize && newSize <= maxSize) {
        setSize(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minSize, maxSize]);

  return { size, startResize, isResizing };
}