'use client'

import { signIn } from 'next-auth/react'

export default function SignInClient() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/' })}
      className="inline-flex items-center justify-center rounded-xl border border-brand-500 bg-brand-500 text-white hover:bg-brand-600 px-6 py-3 shadow-panel"
      aria-label="Sign in with Google"
      data-testid="signin-google"
    >
      Sign in with Google
    </button>
  )
}