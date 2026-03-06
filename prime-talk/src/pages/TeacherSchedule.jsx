import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const START_MINUTES = 6 * 60
const END_MINUTES = 23 * 60 + 30
const STEP_MINUTES = 30

const pad = (value) => String(value).padStart(2, '0')

const formatDateYmd = (date) => {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

const startOfWeekMonday = (sourceDate) => {
  const date = new Date(sourceDate)
  const weekday = date.getDay()
  const offset = weekday === 0 ? -6 : 1 - weekday
  date.setDate(date.getDate() + offset)
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (sourceDate, daysToAdd) => {
  const date = new Date(sourceDate)
  date.setDate(date.getDate() + daysToAdd)
  return date
}

const normalizeClock = (clock) => {
  const [hours = '00', minutes = '00'] = String(clock).trim().split(':')
  return `${pad(hours)}:${pad(minutes)}`
}

const normalizeTimeSlot = (timeSlot) => {
  if (!timeSlot) {
    return ''
  }

  const raw = String(timeSlot).trim()

  if (raw.includes('-')) {
    const [start = '00:00'] = raw.split('-')
    return normalizeClock(start)
  }

  return normalizeClock(raw)
}

const buildCellKey = (date, timeSlot) => `${date}_${timeSlot}`

const parseCellKey = (cellKey) => {
  const [date, timeSlot] = cellKey.split('_')
  return { date, time_slot: timeSlot }
}

const buildTimeSlots = () => {
  const slots = []

  for (let minute = START_MINUTES; minute <= END_MINUTES; minute += STEP_MINUTES) {
    const start = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`

    slots.push({
      label: start,
      time_slot: start,
    })
  }

  return slots
}

function TeacherSchedule() {
  const [user, setUser] = useState(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))
  const [availabilityByKey, setAvailabilityByKey] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState([])

  const dragModeRef = useRef('add')
  const selectedKeySetRef = useRef(new Set())

  const timeSlots = useMemo(() => buildTimeSlots(), [])

  const weekDays = useMemo(() => {
    return DAY_NAMES.map((label, index) => {
      const date = addDays(weekStart, index)
      return {
        label,
        dateIso: formatDateYmd(date),
        shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })
  }, [weekStart])

  const weekRangeLabel = useMemo(() => {
    const weekEnd = addDays(weekStart, 6)
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} - ${endLabel}`
  }, [weekStart])

  const selectedLookup = useMemo(() => {
    return new Set(selectedSlots.map((slot) => buildCellKey(slot.date, slot.time_slot)))
  }, [selectedSlots])

  const setSelectionFromSet = useCallback((nextSet) => {
    selectedKeySetRef.current = nextSet
    setSelectedSlots(Array.from(nextSet).map(parseCellKey))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectionFromSet(new Set())
  }, [setSelectionFromSet])

  const fetchAvailability = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    setError('')

    const weekEnd = addDays(weekStart, 6)
    const weekStartDate = formatDateYmd(weekStart)
    const weekEndDate = formatDateYmd(weekEnd)

    try {
      const { data, error: fetchError } = await supabase
        .from('availability')
        .select('id, date, time_slot, status')
        .eq('teacher_id', user.id)
        .gte('date', weekStartDate)
        .lte('date', weekEndDate)

      if (fetchError) {
        throw fetchError
      }

      const nextAvailability = {}

      for (const slot of data || []) {
        const normalizedTimeSlot = normalizeTimeSlot(slot.time_slot)
        const cellKey = buildCellKey(slot.date, normalizedTimeSlot)

        nextAvailability[cellKey] = {
          id: slot.id,
          status:
            slot.status === 'available'
              ? 'available'
              : slot.status === 'booked'
                ? 'booked'
                : 'unavailable',
          date: slot.date,
          time_slot: normalizedTimeSlot,
        }
      }

      setAvailabilityByKey(nextAvailability)
    } catch (fetchFailure) {
      console.error(fetchFailure.message)
      setAvailabilityByKey({})
      setError(fetchFailure.message)
    } finally {
      setLoading(false)
    }
  }, [user, weekStart])

  const applySelectionStatus = useCallback(
    async (status) => {
      if (!user?.id || saving || selectedSlots.length === 0) {
        return
      }

      setSaving(true)
      setError('')

      try {
        const payload = selectedSlots.map((slot) => ({
          teacher_id: user.id,
          date: slot.date,
          time_slot: slot.time_slot,
          status,
        }))

        const { error: upsertError } = await supabase.from('availability').upsert(payload, {
          onConflict: 'teacher_id,date,time_slot',
        })

        if (upsertError) {
          throw upsertError
        }

        setToastMessage(
          `${selectedSlots.length} slot${selectedSlots.length === 1 ? '' : 's'} set to ${status}.`,
        )
        clearSelection()
        await fetchAvailability()
      } catch (updateError) {
        console.error(updateError.message)
        setError(updateError.message)
      } finally {
        setSaving(false)
      }
    },
    [clearSelection, fetchAvailability, saving, selectedSlots, user],
  )

  useEffect(() => {
    let isMounted = true

    const fetchCurrentTeacher = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!isMounted) {
          return
        }

        if (!user) {
          setError('Please sign in as a teacher to manage availability.')
          setLoading(false)
          return
        }

        setUser(user)
      } catch (authFailure) {
        console.error(authFailure.message)
        if (isMounted) {
          setError(authFailure.message)
          setLoading(false)
        }
      }
    }

    fetchCurrentTeacher()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    fetchAvailability()
  }, [user, fetchAvailability])

  useEffect(() => {
    if (!isDragging) {
      return undefined
    }

    const stopDragging = () => {
      setIsDragging(false)
    }

    window.addEventListener('mouseup', stopDragging)
    return () => {
      window.removeEventListener('mouseup', stopDragging)
    }
  }, [isDragging])

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timeout = window.setTimeout(() => setToastMessage(''), 3000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [toastMessage])

  const moveWeek = (offset) => {
    setIsDragging(false)
    setWeekStart((currentWeekStart) => startOfWeekMonday(addDays(currentWeekStart, offset * 7)))
    clearSelection()
  }

  const toggleSlotSelection = (slot) => {
    const key = buildCellKey(slot.date, slot.time_slot)
    const nextSet = new Set(selectedKeySetRef.current)

    if (nextSet.has(key)) {
      nextSet.delete(key)
      dragModeRef.current = 'remove'
    } else {
      nextSet.add(key)
      dragModeRef.current = 'add'
    }

    setSelectionFromSet(nextSet)
  }

  const handleCellMouseDown = (event, dayDate, slotValue) => {
    if (loading || saving) {
      return
    }

    event.preventDefault()
    setError('')
    setIsDragging(true)

    toggleSlotSelection({ date: dayDate, time_slot: slotValue })
  }

  const handleCellMouseEnter = (dayDate, slotValue) => {
    if (!isDragging || loading || saving) {
      return
    }

    const key = buildCellKey(dayDate, slotValue)
    const nextSet = new Set(selectedKeySetRef.current)

    if (dragModeRef.current === 'add') {
      nextSet.add(key)
    } else {
      nextSet.delete(key)
    }

    setSelectionFromSet(nextSet)
  }

  const renderCellContent = (slotStatus) => {
    if (slotStatus === 'booked') {
      return <span className="slot-text">Booked</span>
    }

    if (slotStatus === 'available') {
      return <span className="slot-text">Available</span>
    }

    return <span className="slot-text">Unavailable</span>
  }

  return (
    <div className="teacher-schedule-page">
      <div className="teacher-schedule-card">
        <header className="teacher-schedule-header">
          <div>
            <h1>Teacher Availability</h1>
            <p>Select slots by click or drag, then apply availability status.</p>
          </div>

          <div className="week-controls">
            <button type="button" onClick={() => moveWeek(-1)} disabled={loading || saving}>
              Prev
            </button>
            <div className="week-range">{weekRangeLabel}</div>
            <button type="button" onClick={() => moveWeek(1)} disabled={loading || saving}>
              Next
            </button>
            <button
              type="button"
              className="today-button"
              onClick={() => {
                setIsDragging(false)
                clearSelection()
                setWeekStart(startOfWeekMonday(new Date()))
              }}
              disabled={loading || saving}
            >
              This Week
            </button>
          </div>
        </header>

        {error && <div className="schedule-error">{error}</div>}
        {saving && <div className="schedule-saving">Updating selected slots...</div>}
        {toastMessage && (
          <div className="schedule-toast" role="status">
            {toastMessage}
          </div>
        )}

        {selectedSlots.length > 0 && (
          <div className="selection-panel">
            <p>{selectedSlots.length} slot{selectedSlots.length === 1 ? '' : 's'} selected</p>
            <div className="selection-actions">
              <button
                type="button"
                className="available-btn"
                onClick={() => void applySelectionStatus('available')}
                disabled={saving}
              >
                Set Available
              </button>
              <button
                type="button"
                className="unavailable-btn"
                onClick={() => void applySelectionStatus('unavailable')}
                disabled={saving}
              >
                Set Unavailable
              </button>
              <button type="button" className="cancel-btn" onClick={clearSelection} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <section className="schedule-grid-shell">
          {loading ? (
            <div className="schedule-skeleton" aria-label="Loading schedule grid">
              <div className="schedule-loading-row" role="status">
                <span className="schedule-spinner" />
                <span>Loading schedule...</span>
              </div>
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : (
            <div className="schedule-table-wrapper">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th className="time-column">Time</th>
                    {weekDays.map((day) => (
                      <th key={day.dateIso}>
                        <div className="day-name">{day.label}</div>
                        <div className="day-date">{day.shortDate}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot) => (
                    <tr key={timeSlot.time_slot}>
                      <th className="time-column">{timeSlot.label}</th>

                      {weekDays.map((day) => {
                        const cellKey = buildCellKey(day.dateIso, timeSlot.time_slot)
                        const slotStatus = availabilityByKey[cellKey]?.status || 'unavailable'
                        const isSelected = selectedLookup.has(cellKey)

                        const slotClass = `schedule-cell status-${slotStatus}${
                          isSelected ? ' status-selected' : ''
                        }`

                        return (
                          <td
                            key={cellKey}
                            className={slotClass}
                            onMouseDown={(event) => handleCellMouseDown(event, day.dateIso, timeSlot.time_slot)}
                            onMouseEnter={() => handleCellMouseEnter(day.dateIso, timeSlot.time_slot)}
                            onMouseUp={() => setIsDragging(false)}
                            role="presentation"
                          >
                            {renderCellContent(slotStatus)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .teacher-schedule-page {
          min-height: auto;
          padding: 0;
          background: transparent;
          color: #0f172a;
        }

        .teacher-schedule-card {
          max-width: 1200px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
        }

        .teacher-schedule-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .teacher-schedule-header h1 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 800;
          color: #0f172a;
        }

        .teacher-schedule-header p {
          margin: 8px 0 0;
          color: #475569;
          font-size: 0.93rem;
        }

        .week-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .week-controls button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .week-controls button:hover:not(:disabled) {
          border-color: #94a3b8;
          background: #f8fafc;
        }

        .week-controls button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .week-controls .today-button {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .week-range {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
          padding: 7px 10px;
          border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .schedule-error {
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #b91c1c;
          padding: 9px 12px;
          font-size: 0.9rem;
        }

        .schedule-saving {
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 9px 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .schedule-toast {
          margin-bottom: 12px;
          border-radius: 10px;
          border: 1px solid #bbf7d0;
          background: #ecfdf3;
          color: #15803d;
          padding: 9px 12px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .selection-panel {
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          position: sticky;
          top: 10px;
          z-index: 5;
          border-radius: 12px;
          border: 1px solid #bfdbfe;
          background: rgba(239, 246, 255, 0.96);
          padding: 10px 12px;
          box-shadow: 0 8px 20px rgba(30, 64, 175, 0.12);
          backdrop-filter: blur(4px);
        }

        .selection-panel p {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 700;
          color: #1d4ed8;
        }

        .selection-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .selection-actions button {
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease;
        }

        .selection-actions button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(0.95);
        }

        .selection-actions .available-btn {
          background: #22c55e;
          color: #ffffff;
        }

        .selection-actions .unavailable-btn {
          background: #64748b;
          color: #ffffff;
        }

        .selection-actions .cancel-btn {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #334155;
        }

        .selection-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .schedule-grid-shell {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
        }

        .schedule-table-wrapper {
          overflow: auto;
          max-height: 72vh;
        }

        .schedule-table {
          width: 100%;
          min-width: 920px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .schedule-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          padding: 10px 8px;
        }

        .day-name {
          font-size: 0.82rem;
          font-weight: 800;
        }

        .day-date {
          margin-top: 4px;
          font-size: 0.75rem;
          color: #64748b;
        }

        .time-column {
          width: 88px;
          min-width: 88px;
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          background: #f8fafc;
          position: sticky;
          left: 0;
          z-index: 1;
          border-right: 1px solid #e2e8f0;
        }

        .schedule-table tbody th {
          border-bottom: 1px solid #e2e8f0;
        }

        .schedule-cell {
          height: 42px;
          min-width: 116px;
          text-align: center;
          border-bottom: 1px solid #eef2f7;
          border-right: 1px solid #eef2f7;
          font-size: 0.72rem;
          font-weight: 700;
          position: relative;
          user-select: none;
          cursor: pointer;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .schedule-cell.status-available {
          background: #dcfce7;
          border-color: #86efac;
        }

        .schedule-cell.status-unavailable {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .schedule-cell.status-booked {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .schedule-cell.status-selected {
          box-shadow: inset 0 0 0 2px #2563eb;
        }

        .schedule-cell:hover {
          filter: brightness(0.97);
        }

        .slot-text {
          color: #0f172a;
          font-size: 0.68rem;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .schedule-cell.status-available .slot-text {
          color: #166534;
        }

        .schedule-cell.status-unavailable .slot-text {
          color: #334155;
        }

        .schedule-cell.status-booked .slot-text {
          color: #991b1b;
        }

        .schedule-skeleton {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .schedule-loading-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 9px 12px;
          font-size: 0.9rem;
          font-weight: 700;
          width: fit-content;
        }

        .schedule-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #bfdbfe;
          border-top-color: #1d4ed8;
          border-radius: 999px;
          animation: schedule-spin 0.8s linear infinite;
        }

        @keyframes schedule-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .skeleton-row {
          height: 34px;
          border-radius: 8px;
          background: linear-gradient(90deg, #edf2f7 0%, #f8fafc 50%, #edf2f7 100%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite linear;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 920px) {
          .teacher-schedule-card {
            padding: 14px;
          }

          .teacher-schedule-header {
            flex-direction: column;
          }

          .week-controls {
            justify-content: flex-start;
          }

          .selection-panel {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default TeacherSchedule
