'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (!code) {
        window.location.href = '/?error=no_code'
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth callback error:', error)
        window.location.href = '/?error=auth_callback_error'
        return
      }

      const { data } = await supabase.auth.getSession()
      console.log('session after callback:', data.session)

      window.location.href = '/'
    }

    handleCallback()
  }, [])

  return <div>Signing you in...</div>
}