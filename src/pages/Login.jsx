import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Auth.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email.trim()) {
        throw new Error('Email is required')
      }
      if (!password) {
        throw new Error('Password is required')
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      if (!data?.user) {
        throw new Error('Unable to get user after login')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      if (!profile) {
        const { error: insertProfileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          role: 'student',
        })

        if (insertProfileError) {
          throw insertProfileError
        }

        navigate('/student/dashboard')
        return
      }

      if (profile?.role === 'teacher') {
        navigate('/teacher/dashboard')
        return
      }

      if (profile?.role === 'student') {
        navigate('/student/dashboard')
        return
      }

      if (profile?.role === 'admin') {
        navigate('/admin/dashboard')
        return
      }

      navigate('/dashboard', {
        state: { user: data.user, message: 'Login successful!' },
      })
    } catch (err) {
      setError(err.message || 'An error occurred during login')
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
        
        <h1 className="auth-heading">Welcome Back</h1>
        <p className="auth-subtitle">Login to your account</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
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
              placeholder="Enter your password"
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
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <a href="#" onClick={() => navigate('/register')}>Register here</a>
        </p>
      </div>
    </div>
  )
}

export default Login

