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

// Rate limiting map (in-memory for demo)
const rateLimits = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 50 // requests per hour
const RATE_WINDOW = 3600000 // 1 hour in milliseconds

// Message validation
const validateMessage = (message: string) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required and must be a string')
  }
  if (message.length > 2000) {
    throw new Error('Message exceeds maximum length of 2000 characters')
  }
  return message.trim()
}

// Rate limiting check
const checkRateLimit = (ip: string) => {
  const now = Date.now()
  const userLimit = rateLimits.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  userLimit.count++
  return true
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json()
    const toolId = params.id
    const clientIp = headers().get('x-forwarded-for') || 'unknown'

    // Validate message
    const validatedMessage = validateMessage(message)

    // Development mode responses
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      
      const lowerMessage = validatedMessage.toLowerCase()
      let response = ''

      if (toolId === '1') { // Focus Enhancement AI
        if (lowerMessage.includes('distracted')) {
          response = "Let's address those distractions. First, try the 5-4-3-2-1 grounding technique: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This will help bring your attention back to the present moment."
        } else if (lowerMessage.includes('tired')) {
          response = "When you're feeling tired, try this quick energizing exercise: Take 5 deep breaths, roll your shoulders back, and focus on a specific object in your environment for 30 seconds. This can help refresh your mind and boost your energy."
        } else {
          response = "To enhance your focus, let's try the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. During the work period, eliminate all distractions and focus solely on your task. Would you like me to time this for you?"
        }
      } else { // Meditation Guide AI
        if (lowerMessage.includes('stress')) {
          response = "Let's do a quick stress-relief meditation. Find a comfortable position and close your eyes. Take a deep breath in through your nose for 4 counts, hold for 4, and exhale for 6. Repeat this pattern 5 times, focusing only on your breath."
        } else if (lowerMessage.includes('sleep')) {
          response = "For better sleep, try this body scan meditation: Lie down comfortably and bring your attention to your toes. Gradually move your awareness up through your body, relaxing each part as you go. Would you like me to guide you through it?"
        } else {
          response = "Let's begin with a simple mindfulness exercise. Focus on your breath without trying to change it. Notice the natural rhythm of your inhales and exhales. When your mind wanders, gently bring it back to your breath. Shall we try this for 5 minutes?"
        }
      }

      return NextResponse.json({
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      })
    }

    // Production mode - use actual AI APIs
    if (!openai && !anthropic) {
      throw new Error('No AI provider configured')
    }

    // Check rate limit in production
    if (process.env.NODE_ENV === 'production') {
      checkRateLimit(clientIp)
    }

    const systemPrompt = SYSTEM_PROMPTS[toolId as keyof typeof SYSTEM_PROMPTS]
    if (!systemPrompt) {
      throw new Error('Invalid tool ID')
    }

    // Try Anthropic first (Claude), fallback to OpenAI
    try {
      if (anthropic) {
        const response = await anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${validatedMessage}` }
          ]
        })

        // Get the text content from the first content block
        const content = response.content[0].type === 'text' 
          ? response.content[0].text 
          : ''

        // Calculate token usage (approximate for Claude)
        const tokenUsage = {
          prompt_tokens: Math.ceil((systemPrompt.length + validatedMessage.length) / 4),
          completion_tokens: Math.ceil(content.length / 4),
        }

        return NextResponse.json({
          id: Date.now().toString(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
          usage: tokenUsage,
        })
      }

      if (openai) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: validatedMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        })

        return NextResponse.json({
          id: Date.now().toString(),
          role: 'assistant',
          content: response.choices[0].message.content || '',
          timestamp: new Date().toISOString(),
          usage: response.usage,
        })
      }
    } catch (error: any) {
      console.error('AI provider error:', error)
      
      // Handle specific error cases
      if (error.status === 429) {
        throw new Error('AI service is currently busy. Please try again in a moment.')
      } else if (error.status === 400) {
        throw new Error('Invalid request to AI service. Please try again with different input.')
      }
      
      throw new Error('Failed to generate response')
    }

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process message',
        timestamp: new Date().toISOString()
      },
      { status: error.status || 500 }
    )
  }
} 