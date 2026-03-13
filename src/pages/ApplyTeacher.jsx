import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function ApplyTeacher() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setError('')
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!currentUser) {
          navigate('/login')
          return
        }

        setUser(currentUser)
      } catch (fetchError) {
        setError(fetchError.message)
        console.error('Error fetching current user:', fetchError.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [navigate])

  const handleApplyAsTeacher = async () => {
    if (!user || submitted) {
      return
    }

    try {
      setError('')
      setSubmitting(true)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'teacher',
          status: 'pending',
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      setSubmitted(true)
    } catch (submitError) {
      setError(submitError.message)
      console.error('Error submitting teacher application:', submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-semibold">
          <span className="w-4 h-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></span>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-navy mb-2">Apply as Teacher</h1>
        <p className="text-muted mb-6">Submit your request to become a teacher. Admin approval is required.</p>

        {error && (
          <p className="text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            {error}
          </p>
        )}

        {submitted && (
          <p className="text-green-600 font-semibold mb-4">
            Application submitted. Waiting for admin approval.
          </p>
        )}

        <button
          type="button"
          onClick={handleApplyAsTeacher}
          disabled={submitted || submitting}
          className={`px-4 py-2.5 rounded-lg border-none font-semibold transition-all ${
            submitted 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
              <span>Submitting...</span>
            </span>
          ) : (
            'Apply as Teacher'
          )}
        </button>
      </div>
    </div>
  )
}

export default ApplyTeacher