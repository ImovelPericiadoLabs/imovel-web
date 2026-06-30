import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Login } from '@/sections/login'

export default async function AuthorizeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <Login />
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
