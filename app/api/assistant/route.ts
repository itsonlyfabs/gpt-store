import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message) {
    return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'OpenAI API key not set' }), { status: 500 });
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    };

    // 1. Create a thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const threadData = await threadRes.json();
    const threadId = threadData.id;
    if (!threadId) throw new Error('Failed to create thread');

    // 2. Add a message to the thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ role: 'user', content: message })
    });

    // 3. Run the assistant on the thread
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ assistant_id: 'asst_Xh2FPgIEsDg9jSAmfaJC8twb' })
    });
    const runData = await runRes.json();
    const runId = runData.id;
    if (!runId) throw new Error('Failed to start run');

    // 4. Poll for run completion
    let status = runData.status;
    let attempts = 0;
    while (status !== 'completed' && attempts < 20) {
      await new Promise(r => setTimeout(r, 1000));
      const pollRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, { headers });
      const pollData = await pollRes.json();
      status = pollData.status;
      attempts++;
      if (status === 'failed' || status === 'cancelled' || status === 'expired') {
        throw new Error('Assistant run failed');
      }
    }

    // 5. Get the assistant's reply
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, { headers });
    const messagesData = await messagesRes.json();
    const lastMsg = messagesData.data?.reverse().find((msg: any) => msg.role === 'assistant');
    let reply = lastMsg?.content?.[0]?.text?.value || '';
    // Remove OpenAI source citations
    reply = reply.replace(/【\d+:\d+†source】/g, '').replace(/\[source\]/gi, '').replace(/\[\d+\]/g, '').trim();
    return new Response(JSON.stringify({ reply }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to contact OpenAI Assistant' }), { status: 500 });
  }
} 