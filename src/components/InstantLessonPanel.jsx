import { useState } from 'react'

export default function InstantLessonPanel({ teacherId, studentId, onStartLesson }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartInstantLesson = async () => {
    setLoading(true)
    setError('')
    try {
      // Call backend API to create Daily.co room
      const payload = teacherId ? { teacherId } : { studentId }
      const res = await fetch('/api/create-daily-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create room')
      }
      const roomUrl = data?.roomUrl || data?.url
      if (!roomUrl) {
        throw new Error('Failed to create room')
      }
      onStartLesson(roomUrl)
    } catch (e) {
      setError(e.message || 'Failed to start lesson')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-6">
      <h3 className="font-bold mb-2">Instant Lesson</h3>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleStartInstantLesson}
        disabled={loading}
      >
        {loading ? 'Starting...' : 'Start Instant Lesson'}
      </button>
      {error && <div className="text-red-500 mt-2 text-xs">{error}</div>}
    </div>
  )
}
