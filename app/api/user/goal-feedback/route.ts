import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { goal, usageTrends, productivityScore, products } = await req.json();
    if (!goal || !usageTrends || productivityScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Prepare the user message
    const userMessage = `User goal: "${goal}"
Usage trends: ${JSON.stringify(usageTrends)}
Productivity score: ${productivityScore}
Recent products used: ${JSON.stringify(products)}
`;

    // 1. Create a thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });
    if (!threadRes.ok) {
      const error = await threadRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to create thread' }, { status: 500 });
    }
    const thread = await threadRes.json();

    // 2. Add user message to thread
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: userMessage,
      }),
    });
    if (!messageRes.ok) {
      const error = await messageRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to add message' }, { status: 500 });
    }

    // 3. Run the assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: 'asst_2ZzSzl0g7zza4EXFRtZhET94',
      }),
    });
    if (!runRes.ok) {
      const error = await runRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to run assistant' }, { status: 500 });
    }
    const run = await runRes.json();

    // 4. Poll for completion
    let status = run.status;
    let attempts = 0;
    let messages = [];
    while (status !== 'completed' && status !== 'failed' && attempts < 20) {
      await new Promise(res => setTimeout(res, 1500));
      const pollRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      const pollData = await pollRes.json();
      status = pollData.status;
      attempts++;
    }
    if (status !== 'completed') {
      return NextResponse.json({ error: 'Assistant did not complete in time' }, { status: 500 });
    }

    // 5. Get the assistant's response
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    if (!messagesRes.ok) {
      const error = await messagesRes.json().catch(() => ({}));
      return NextResponse.json({ error: error.error || 'Failed to get messages' }, { status: 500 });
    }
    const messagesData = await messagesRes.json();
    // Find the latest assistant message
    const assistantMsg = messagesData.data?.reverse().find((msg: any) => msg.role === 'assistant');
    let feedback = assistantMsg?.content?.[0]?.text?.value || 'No feedback generated.';
    // Enforce conciseness - limit to 200 characters
    if (feedback.length > 200) {
      feedback = feedback.substring(0, 197) + '...';
    }
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error in goal-feedback endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 