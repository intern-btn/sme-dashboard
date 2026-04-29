import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'SME Dashboard',
  description: 'Business Banking Division internal dashboard',
  icons: { icon: '/assets/btn-logo.png' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
