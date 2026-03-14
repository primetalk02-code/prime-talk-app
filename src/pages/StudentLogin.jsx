import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function StudentLogin() {
  const isMobile = window.innerWidth < 768
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
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
        email: email.trim(),
        password,
      })
      if (signInError) {
        throw signInError
      }
      if (!data?.user) {
        throw new Error('Unable to get user after login')
      }
      // Check for profile in 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', data.user.id)
        .maybeSingle()
      if (profileError) {
        throw profileError
      }
      let role = profile?.role || ''
      if (!profile) {
        // Create profile if missing
        const { data: newProfile, error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'student',
          })
          .select('id, role')
          .single()
        if (insertProfileError) {
          throw insertProfileError
        }
        role = newProfile?.role || 'student'
      }
      if (role !== 'student') {
        await supabase.auth.signOut()
        throw new Error('This account is not allowed in the student portal.')
      }
      localStorage.setItem('userRole', 'student')
      localStorage.setItem('userRole', 'student')
      navigate('/student/dashboard')
    } catch (loginError) {
      setError(loginError.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const pageStyle = {
    display: 'flex', minHeight: '100vh', width: '100%'
  }

  const leftStyle = {
    width: '55%', background: 'linear-gradient(135deg, #0F172A 0%, #0EA5A0 100%)',
    display: isMobile ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px'
  }

  const rightStyle = {
    flex: 1, background: 'white', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', padding: isMobile ? '32px 20px' : '48px'
  }

  return (
    <div style={pageStyle}>
      {/* LEFT PANEL */}
      <div style={leftStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'Syne' }}>
            Prime
          </span>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#99f6e4', fontFamily: 'Syne' }}>
            Talk
          </span>
        </div>
        
        {/* Center content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <blockquote style={{
            fontSize: 36, color: 'white', fontFamily: 'serif', lineHeight: 1.4,
            marginBottom: 16
          }}>
            "The limits of my language are the limits of my world."
          </blockquote>
          <p style={{ color: '#99f6e4', marginBottom: 48 }}>— Ludwig Wittgenstein</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              '✓ Instant lessons with certified teachers',
              '✓ Schedule sessions around your life',
              '✓ Track your progress every step'
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: 'white', fontSize: 16
              }}>
                <span style={{ color: '#0EA5A0', fontSize: 20 }}>✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom avatars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: -8 }}>
            {['A','B','C','D','E'].map((letter, index) => (
              <div key={index} style={{
                width: 32, height: 32, borderRadius: '50%', background: '#0EA5A0',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, fontWeight: 700,
                border: '2px solid white'
              }}>
                {letter}
              </div>
            ))}
          </div>
          <span style={{ color: 'white', fontSize: 14 }}>
            Join 2,400+ students already learning
          </span>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={rightStyle}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          
          {/* Role tabs */}
          <div style={{
            display: 'flex', background: '#F1F5F9', borderRadius: 10,
            padding: 4, marginBottom: 24
          }}>
            <button 
              onClick={() => navigate('/student/login')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#0F172A', fontWeight: 600
              }}
            >
              Student
            </button>
            <button 
              onClick={() => navigate('/teacher/login')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                color: '#64748B', background: 'transparent'
              }}
            >
              Teacher
            </button>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748B', marginBottom: 24 }}>
            Sign in to continue your journey
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '12px',
              borderRadius: 8, fontSize: 14, marginBottom: 16
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email field */}
            <div>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 500,
                color: '#0F172A', marginBottom: 6
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}>✉</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: 'block', fontSize: 14, fontWeight: 500,
                color: '#0F172A', marginBottom: 6
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#94A3B8'
                }}>🔒</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <a href="#" style={{ color: '#0EA5A0', fontSize: 13 }}>
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#64748B' : '#0EA5A0',
                color: 'white', padding: '13px', borderRadius: 8, fontSize: 15,
                fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: '#64748B', fontSize: 14 }}>
            Don't have an account?{' '}
            <a href="/register" style={{ color: '#0EA5A0', fontWeight: 600 }}>
              Sign up
            </a>
          </p>
          <p style={{ textAlign: 'center', marginTop: 12 }}>
            <a href="/" style={{ color: '#94A3B8', fontSize: 13 }}>
              ← Back to home
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin
