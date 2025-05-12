import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { goal, usageTrends, productivityScore, products } = await req.json();
    if (!goal || !usageTrends || productivityScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare the prompt for OpenAI
    const prompt = `User goal: "${goal}"
Usage trends: ${JSON.stringify(usageTrends)}
Productivity score: ${productivityScore}
Recent products used: ${JSON.stringify(products)}

Based on the user's goal, usage trends, and productivity score, provide:
- Personalized suggestions to help the user achieve their goal
- Corrections if their current usage is not aligned with their goal
- Encouragement or recognition if they are making good progress
- (Optional) Suggest an achievement if a milestone is reached

(Assistant ID placeholder: add when available)`;

    // Call OpenAI API (or placeholder)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful AI coach for personal transformation.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to get AI feedback' }, { status: 500 });
    }
    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || 'No feedback generated.';
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in goal-feedback endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 