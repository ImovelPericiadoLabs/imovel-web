import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import AppLayout from '@/layouts/app-layout'
import { Login } from '@/sections/login'

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <Login />
  }

  return <AppLayout>{children}</AppLayout>
}
