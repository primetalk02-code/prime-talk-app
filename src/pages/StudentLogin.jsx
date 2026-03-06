import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabaseClient'

function StudentLogin() {
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
      navigate('/student/dashboard')
    } catch (loginError) {
      setError(loginError.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-stretch gap-6 lg:grid-cols-[1fr_430px]">
          <Card className="hidden border-slate-200 bg-white shadow-soft lg:block">
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Prime Talk</p>
                <h1 className="text-4xl font-black leading-tight text-slate-900">
                  Practice daily with tutors who keep your momentum strong.
                </h1>
                <p className="text-base text-slate-600">
                  Access sudden lessons, reservations, and progress tracking in one professional learning workspace.
                </p>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <p>1. Start sudden lessons instantly</p>
                <p>2. Track reservations and lesson history</p>
                <p>3. Build speaking confidence faster</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-soft">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Student Login</CardTitle>
              <CardDescription>Sign in to continue your learning journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label htmlFor="student-email" className="text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <Input
                    id="student-email"
                    type="email"
                    value={email}
                    disabled={loading}
                    placeholder="you@example.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="student-password" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Input
                    id="student-password"
                    type="password"
                    value={password}
                    disabled={loading}
                    placeholder="Enter your password"
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login as Student'}
                </Button>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link to="/" className="font-semibold text-slate-600 transition hover:text-sky-700">
                  Back to home
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/teacher/login')}
                  className="font-semibold text-slate-600 transition hover:text-sky-700"
                >
                  Teacher login
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin
