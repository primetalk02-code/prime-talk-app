import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabaseClient'

function StudentAccount() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        navigate('/login', { replace: true })
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      setFullName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')?.[0] ||
          '',
      )
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadAccount()
  }, [loadAccount])

  const handleSaveProfile = async () => {
    if (!userId || savingProfile) {
      return
    }

    try {
      setSavingProfile(true)
      setError('')
      setSuccess('')

      const normalizedName = fullName.trim()

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: normalizedName })
        .eq('id', userId)

      if (profileError) {
        throw profileError
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { full_name: normalizedName },
      })

      if (authUpdateError) {
        throw authUpdateError
      }

      setSuccess('Profile updated.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (savingPassword) {
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setSavingPassword(true)
      setError('')
      setSuccess('')

      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) {
        throw passwordError
      }

      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password updated.')
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setError('')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        throw signOutError
      }
      navigate('/login', { replace: true })
    } catch (signOutFailure) {
      setError(signOutFailure.message)
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your profile and authentication settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              Loading account...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="student-full-name" className="text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <Input
                    id="student-full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    disabled={savingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="student-email" className="text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <Input id="student-email" value={email} disabled />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void handleSaveProfile()} disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button variant="secondary" onClick={() => void loadAccount()} disabled={savingProfile}>
                  Refresh
                </Button>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <p className="text-sm font-semibold text-slate-900">Change Password</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="student-new-password" className="text-sm font-semibold text-slate-700">
                      New Password
                    </label>
                    <Input
                      id="student-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      disabled={savingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="student-confirm-password" className="text-sm font-semibold text-slate-700">
                      Confirm Password
                    </label>
                    <Input
                      id="student-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat new password"
                      disabled={savingPassword}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => void handleUpdatePassword()} disabled={savingPassword}>
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button variant="outline" onClick={() => void handleSignOut()}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export default StudentAccount
