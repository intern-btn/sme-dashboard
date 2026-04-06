import './globals.css'

export const metadata = {
  title: 'SME Dashboard',
  description: 'Business Banking Division internal dashboard',
  icons: { icon: '/assets/btn-logo.png' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
