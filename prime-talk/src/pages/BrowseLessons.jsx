import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { createLessonWithDailyRoom } from '../lib/lessonSessions'
import '../styles/BrowseLessons.css'

function getTeacherDisplayName(teacher) {
  return teacher.full_name || teacher.email || 'Teacher'
}

function BrowseLessons() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [lessonDate, setLessonDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [lessonTime, setLessonTime] = useState('09:00')
  const [scheduling, setScheduling] = useState(false)
  const [bookingErrorMessage, setBookingErrorMessage] = useState('')
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState('')
  const [lessons, setLessons] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    let isMounted = true
    let intervalId = null

    const fetchTeachers = async () => {
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .eq('online_status', 'online')
        .order('full_name', { ascending: true })

      if (teacherError) {
        throw teacherError
      }

      if (!isMounted) {
        return
      }

      const onlineTeachers = teacherData || []

      setTeachers(onlineTeachers)
      setSelectedTeacherId((currentSelectedTeacherId) => {
        if (onlineTeachers.length === 0) {
          return ''
        }

        const selectedStillOnline = onlineTeachers.some((teacher) => teacher.id === currentSelectedTeacherId)
        return selectedStillOnline ? currentSelectedTeacherId : onlineTeachers[0].id
      })
    }

    const refreshTeachers = async () => {
      try {
        await fetchTeachers()
        if (isMounted) {
          setBookingErrorMessage('')
        }
      } catch (error) {
        console.error('Failed to load teachers for booking:', error)
        if (isMounted) {
          setTeachers([])
          setSelectedTeacherId('')
          setBookingErrorMessage('Unable to load teachers for booking right now.')
        }
      }
    }

    const fetchBookingContext = async () => {
      try {
        setBookingErrorMessage('')

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          navigate('/login', { replace: true })
          return
        }

        if (!isMounted) {
          return
        }

        setCurrentUser(user)
        await refreshTeachers()
        intervalId = window.setInterval(() => {
          void refreshTeachers()
        }, 5000)
      } catch (error) {
        console.error('Failed to load booking context:', error)
        if (isMounted) {
          setTeachers([])
          setBookingErrorMessage('Unable to load teachers for booking right now.')
        }
      }
    }

    fetchBookingContext()

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [navigate])

  useEffect(() => {
    let isMounted = true

    const fetchCategories = async () => {
      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (categoryError) {
          throw categoryError
        }

        if (isMounted) {
          setCategories(categoryData || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchTextbooks = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        let query = supabase
          .from('textbooks')
          .select(`
            id,
            title,
            content,
            categories ( name )
          `)

        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory)
        }

        const { data: lessonData, error: lessonError } = await query

        if (lessonError) {
          throw lessonError
        }

        if (isMounted) {
          setLessons(lessonData || [])
        }
      } catch (error) {
        console.error('Failed to fetch textbooks:', error)

        if (isMounted) {
          setLessons([])
          setErrorMessage('Unable to load lessons right now. Please try again in a moment.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTextbooks()

    return () => {
      isMounted = false
    }
  }, [selectedCategory])

  const getCategoryName = (categories) => {
    if (!categories) {
      return 'Uncategorized'
    }

    if (Array.isArray(categories)) {
      return categories[0]?.name || 'Uncategorized'
    }

    return categories.name || 'Uncategorized'
  }

  const getPreviewText = (content) => {
    if (!content) {
      return 'No preview available.'
    }

    return `${content.slice(0, 120).trimEnd()}...`
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const lessonTitle = (lesson.title || '').toLowerCase()
      const matchesSearch = lessonTitle.includes(normalizedSearchTerm)

      return matchesSearch
    })
  }, [lessons, normalizedSearchTerm])

  const hasActiveFilters = normalizedSearchTerm.length > 0 || selectedCategory !== 'all'

  const emptyMessage = hasActiveFilters
    ? 'No lessons match your search or selected category.'
    : 'No lessons available yet.'

  const handleScheduleLesson = async (event) => {
    event.preventDefault()

    if (!currentUser) {
      setBookingErrorMessage('Please sign in to schedule a lesson.')
      return
    }

    if (!selectedTeacherId || !lessonDate || !lessonTime) {
      setBookingErrorMessage('Please select teacher, lesson date, and lesson time.')
      return
    }

    let reservationCreated = false

    try {
      setScheduling(true)
      setBookingErrorMessage('')
      setBookingSuccessMessage('')

      const normalizedLessonTime = lessonTime.length === 5 ? `${lessonTime}:00` : lessonTime

      const { error: insertError } = await supabase.from('reservations').insert({
        student_id: currentUser.id,
        teacher_id: selectedTeacherId,
        lesson_date: lessonDate,
        lesson_time: normalizedLessonTime,
      })

      if (insertError) {
        throw insertError
      }

      reservationCreated = true

      await createLessonWithDailyRoom({
        teacherId: selectedTeacherId,
        studentId: currentUser.id,
        source: 'reservation',
      })

      setBookingSuccessMessage('Lesson scheduled successfully.')
    } catch (scheduleError) {
      console.error('Failed to schedule lesson:', scheduleError)
      setBookingErrorMessage(
        reservationCreated
          ? 'Reservation saved, but the lesson room could not be prepared yet.'
          : scheduleError.message
      )
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className="browse-lessons-container">
      <div className="browse-lessons-header">
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="browse-back-btn"
        >
          ← Back to Dashboard
        </button>
        <h1>Browse Lessons</h1>
      </div>

      <div className="booking-panel">
        <h2>Schedule Lesson</h2>
        <p>Select a teacher, date, and time to create a booked lesson.</p>

        <div className="teacher-list">
          {teachers.length === 0 ? (
            <div className="teacher-list-empty">No online teachers available right now.</div>
          ) : (
            <div className="teacher-list-grid">
              {teachers.map((teacher) => {
                const isSelected = selectedTeacherId === teacher.id
                const teacherName = getTeacherDisplayName(teacher)

                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(teacher.id)}
                    className={`teacher-list-item${isSelected ? ' selected' : ''}`}
                  >
                    {teacher.avatar_url ? (
                      <img
                        src={teacher.avatar_url}
                        alt={teacherName}
                        className="teacher-avatar"
                      />
                    ) : (
                      <div className="teacher-avatar placeholder">
                        {teacherName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="teacher-meta">
                      <p className="teacher-name">{teacherName}</p>
                      <p className="teacher-status">
                        <span className="teacher-status-dot" />
                        <span>{String(teacher.online_status || 'online').toUpperCase()}</span>
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <form className="booking-form" onSubmit={handleScheduleLesson}>
          <select
            value={selectedTeacherId}
            onChange={(event) => setSelectedTeacherId(event.target.value)}
            disabled={scheduling || teachers.length === 0}
            required
          >
            {teachers.length === 0 ? (
              <option value="">No teachers available</option>
            ) : (
              teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {getTeacherDisplayName(teacher)}
                </option>
              ))
            )}
          </select>

          <input
            type="date"
            value={lessonDate}
            onChange={(event) => setLessonDate(event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            required
            disabled={scheduling}
          />

          <input
            type="time"
            value={lessonTime}
            onChange={(event) => setLessonTime(event.target.value)}
            step="1800"
            required
            disabled={scheduling}
          />

          <button type="submit" disabled={scheduling || teachers.length === 0}>
            {scheduling ? 'Scheduling...' : 'Schedule Lesson'}
          </button>
        </form>

        {bookingErrorMessage && <div className="booking-feedback error">{bookingErrorMessage}</div>}
        {bookingSuccessMessage && <div className="booking-feedback success">{bookingSuccessMessage}</div>}
      </div>

      <div className="browse-controls">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search lessons by title..."
          className="browse-search-input"
        />

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="browse-category-select"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="browse-lessons-content">
        {loading ? (
          <div className="loading-spinner">Loading lessons...</div>
        ) : errorMessage ? (
          <div className="browse-feedback error">{errorMessage}</div>
        ) : filteredLessons.length === 0 ? (
          <div className="browse-feedback">{emptyMessage}</div>
        ) : (
          <div className="browse-lessons-grid">
            {filteredLessons.map((lesson) => (
              <article key={lesson.id} className="browse-lesson-card">
                <span className="lesson-category-badge">{getCategoryName(lesson.categories)}</span>

                <h2>{lesson.title}</h2>

                <div className="lesson-preview-section">
                  <p>{getPreviewText(lesson.content)}</p>
                </div>

                <Link to={`/lesson-details/${lesson.id}`} className="read-more-btn">
                  Read More
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseLessons
