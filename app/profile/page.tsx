import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface UsageStats {
  totalChats: number
  totalTokens: number
  activeTools: number
  lastActive: string
}

interface ActivityLog {
  id: string
  action: string
  toolName: string
  timestamp: string
  details: string
}

// Mock data for development
const mockUsageStats: UsageStats = {
  totalChats: 47,
  totalTokens: 12500,
  activeTools: 3,
  lastActive: '2024-03-27T15:30:00Z'
}

const mockActivityLog: ActivityLog[] = [
  {
    id: '1',
    action: 'Chat Session',
    toolName: 'Focus Enhancement AI',
    timestamp: '2024-03-27T15:30:00Z',
    details: 'Completed a 30-minute focus session'
  },
  {
    id: '2',
    action: 'Tool Purchase',
    toolName: 'Meditation Guide AI',
    timestamp: '2024-03-26T10:15:00Z',
    details: 'Successfully purchased new tool'
  },
  {
    id: '3',
    action: 'Settings Update',
    toolName: 'System',
    timestamp: '2024-03-25T18:45:00Z',
    details: 'Updated notification preferences'
  }
]

export default function ProfilePage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
            <p className="mt-2 text-sm text-gray-600">
              View your activity, manage your account, and track your AI tool usage
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Usage Statistics */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Chats</p>
                  <p className="text-2xl font-bold text-blue-900">{mockUsageStats.totalChats}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Tokens Used</p>
                  <p className="text-2xl font-bold text-green-900">{mockUsageStats.totalTokens}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Active Tools</p>
                  <p className="text-2xl font-bold text-purple-900">{mockUsageStats.activeTools}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Last Active</p>
                  <p className="text-sm font-bold text-yellow-900">
                    {new Date(mockUsageStats.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <Link
                  href="/settings"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  Update Account Settings
                </Link>
                <Link
                  href="/billing"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  Manage Subscription
                </Link>
                <Link
                  href="/my-library"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  View My Library
                </Link>
                <Link
                  href="/support"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  Get Support
                </Link>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white shadow rounded-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {mockActivityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-600">{activity.toolName}</p>
                      <p className="text-sm text-gray-500">{activity.details}</p>
                    </div>
                    <time className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
} 