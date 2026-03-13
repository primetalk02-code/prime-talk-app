import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({
  user: null,
  role: null,
  teacherStatus: null,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [teacherStatus, setTeacherStatus] = useState(null)

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data?.session?.user || null)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }
      setUser(session?.user || null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      if (!user?.id) {
        setRole(null)
        setTeacherStatus(null)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (cancelled) {
        return
      }

      const nextRole = profile?.role || null
      setRole(nextRole)

      if (nextRole !== 'teacher') {
        setTeacherStatus(null)
        return
      }

      const { data: application } = await supabase
        .from('teacher_applications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled) {
        setTeacherStatus(application?.status || null)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const contextValue = useMemo(() => {
    return { user, role, teacherStatus }
  }, [role, teacherStatus, user])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}