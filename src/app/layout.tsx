import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import Providers from '@/providers'
import './globals.css'

const notoSans = Noto_Sans({
  variable: '--font-noto-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

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
