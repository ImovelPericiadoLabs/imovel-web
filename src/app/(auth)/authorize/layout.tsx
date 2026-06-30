export default function AuthorizeLayout({ children }: { children: React.ReactNode }) {
  // Shell passivo: o gate de sessão (login/criação de conta inline) é feito no client
  // (authorize-client.tsx), preservando a querystring OAuth (state/PKCE) sem sair da rota.
  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}
