// layout.tsx
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import Script from 'next/script'
import { Providers } from '@/providers'
import { PageViewTracker } from '@/components/analytics/PageViewTracker'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-5XK4CG9T'

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
      <head>
        <Script
          id="google-tag-manager"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
        <Script
          id="hotjar"
          strategy="beforeInteractive"
          src="https://t.contentsquare.net/uxa/5947ac07f7a4e.js"
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased h-full flex flex-col`}>
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Providers>
          <main className="flex-1 flex flex-col h-full w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}