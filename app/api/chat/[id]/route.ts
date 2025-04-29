import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { headers } from 'next/headers'

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// Tool-specific system prompts
const SYSTEM_PROMPTS = {
  '1': `You are a Focus Enhancement AI assistant. Your goal is to help users improve their concentration,
  manage distractions, and maintain productivity. Provide practical techniques, exercises, and real-time
  guidance for better focus. Use evidence-based methods like the Pomodoro Technique, mindfulness
  exercises, and environmental optimization strategies.`,
  
  '2': `You are a Meditation Guide AI assistant. Your purpose is to help users develop mindfulness,
  reduce stress, and find inner peace. Provide guided meditation sessions, breathing exercises,
  and mindfulness techniques. Adapt your guidance based on the user's experience level and specific needs.`,
}

// Mock chat history for development
const MOCK_RESPONSES = {
  '1': 'I am the Focus Enhancement AI. I can help you improve your concentration and productivity.',
  '2': 'I am the Meditation Guide AI. I can help you with mindfulness and relaxation techniques.',
}

// Rate limiting (in production, use Redis or similar)
const RATE_LIMITS = new Map()

const validateMessage = (message: string) => {
  if (!message || typeof message !== 'string') {
    return false
  }
  if (message.length > 1000) {
    return false
  }
  return true
}

const checkRateLimit = (ip: string) => {
  const now = Date.now()
  const userLimit = RATE_LIMITS.get(ip)

  if (!userLimit) {
    RATE_LIMITS.set(ip, {
      count: 1,
      timestamp: now
    })
    return true
  }

  // Reset counter if it's been more than a minute
  if (now - userLimit.timestamp > 60000) {
    RATE_LIMITS.set(ip, {
      count: 1,
      timestamp: now
    })
    return true
  }

  // Limit to 10 messages per minute
  if (userLimit.count >= 10) {
    return false
  }

  userLimit.count += 1
  return true
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json()
    const productId = params.id

    // Validate input
    if (!validateMessage(message)) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    // Get client IP (in production, use request headers)
    const ip = '127.0.0.1'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      )
    }

    // Development mode - return mock response
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
      return NextResponse.json({
        response: MOCK_RESPONSES[productId as keyof typeof MOCK_RESPONSES] || 'I am an AI assistant.',
        conversationId: Date.now().toString()
      })
    }

    // Production mode - implement actual chat logic here
    return NextResponse.json(
      { error: 'Chat functionality not implemented in production yet' },
      { status: 501 }
    )

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 