import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState('student')
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      navigate(from, { replace: true })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const pageStyle = {
    display: 'flex', minHeight: '100vh', width: '100%'
  }

  const leftStyle = {
    width: '55%', background: 'linear-gradient(135deg, #0F172A 0%, #0C8F8A 100%)',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '48px'
  }

  const rightStyle = {
    flex: 1, background: 'white', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', padding: '48px'
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
        <div style={{ width: '100%', maxWidth: 400 }}>
          
          {/* Role tabs */}
          <div style={{
            display: 'flex', background: '#F1F5F9', borderRadius: 10,
            padding: 4, marginBottom: 32
          }}>
            <button 
              onClick={() => setRole('student')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                ...(role === 'student' 
                  ? { background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#0F172A', fontWeight: 600 }
                  : { color: '#64748B', background: 'transparent' }
                )
              }}
            >
              Student
            </button>
            <button 
              onClick={() => setRole('teacher')}
              style={{
                flex: 1, padding: '10px', textAlign: 'center', cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s',
                ...(role === 'teacher' 
                  ? { background: 'white', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#0F172A', fontWeight: 600 }
                  : { color: '#64748B', background: 'transparent' }
                )
              }}
            >
              Teacher
            </button>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748B', marginBottom: 32 }}>
            Sign in to continue your journey
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#DC2626', padding: '12px',
              borderRadius: 8, fontSize: 14, marginBottom: 20
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  type={showPass ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 40px 12px 40px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 14, color: '#0F172A', transition: 'all 0.2s'
                  }}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: '#94A3B8',
                    fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
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

          {/* OR divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
          }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }}></div>
            <span style={{ color: '#94A3B8', fontSize: 13 }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }}></div>
          </div>

          {/* Google button */}
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', border: '1.5px solid #E2E8F0',
              borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 500, color: '#0F172A', transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>
              <span style={{ color:'#4285F4' }}>G</span>
              <span style={{ color:'#EA4335' }}>o</span>
              <span style={{ color:'#FBBC04' }}>o</span>
              <span style={{ color:'#4285F4' }}>g</span>
              <span style={{ color:'#34A853' }}>l</span>
              <span style={{ color:'#EA4335' }}>e</span>
            </span>
            Continue with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: 24, color: '#64748B', fontSize: 14 }}>
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