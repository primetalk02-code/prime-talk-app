import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function CreateLesson() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('lessons').insert({
        title,
        category,
        content,
      })

      if (insertError) {
        throw insertError
      }

      navigate('/browse')
    } catch (submitError) {
      setError(submitError.message)
      console.error('Error creating lesson:', submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-navy mb-2">Create Lesson</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-navy mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-navy mb-1">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="grammar">Grammar</option>
              <option value="vocabulary">Vocabulary</option>
              <option value="pronunciation">Pronunciation</option>
              <option value="conversation">Conversation</option>
              <option value="business">Business English</option>
              <option value="ielts">IELTS</option>
              <option value="toefl">TOEFL</option>
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-navy mb-1">Content</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-all ${
              submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {submitting ? 'Creating...' : 'Create Lesson'}
          </button>

          {error && (
            <p className="text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default CreateLesson