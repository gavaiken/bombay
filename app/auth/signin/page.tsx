import { redirect } from "next/navigation"
import { auth } from "lib/auth"

export default async function SignIn() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900">Sign in to bombay</h2>
          <p className="text-sm text-gray-600">Connect with AI models securely</p>
        </div>
        <div className="mt-8 flex justify-center">
          {/* Link directly to the Google provider to avoid custom sign-in redirect loop */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/signin/google?callbackUrl=/"
            className="inline-flex items-center justify-center rounded-xl border border-brand-500 bg-brand-500 text-white hover:bg-brand-600 px-6 py-3 shadow-panel"
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  )
}
