'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatProduct {
  id: string
  name: string
  description: string
  category: string
}

// Mock data for development mode
const MOCK_PRODUCTS: Record<string, ChatProduct> = {
  '1': {
    id: '1',
    name: 'Focus Enhancement AI',
    description: 'AI-powered focus enhancement tool',
    category: 'Focus & Concentration',
  },
  '2': {
    id: '2',
    name: 'Meditation Guide AI',
    description: 'Personalized meditation assistant',
    category: 'Meditation & Mindfulness',
  },
}

const MOCK_INITIAL_MESSAGES: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Focus Enhancement AI assistant. How can I help you improve your concentration today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
  ],
  '2': [
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to your personalized meditation session. Would you like to start with a breathing exercise or a guided meditation?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
  ],
}

// AI response generation for development mode
const generateMockResponse = async (productId: string, userMessage: string): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  if (productId === '1') {
    // Focus Enhancement AI responses
    if (userMessage.toLowerCase().includes('distracted')) {
      return "Let's address your distractions. First, try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. Would you like me to guide you through a session?"
    }
    if (userMessage.toLowerCase().includes('tired')) {
      return "I notice you're feeling tired. Let's do a quick energizing exercise: take 3 deep breaths, then stand up and stretch for 30 seconds. Ready to try?"
    }
    return "I'm here to help you maintain focus. Would you like some techniques for better concentration, or shall we set up a focused work session?"
  }

  if (productId === '2') {
    // Meditation Guide AI responses
    if (userMessage.toLowerCase().includes('stress')) {
      return "I understand you're feeling stressed. Let's start with a simple breathing exercise: breathe in for 4 counts, hold for 4, and exhale for 4. Shall we begin?"
    }
    if (userMessage.toLowerCase().includes('sleep')) {
      return "I can guide you through a relaxing bedtime meditation. We'll focus on progressive muscle relaxation and calming visualizations. Would you like to start?"
    }
    return "I'm here to guide your meditation practice. Would you prefer a mindfulness exercise, a body scan, or a loving-kindness meditation?"
  }

  return "I'm here to assist you. What would you like to focus on today?"
}

export default function ChatPage() {
  const { id } = useParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<ChatProduct | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const fetchProductAndHistory = async () => {
      try {
        // For development, use mock data
        const mockProduct = {
          id: id as string,
          name: id === '1' ? 'Focus Enhancement AI' : 'Meditation Guide AI',
          description: id === '1' 
            ? 'AI-powered focus and concentration enhancement tool'
            : 'Personalized meditation and mindfulness guide',
          category: id === '1' ? 'Focus & Concentration' : 'Meditation & Mindfulness'
        }
        setProduct(mockProduct)

        // Add welcome message based on the tool
        const welcomeMessage = {
          id: 'welcome',
          role: 'assistant' as const,
          content: id === '1'
            ? "Welcome! I'm your Focus Enhancement AI assistant. I can help you improve your concentration and maintain focus during work sessions. How would you like to begin?"
            : "Hello! I'm your Meditation Guide AI. I'm here to help you develop mindfulness and find inner peace. Would you like to start with a guided meditation?",
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }

    if (id) {
      fetchProductAndHistory()
    }
  }, [id])

  const generateMockResponse = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Check for keywords and generate appropriate responses
    const lowerMessage = userMessage.toLowerCase()
    
    if (product?.id === '1') { // Focus Enhancement AI
      if (lowerMessage.includes('distracted')) {
        return "Let's address those distractions. First, try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This will help bring your attention back to the present moment."
      } else if (lowerMessage.includes('tired')) {
        return "When you're feeling tired, try this quick energizing exercise: Take 5 deep breaths, roll your shoulders back, and focus on a specific object in your environment for 30 seconds. This can help refresh your mind and boost your energy."
      } else {
        return "To enhance your focus, let's try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. During the work period, eliminate all distractions and focus solely on your task. Would you like me to time this for you?"
      }
    } else { // Meditation Guide AI
      if (lowerMessage.includes('stress')) {
        return "Let's do a quick stress-relief meditation. Find a comfortable position and close your eyes. Take a deep breath in through your nose for 4 counts, hold for 4, and exhale for 6. Repeat this pattern 5 times, focusing only on your breath."
      } else if (lowerMessage.includes('sleep')) {
        return "For better sleep, try this body scan meditation: Lie down comfortably and bring your attention to your toes. Gradually move your awareness up through your body, relaxing each part as you go. Would you like me to guide you through it?"
      } else {
        return "Let's begin with a simple mindfulness exercise. Focus on your breath without trying to change it. Notice the natural rhythm of your inhales and exhales. When your mind wanders, gently bring it back to your breath. Shall we try this for 5 minutes?"
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await generateMockResponse(userMessage.content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error generating response:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-lg rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <time className="text-xs opacity-75 mt-1 block">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </time>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
} 