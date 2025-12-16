// layout.tsx
import type { Metadata, Viewport } from 'next'
import { Noto_Sans } from 'next/font/google'
import { Providers } from '@/providers'
import './globals.css'

const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

// O 'interactiveWidget' ajuda a redimensionar a tela quando o teclado abre
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
}

export const metadata: Metadata = {
  title: 'Imóvel Periciado',
  description: 'Imóvel Periciado',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br" className="h-full">
      <body className={`${notoSans.variable} antialiased h-full flex flex-col`}>
        <Providers>
          <main className="flex-1 flex flex-col h-full w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}