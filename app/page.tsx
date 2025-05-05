'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const featuredTemplates = [
    { id: 'focus', name: 'Focus Enhancement AI', icon: '🎯', description: 'Enhance your concentration and mental clarity' },
    { id: 'meditation', name: 'Meditation Guide', icon: '🧘‍♂️', description: 'Develop mindfulness and inner peace' },
    { id: 'productivity', name: 'Productivity Boost', icon: '⚡', description: 'Boost your productivity and efficiency' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header/Navigation */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">GPT Store</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-base font-medium text-gray-500 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Your Personal AI</span>
              <span className="block text-blue-600">Enhancement Suite</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover a curated collection of AI tools designed to enhance your focus, productivity, and personal growth.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/auth/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Templates */}
        <div className="py-12">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
            Featured Templates
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTemplates.map((template) => (
              <div
                key={template.id}
                className="relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
              >
                <div className="text-4xl mb-4">{template.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-500">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-700 rounded-3xl my-16">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Start your journey today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-200">
              Join thousands of users who are already enhancing their mental capabilities with our AI tools.
            </p>
            <Link
              href="/auth/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 