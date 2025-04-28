import { NextResponse } from 'next/server'

// Mock chat history for development
const MOCK_CHAT_HISTORY = {
  '1': [ // Focus Enhancement AI
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Focus Enhancement AI! I\'m here to help you improve your concentration and productivity. Would you like to start with a focus assessment or try a specific technique?',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    },
    {
      id: '2',
      role: 'user',
      content: 'I keep getting distracted by social media',
      timestamp: new Date(Date.now() - 85400000).toISOString(),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Let\'s address this with a two-part approach: 1) Set up website blockers for social media during focused work periods, and 2) Use the Pomodoro Technique to maintain focus. Would you like me to guide you through setting these up?',
      timestamp: new Date(Date.now() - 85300000).toISOString(),
    }
  ],
  '2': [ // Meditation Guide AI
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to your meditation journey! I\'m here to guide you through mindfulness practices tailored to your needs. Would you like to start with a quick breathing exercise or explore different meditation styles?',
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    },
    {
      id: '2',
      role: 'user',
      content: 'I\'m feeling stressed about work',
      timestamp: new Date(Date.now() - 43100000).toISOString(),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I understand work stress can be overwhelming. Let\'s start with a 5-minute mindfulness exercise designed to release tension. Find a comfortable position, and I\'ll guide you through it.',
      timestamp: new Date(Date.now() - 43000000).toISOString(),
    }
  ]
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get tool ID from the URL
    const url = new URL(request.url)
    const toolId = url.searchParams.get('toolId')

    if (!toolId) {
      throw new Error('Tool ID is required')
    }

    // Development mode - return mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay
      return NextResponse.json({
        history: MOCK_CHAT_HISTORY[toolId as keyof typeof MOCK_CHAT_HISTORY] || [],
        hasMore: false
      })
    }

    // Production mode - implement actual database query here
    throw new Error('Not implemented')

  } catch (error: any) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat history' },
      { status: error.status || 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { toolId, message } = await request.json()

    if (!toolId || !message) {
      throw new Error('Tool ID and message are required')
    }

    // Development mode - acknowledge storage
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay
      return NextResponse.json({
        success: true,
        message: 'Message stored (development mode)'
      })
    }

    // Production mode - implement actual database storage here
    throw new Error('Not implemented')

  } catch (error: any) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to store chat message' },
      { status: error.status || 500 }
    )
  }
} 