import { redirect } from "next/navigation"
import { auth } from "lib/auth"
import SignInClient from './SignInClient'

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
          {/* Use NextAuth client to avoid CSRF/state issues */}
          <SignInClient />
        </div>
      </div>
    </div>
  )
}
