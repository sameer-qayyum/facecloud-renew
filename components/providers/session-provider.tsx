'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type Session, type User } from '@supabase/supabase-js'

type SessionContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  supabase: ReturnType<typeof createClient>
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  isLoading: true,
  supabase: createClient()
})

export const useSession = () => useContext(SessionContext)

export default function SessionProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Skip in SSR
    if (typeof window === 'undefined') return

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (e) {
        console.error('Session fetch error:', e)
      } finally {
        setIsLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <SessionContext.Provider value={{ session, user, isLoading, supabase }}>
      {children}
    </SessionContext.Provider>
  )
}
