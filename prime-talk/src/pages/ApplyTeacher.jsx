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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f8fc',
        }}
      >
        <div
          role="status"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid #bfdbfe',
              borderTopColor: '#1d4ed8',
              borderRadius: '999px',
              animation: 'applyTeacherSpin 0.8s linear infinite',
            }}
          />
          <span>Loading...</span>
        </div>

        <style>{`
          @keyframes applyTeacherSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', background: '#f7f8fc' }}>
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Apply as Teacher</h1>
        <p>Submit your request to become a teacher. Admin approval is required.</p>

        {error && (
          <p style={{ color: '#b91c1c', fontWeight: 600, background: '#fff1f2', padding: '8px 10px', borderRadius: '8px' }}>
            {error}
          </p>
        )}

        {submitted && (
          <p style={{ color: '#166534', fontWeight: 600 }}>
            Application submitted. Waiting for admin approval.
          </p>
        )}

        <button
          type="button"
          onClick={handleApplyAsTeacher}
          disabled={submitted || submitting}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: submitted ? '#9ca3af' : '#667eea',
            color: '#ffffff',
            cursor: submitted ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {submitting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderTopColor: '#ffffff',
                  borderRadius: '999px',
                  animation: 'applyTeacherSpin 0.8s linear infinite',
                }}
              />
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
