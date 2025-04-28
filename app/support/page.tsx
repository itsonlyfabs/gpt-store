'use client'

import React, { useState } from 'react'
import Sidebar from '@/components/Sidebar'

interface FAQ {
  question: string
  answer: string
  category: string
}

interface DocumentationLink {
  title: string
  description: string
  url: string
  toolId: string
}

// Mock FAQs for development
const MOCK_FAQS: FAQ[] = [
  {
    question: 'How do I get started with the Focus Enhancement AI?',
    answer: 'Start by accessing the tool from your library. The AI will guide you through an initial assessment to understand your focus patterns and customize its approach.',
    category: 'Getting Started',
  },
  {
    question: 'What is the difference between subscription and one-time purchase?',
    answer: 'Subscription provides ongoing access to the AI tool with regular updates and improvements. One-time purchase gives you permanent access to the current version.',
    category: 'Billing',
  },
  {
    question: 'Can I use the tools offline?',
    answer: 'Our AI tools require an internet connection to function as they process data on our secure servers.',
    category: 'Technical',
  },
  {
    question: 'How is my data protected?',
    answer: 'We use industry-standard encryption and never share your personal data. All conversations are private and securely stored.',
    category: 'Privacy & Security',
  },
]

// Mock documentation links for development
const MOCK_DOCUMENTATION: DocumentationLink[] = [
  {
    title: 'Focus Enhancement AI Guide',
    description: 'Learn how to maximize your productivity with our focus enhancement tool.',
    url: '/docs/focus-enhancement',
    toolId: '1',
  },
  {
    title: 'Meditation Guide AI Documentation',
    description: 'Detailed guide on using our meditation AI for mindfulness practice.',
    url: '/docs/meditation-guide',
    toolId: '2',
  },
]

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // In development, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Support request:', contactForm)
      setSuccess(true)
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Support Center</h1>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {MOCK_FAQS.map((faq, index) => (
                <div key={index} className="bg-white shadow-sm rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                  <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full">
                    {faq.category}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Documentation Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Documentation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_DOCUMENTATION.map((doc, index) => (
                <div key={index} className="bg-white shadow-sm rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-gray-600 mb-4">{doc.description}</p>
                  <a
                    href={doc.url}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Read Documentation →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Form */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Support</h2>
            <div className="bg-white shadow-sm rounded-lg p-6">
              {success ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Message sent successfully</h3>
                  <p className="mt-1 text-gray-600">We'll get back to you as soon as possible.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={contactForm.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={contactForm.email}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={contactForm.subject}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
} 