'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UsageStats {
  totalChats: number
  totalTokens: number
  activeTools: number
  lastActive: string
  monthlyUsage: {
    date: string
    tokens: number
    chats: number
  }[]
  costSavings: number
  productivityScore: number
  requestCount?: number
  requestLimit?: number
  tier?: string
  resetDate?: string
}

interface ActivityLog {
  id: string
  action: string
  toolName: string
  timestamp: string
  details: string
  category: 'productivity' | 'learning' | 'communication' | 'other'
  impact: 'high' | 'medium' | 'low'
}

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  deadline: string
  category: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string | null
}

interface Product {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  usageMetrics: {
    totalChats: number
  }
}

export default function ProfilePage() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [libraryProducts, setLibraryProducts] = useState<Product[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch usage statistics
        const statsResponse = await fetch('/api/user/stats')
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch usage statistics')
        }
        const statsData = await statsResponse.json()
        setUsageStats(statsData)
        // Show upgrade if at limit and on free tier
        if (statsData.tier === 'free' && statsData.requestCount >= statsData.requestLimit) {
          setShowUpgrade(true)
        } else {
          setShowUpgrade(false)
        }

        // Fetch goals and achievements
        const goalsResponse = await fetch('/api/user/goals')
        if (!goalsResponse.ok) {
          throw new Error('Failed to fetch goals and achievements')
        }
        const goalsData = await goalsResponse.json()
        setGoals(goalsData.goals)
        setAchievements(goalsData.achievements)

        // Get user session/access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Not authenticated')
        }
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
        const libraryResponse = await fetch(`${backendUrl}/user/library`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        if (!libraryResponse.ok) {
          throw new Error('Failed to fetch user library')
        }
        const libraryData = await libraryResponse.json()
        console.log('Fetched library data:', libraryData)
        setLibraryProducts(libraryData.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Error loading profile</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!usageStats) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">No data available</h2>
            <p className="mt-2 text-gray-600">Start using the platform to see your statistics</p>
          </div>
        </main>
      </div>
    )
  }

  // Calculate total assistants from all products
  const totalAssistants = libraryProducts.length;

  // Prepare data for Usage Trends chart
  const categoryCounts: Record<string, number> = {}
  libraryProducts.forEach((p) => {
    if (p.category) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
    }
  })
  const usageTrendsData = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count
  }))

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track your progress, manage your tools, and optimize your AI experience
            </p>
          </div>

          {/* Usage Bar & Upgrade */}
          {usageStats?.requestLimit && usageStats?.requestCount !== undefined && (
            <div className="mb-8 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly Usage</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">
                  {usageStats.tier === 'pro' ? 'Pro Tier' : 'Free Tier'}
                </span>
                <span className="text-sm text-gray-700">
                  {usageStats.requestCount} / {usageStats.requestLimit} requests
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full ${usageStats.requestCount >= usageStats.requestLimit ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(100, (usageStats.requestCount / usageStats.requestLimit) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Requests will refresh in 30 days
                </span>
                {showUpgrade && (
                  <button
                    className="ml-4 px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors duration-150"
                    onClick={() => window.location.href = '/billing'}
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>
              {usageStats.requestCount >= usageStats.requestLimit && (
                <div className="mt-2 text-red-600 text-sm font-semibold">
                  You've hit your limit of {usageStats.requestLimit} requests for this month.
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Usage Statistics */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Assistants</p>
                  <p className="text-2xl font-bold text-blue-900">{totalAssistants}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Productivity Score</p>
                  <p className="text-2xl font-bold text-yellow-900">{usageStats?.productivityScore}%</p>
                </div>
              </div>
              
              {/* Usage Trends Chart */}
              <div className="mt-6 h-64">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Trends</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Products" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Goals & Achievements */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals & Achievements</h2>
              
              {/* Goals */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Current Goals</h3>
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <span className="text-sm text-gray-500">
                          {goal.current}/{goal.target} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(goal.current / goal.target) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Achievements</h3>
                <div className="grid grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg ${
                        achievement.unlockedAt ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{achievement.icon}</div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white shadow rounded-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  href="/settings"
                  className="flex flex-col items-center p-4 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="text-xl mb-2">⚙️</span>
                  Update Settings
                </Link>
                <Link
                  href="/billing"
                  className="flex flex-col items-center p-4 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="text-xl mb-2">💳</span>
                  Manage Billing
                </Link>
                <Link
                  href="/my-library"
                  className="flex flex-col items-center p-4 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="text-xl mb-2">📚</span>
                  View Library
                </Link>
                <Link
                  href="/support"
                  className="flex flex-col items-center p-4 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <span className="text-xl mb-2">💬</span>
                  Get Support
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 