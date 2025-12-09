// src/app/(auth)/pedidos/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import AppLayout from '@/layouts/app-layout'
import { LoginWrapper } from './LoginWrapper'

export default async function PedidosLayout({ children }: { children: React.ReactNode }) {
  // 1. Verifica sessão no servidor
  const session = await getServerSession(authOptions)

  // 2. Se NÃO tiver sessão
  if (!session) {
    // REMOVIDO O <AppLayout> AQUI
    // Retornamos apenas o LoginWrapper para que ele controle a tela inteira
    // e use apenas o cabeçalho interno do componente <Login />
    return (
      <LoginWrapper />
    )
  }

  // 3. Se TIVER sessão, mantém o layout padrão com o cabeçalho do app
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}