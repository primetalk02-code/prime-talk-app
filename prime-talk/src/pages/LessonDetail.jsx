import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/LessonDetail.css'

function LessonDetail() {
  const navigate = useNavigate()
  const { id: lessonId } = useParams()

  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchLesson = async () => {
      try {
        setLoading(true)
        setErrorMessage('')

        const { data, error } = await supabase
          .from('textbooks')
          .select(`
            id,
            title,
            content,
            created_at,
            categories ( name )
          `)
          .eq('id', lessonId)
          .single()

        if (error) {
          throw error
        }

        if (isMounted) {
          setLesson(data)
        }
      } catch (error) {
        console.error('Failed to fetch lesson:', error)

        if (isMounted) {
          setLesson(null)
          setErrorMessage('Unable to load this lesson. Please try again.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLesson()

    return () => {
      isMounted = false
    }
  }, [lessonId])

  const categoryName = useMemo(() => {
    if (!lesson?.categories) {
      return 'Uncategorized'
    }

    if (Array.isArray(lesson.categories)) {
      return lesson.categories[0]?.name || 'Uncategorized'
    }

    return lesson.categories.name || 'Uncategorized'
  }, [lesson])

  const formattedCreatedDate = useMemo(() => {
    if (!lesson?.created_at) {
      return 'Date unavailable'
    }

    const date = new Date(lesson.created_at)

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable'
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }, [lesson])

  const contentBlocks = useMemo(() => {
    if (!lesson?.content) {
      return ['No lesson content available.']
    }

    return lesson.content
      .split('\n')
      .map((block) => block.trim())
      .filter(Boolean)
  }, [lesson])

  return (
    <div className="lesson-detail-page">
      <div className="lesson-detail-wrapper">
        <button
          type="button"
          className="lesson-detail-back-btn"
          onClick={() => navigate('/browse-lessons')}
        >
          ← Back to Lessons
        </button>

        {loading ? (
          <div className="lesson-detail-feedback">Loading lesson...</div>
        ) : errorMessage ? (
          <div className="lesson-detail-feedback error">{errorMessage}</div>
        ) : (
          <article className="lesson-detail-card">
            <span className="lesson-detail-category-badge">{categoryName}</span>
            <h1>{lesson?.title}</h1>
            <p className="lesson-detail-created-at">Published: {formattedCreatedDate}</p>

            <div className="lesson-detail-content">
              {contentBlocks.map((block, index) => (
                <p key={`${lesson?.id}-block-${index}`}>{block}</p>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  )
}

export default LessonDetail
