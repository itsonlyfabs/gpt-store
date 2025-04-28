'use client'

import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

export default function Home() {
  const featuredCategories = [
    { id: 'focus', name: 'Focus & Concentration', icon: '🎯', description: 'Enhance your concentration and mental clarity' },
    { id: 'meditation', name: 'Meditation & Mindfulness', icon: '🧘‍♂️', description: 'Develop mindfulness and inner peace' },
    { id: 'productivity', name: 'Productivity', icon: '⚡', description: 'Boost your productivity and efficiency' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to GPT Store
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Your marketplace for mental fitness and personal development AI tools
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Browse AI Tools
              </Link>
            </div>

            {/* Featured Categories */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/discover?category=${category.id}`}
                    className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600">{category.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-50 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to enhance your mental fitness?
              </h2>
              <p className="text-gray-600 mb-6">
                Join thousands of users who are already benefiting from our AI-powered tools.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Get Started
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
} 