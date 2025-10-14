import { redirect } from "next/navigation"
import { auth } from "lib/auth"

export default async function SignIn() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to bombay</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Connect with AI models securely</p>
        </div>
        <div className="mt-8">
          {/* Using direct link to NextAuth sign-in route */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/auth/signin?callbackUrl=/"
            className="inline-flex items-center justify-center rounded-md border border-brand-500 bg-brand-500 text-white hover:bg-brand-600 px-4 py-2"
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  )
}
