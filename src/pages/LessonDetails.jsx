import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/LessonDetails.css'

function LessonDetails() {
  const { id } = useParams()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data, error } = await supabase
          .from('textbooks')
          .select(`
            id,
            title,
            content,
            categories ( name )
          `)
          .eq('id', id)
          .single()

        if (error) {
          console.error('Error fetching lesson:', error)
          return
        }

        setLesson(data)
      } catch (error) {
        console.error('Error fetching lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [id])

  if (loading) {
    return (
      <div className="lesson-details-page">
        <div className="lesson-details-container">
          <Link to="/browse-lessons" className="lesson-details-back-btn">
            ← Back to Lessons
          </Link>

          <div className="lesson-details-card">
            <p className="lesson-details-status">Loading lesson...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="lesson-details-page">
        <div className="lesson-details-container">
          <Link to="/browse-lessons" className="lesson-details-back-btn">
            ← Back to Lessons
          </Link>

          <div className="lesson-details-card">
            <p className="lesson-details-status">Lesson not found.</p>
          </div>
        </div>
      </div>
    )
  }

  const categoryName = Array.isArray(lesson.categories)
    ? lesson.categories[0]?.name
    : lesson.categories?.name

  const contentParagraphs = lesson.content
    ? lesson.content
        .split('\n')
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : []

  return (
    <div className="lesson-details-page">
      <div className="lesson-details-container">
        <Link to="/browse-lessons" className="lesson-details-back-btn">
          ← Back to Lessons
        </Link>

        <article className="lesson-details-card">
          <span className="lesson-details-badge">{categoryName || 'Uncategorized'}</span>
          <h1 className="lesson-details-title">{lesson.title}</h1>

          <div className="lesson-details-content">
            {contentParagraphs.length > 0 ? (
              contentParagraphs.map((paragraph, index) => (
                <p key={`${lesson.id}-paragraph-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p>No lesson content available.</p>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}

export default LessonDetails
