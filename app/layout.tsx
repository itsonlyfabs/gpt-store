import './globals.css'
import { Inter } from 'next/font/google'
import ChatWidget from './components/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GPT Store - Mental Fitness & Personal Development',
  description: 'Browse and purchase custom AI tools for mental clarity, focus, and overall well-being.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-screen bg-gray-50">
          {children}
          <ChatWidget />
        </div>
      </body>
    </html>
  )
} 