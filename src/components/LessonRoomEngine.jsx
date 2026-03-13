import { useEffect, useRef, useState } from 'react'
import { updateLessonStatus } from '../lib/lessonEngine'
import ReconnectionProtection from './ReconnectionProtection'

export default function LessonRoomEngine({ lessonId, onRecordingUrl, onLessonEnd }) {
  const [disconnected, setDisconnected] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')
  const reconnectTimeout = useRef(null)

  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
    }
  }, [])

  const handleConnectionLost = () => {
    setDisconnected(true)
    reconnectTimeout.current = setTimeout(() => {
      void updateLessonStatus(lessonId, 'completed', new Date().toISOString())
      onLessonEnd?.()
    }, 60_000)
  }

  const handleConnectionRecovered = () => {
    setDisconnected(false)
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
  }

  const handleRecordingFinished = (url) => {
    setRecordingUrl(url)
    void updateLessonStatus(lessonId, 'completed', new Date().toISOString(), url)
    onRecordingUrl?.(url)
    onLessonEnd?.()
  }

  return (
    <div>
      <button type="button" className="hidden" onClick={handleConnectionLost} />
      <button type="button" className="hidden" onClick={handleConnectionRecovered} />
      <button type="button" className="hidden" onClick={() => handleRecordingFinished(recordingUrl)} />
      {disconnected && <ReconnectionProtection onTimeout={() => onLessonEnd?.()} />}
      {recordingUrl && (
        <div className="mt-2 rounded bg-green-100 px-4 py-2 text-xs text-green-800">
          Recording saved:{' '}
          <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
            View Recording
          </a>
        </div>
      )}
    </div>
  )
}
