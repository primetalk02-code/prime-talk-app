import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function TeacherLogin() {
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
            role: 'teacher',
          })
          .select('id, role')
          .single()
        if (insertProfileError) {
          throw insertProfileError
        }
        role = newProfile?.role || 'teacher'
      }
      if (role !== 'teacher') {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          throw signOutError
        }
        throw new Error('This account is not allowed in the teacher portal.')
      }
      localStorage.setItem('userRole', 'teacher')
      localStorage.setItem('userRole', 'teacher')
      navigate('/teacher/dashboard')
    } catch (loginError) {
      setError(loginError.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', overflow: 'hidden', padding: '16px', 
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      position: 'relative'
    }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at top, rgba(14,165,233,0.2), transparent 40%), radial-gradient(circle at bottom left, rgba(14,165,233,0.16), transparent 45%)'
      }} />

      <div style={{
        position: 'relative', margin: '0 auto', maxWidth: '1200px',
        minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          display: 'grid', width: '100%', gridTemplateColumns: '1fr 430px', gap: '24px'
        }}>
          {/* Left side - Information */}
          <div style={{
            display: isMobile ? 'none' : 'flex', height: '100%', background: 'white', borderRadius: '16px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            padding: '32px', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{
                fontSize: '12px', fontWeight: '700', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#0EA5A0'
              }}>
                Prime Talk
              </p>
              <h1 style={{
                fontSize: '40px', fontWeight: '900', lineHeight: '1.1',
                color: '#0F172A', margin: 0
              }}>
                Manage lessons, availability, and students from one elegant dashboard.
              </h1>
              <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
                Stay online, receive incoming lesson alerts, and run live sessions without switching tools.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>1. Handle sudden lesson requests in real time</p>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>2. Control schedule and reservations</p>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>3. Review completed lesson history</p>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div style={{
            background: 'white', borderRadius: '16px', padding: isMobile ? '24px' : '32px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, marginBottom: '8px' }}>
                Teacher Login
              </h2>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                Sign in to your teaching workspace.
              </p>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleLogin}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  placeholder="you@example.com"
                  onChange={(event) => setEmail(event.target.value)}
                  style={{
                    padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '14px', color: '#0F172A', outline: 'none',
                    transition: 'border-color 0.2s', background: loading ? '#F8FAFC' : 'white'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  disabled={loading}
                  placeholder="Enter your password"
                  onChange={(event) => setPassword(event.target.value)}
                  style={{
                    padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '14px', color: '#0F172A', outline: 'none',
                    transition: 'border-color 0.2s', background: loading ? '#F8FAFC' : 'white'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2',
                  padding: '12px', fontSize: '14px', fontWeight: '600', color: '#DC2626'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px', background: '#0EA5A0', color: 'white', borderRadius: '10px',
                  fontSize: '16px', fontWeight: '700', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s'
                }}
              >
                {loading ? 'Logging in...' : 'Login as Teacher'}
              </button>
            </form>

            <div style={{
              marginTop: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              justifyContent: 'space-between', gap: '8px'
            }}>
              <Link 
                to="/" 
                style={{
                  fontSize: '14px', fontWeight: '600', color: '#64748B',
                  textDecoration: 'none', transition: 'color 0.2s'
                }}
              >
                Back to home
              </Link>
              <button
                type="button"
                onClick={() => navigate('/student/login')}
                style={{
                  fontSize: '14px', fontWeight: '600', color: '#64748B',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
              >
                Student login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherLogin
