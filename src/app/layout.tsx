import type { Metadata, Viewport } from 'next'
import { Noto_Sans } from 'next/font/google'
import { Providers } from '@/providers'
import './globals.css'

const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

// Adicione esta exportação para controlar o zoom
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
    <html lang="pt-br">
      <body className={`${notoSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}