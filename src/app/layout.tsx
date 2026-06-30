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
  maximumScale: 5,
  userScalable: true,
  interactiveWidget: 'resizes-content',
  themeColor: '#0b1b3a',
}

export const metadata: Metadata = {
  title: 'Imóvel Periciado',
  description: 'Imóvel Periciado',
  applicationName: 'Imóvel Periciado',
  appleWebApp: {
    capable: true,
    title: 'Imóvel Periciado',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br">
      <head>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
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
          <div className="w-full">{children}</div>
        </Providers>
      </body>
    </html>
  )
}