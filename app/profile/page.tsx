'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Avatar, Box, Button, Grid, Paper, Typography, TextField, CircularProgress } from '@mui/material'
import type { Session } from '@supabase/auth-helpers-nextjs'

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
  const [selectedGoal, setSelectedGoal] = useState('');
  const [customGoal, setCustomGoal] = useState('');
  const [currentGoal, setCurrentGoal] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [settingGoal, setSettingGoal] = useState(false);
  const goalInputRef = useRef<HTMLInputElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const supabase = createClientComponentClient()

  const preMadeGoals = [
    'Improve focus',
    'Reduce stress',
    'Learn a new skill',
    'Finish a project',
    'Boost creativity',
    'Build a daily habit',
  ];

  useEffect(() => {
    // Load goal and feedback from localStorage on mount
    const savedGoal = localStorage.getItem('currentGoal');
    const savedFeedback = localStorage.getItem('aiFeedback');
    if (savedGoal) setCurrentGoal(savedGoal);
    if (savedFeedback) setAiFeedback(savedFeedback);
  }, []);

  const handleSetGoal = () => {
    setSettingGoal(true);
    const goal = customGoal.trim() || selectedGoal;
    if (goal) {
      setCurrentGoal(goal);
      setAiFeedback(''); // Clear previous feedback
      localStorage.setItem('currentGoal', goal);
      localStorage.removeItem('aiFeedback');
    }
    setSettingGoal(false);
  };

  const handleGetFeedback = async () => {
    if (!currentGoal) return;
    setAiLoading(true);
    setAiFeedback('');
    try {
      // Prepare data for backend
      const usageTrends = usageTrendsData.map(d => d.category);
      const productivityScore = usageStats?.productivityScore || 0;
      const products = libraryProducts.map(p => p.name);
      const res = await fetch('/api/user/goal-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: currentGoal,
          usageTrends,
          productivityScore,
          products,
        }),
      });
      const data = await res.json();
      if (data.feedback) {
        setAiFeedback(data.feedback);
        localStorage.setItem('aiFeedback', data.feedback);
      } else {
        setAiFeedback('No feedback generated.');
        localStorage.setItem('aiFeedback', 'No feedback generated.');
      }
    } catch (err) {
      setAiFeedback('Failed to get AI feedback.');
      localStorage.setItem('aiFeedback', 'Failed to get AI feedback.');
    } finally {
      setAiLoading(false);
    }
  };

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
        const libraryResponse = await fetch('/api/user/library', {
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
        setSession(session)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }));
  };

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

  // Helper to render AI feedback with formatting
  function renderAIFeedback(feedback: string) {
    if (!feedback) return null;
    // Split into paragraphs
    const lines = feedback.split(/\n+/).filter(Boolean);
    // Detect numbered lists
    let inList = false;
    let listItems: string[] = [];
    const elements: React.ReactNode[] = [];
    lines.forEach((line, idx) => {
      const numbered = /^\d+\./.test(line.trim());
      if (numbered) {
        inList = true;
        listItems.push(line.replace(/^\d+\.\s*/, ''));
      } else {
        if (inList && listItems.length) {
          elements.push(
            <ol key={`list-${idx}`} className="ml-6 list-decimal space-y-1 text-gray-800">
              {listItems.map((item, i) => (
                <li key={i}>{renderBold(item)}</li>
              ))}
            </ol>
          );
          listItems = [];
          inList = false;
        }
        elements.push(
          <p key={idx} className="mb-2 text-gray-800">{renderBold(line)}</p>
        );
      }
    });
    // If the last lines were a list
    if (inList && listItems.length) {
      elements.push(
        <ol key={`list-last`} className="ml-6 list-decimal space-y-1 text-gray-800">
          {listItems.map((item, i) => (
            <li key={i}>{renderBold(item)}</li>
          ))}
        </ol>
      );
    }
    return elements;
  }
  // Helper to render **bold**
  function renderBold(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={i} className="font-semibold text-blue-900">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  }

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
          {usageStats && usageStats.requestLimit !== undefined && usageStats.requestCount !== undefined && (
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

          {/* Goal & AI Coach Section - moved here */}
          <section className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Goal & AI Coach</h2>
            <p className="text-gray-600 mb-4">Set your main goal and use this assessment to get personalised guidance on your journey. This is designed for meaningful check-ins, not frequent use—let it help you reflect, adjust, and stay on track for real progress.</p>
            <div className="flex flex-col md:flex-row md:items-end gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose a goal</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedGoal}
                  onChange={e => setSelectedGoal(e.target.value)}
                  disabled={!!customGoal}
                >
                  <option value="">Select a pre-made goal...</option>
                  {preMadeGoals.map(goal => (
                    <option key={goal} value={goal}>{goal}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Or enter a custom goal</label>
                <input
                  ref={goalInputRef}
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Describe your goal..."
                  value={customGoal}
                  onChange={e => setCustomGoal(e.target.value)}
                  disabled={!!selectedGoal}
                />
              </div>
              <button
                className="h-10 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-150 mt-2 md:mt-0"
                onClick={handleSetGoal}
                disabled={settingGoal || (!customGoal.trim() && !selectedGoal)}
              >
                Set/Update Goal
              </button>
            </div>
            {currentGoal && (
              <div className="mb-4">
                <div className="text-gray-700 mb-1">Current Goal:</div>
                <div className="font-semibold text-blue-700">{currentGoal}</div>
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-150"
                onClick={handleGetFeedback}
                disabled={!currentGoal || aiLoading}
              >
                {aiLoading ? 'Getting Feedback...' : 'Get New Feedback'}
              </button>
              {aiFeedback && (
                <div className="flex-1 bg-gray-50 border rounded-lg p-4 text-gray-800 whitespace-pre-line">
                  <strong className="block mb-2 text-gray-900">Your Personalised Assessment:</strong>
                  <div className="space-y-1">{renderAIFeedback(aiFeedback)}</div>
                </div>
              )}
            </div>
          </section>

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
        </div>
      </main>
    </div>
  )
} 