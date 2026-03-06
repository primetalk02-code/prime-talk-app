import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

function RoleGuard({ allowedRole, children }) {
  const [checking, setChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAccess = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          if (isMounted) {
            setIsAllowed(false)
          }
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          if (isMounted) {
            setIsAllowed(false)
          }
          return
        }

        const hasAccess = profile.role === allowedRole && profile.status === 'approved'

        if (isMounted) {
          setIsAllowed(hasAccess)
        }
      } catch (error) {
        console.error('Role guard error:', error)

        if (isMounted) {
          setIsAllowed(false)
        }
      } finally {
        if (isMounted) {
          setChecking(false)
        }
      }
    }

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [allowedRole])

  if (checking) {
    return <div style={{ padding: '12px' }}>Checking access...</div>
  }

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default RoleGuard
