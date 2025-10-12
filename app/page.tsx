import Chat from './components/Chat'

import { auth } from 'lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/')
  }
  return <Chat />
}
