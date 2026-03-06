import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Auth.css'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate inputs
      if (!fullName.trim()) {
        throw new Error('Full name is required')
      }
      if (!email.trim()) {
        throw new Error('Email is required')
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Register user with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        throw signUpError
      }

      if (data?.user?.id) {
        const { error: upsertUserError } = await supabase.from('users').upsert(
          {
            id: data.user.id,
            name: fullName.trim(),
            role: 'student',
          },
          {
            onConflict: 'id',
          },
        )

        if (upsertUserError) {
          // User row is also created on first successful student login.
          console.warn('Could not upsert users row during signup:', upsertUserError.message)
        }
      }

      setSuccess(true)
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate('/student/dashboard', { 
          state: { user: data.user, message: 'Registration successful!' } 
        })
      }, 1500)
    } catch (err) {
      setError(err.message || 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>
        
        <h1 className="auth-heading">Create Account</h1>
        <p className="auth-subtitle">Join Prime Talk English today</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">✓ Registration successful! Redirecting...</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <a href="#" onClick={() => navigate('/student/login')}>
            Student Login
          </a>{' '}
          |{' '}
          <a href="#" onClick={() => navigate('/teacher/login')}>
            Teacher Login
          </a>
        </p>
      </div>
    </div>
  )
}

export default Register
