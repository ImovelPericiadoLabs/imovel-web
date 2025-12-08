// src/app/(auth)/pedidos/layout.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // Verifique seu caminho
import AppLayout from '@/layouts/app-layout'
import { LoginWrapper } from './LoginWrapper' // Importe o arquivo criado acima

export default async function PedidosLayout({ children }: { children: React.ReactNode }) {
  // 1. Verifica sessão no servidor
  const session = await getServerSession(authOptions)

  // 2. Se NÃO tiver sessão, renderiza o Wrapper (Cliente) dentro do layout
  if (!session) {
    return (
      <AppLayout>
        <LoginWrapper />
      </AppLayout>
    )
  }

  // 3. Se TIVER sessão, renderiza o conteúdo normal
  return (
    <AppLayout>
      {children}
    </AppLayout>
  )
}