import './globals.css'
import { Inter } from 'next/font/google'
import ChatWidget from './components/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL('https://www.mygenio.xyz'),
  title: 'Genio - Your Personal AI Enhancement Suite',
  description: 'Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth.',
  openGraph: {
    title: 'Genio - Your Personal AI Enhancement Suite',
    description: 'Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth.',
    url: 'https://www.mygenio.xyz',
    siteName: 'Genio',
    images: [
      {
        url: '/og-image.png', // Place this image in your public/ directory
        width: 1200,
        height: 630,
        alt: 'Genio - Your Personal AI Enhancement Suite',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Genio - Your Personal AI Enhancement Suite',
    description: 'Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Genio - Your Personal AI Enhancement Suite</title>
        <meta name="description" content="Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth." />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Genio - Your Personal AI Enhancement Suite" />
        <meta property="og:description" content="Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://www.mygenio.xyz" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Genio - Your Personal AI Enhancement Suite" />
        <meta name="twitter:description" content="Customise your collection of AI tools designed to enhance your focus, productivity, and personal growth." />
        <meta name="twitter:image" content="/og-image.png" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-screen bg-gray-50">
          {children}
          <ChatWidget />
        </div>
      </body>
    </html>
  )
} 