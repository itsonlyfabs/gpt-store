import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  try {
    const { session_id, content } = await request.json();
    
    if (!session_id || !content) {
      return NextResponse.json({ error: 'Session ID and content are required' }, { status: 400 });
    }

    // Get user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Store the user's message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id,
        user_id: user.id,
        content,
        role: 'user',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (messageError || !message) {
      console.error('Error storing user message:', messageError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Fetch all products in the bundle
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, assistant_id')
      .in('id', session.is_bundle && session.bundle_id ? 
        (await supabaseAdmin.from('bundles').select('product_ids').eq('id', session.bundle_id).single()).data?.product_ids || [] : 
        [session.product_id])
      .filter('assistant_id', 'not.is', null);

    if (productsError || !products) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    // Use OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
    }

    // Get responses from all products
    const teamResponses = [];
    for (const product of products) {
      if (!product.assistant_id) continue;

      // Create a thread for this product
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content }] })
      });
      const threadData = await threadRes.json();
      const threadId = threadData.id;

      // Run the assistant
      const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ assistant_id: product.assistant_id })
      });
      const runData = await runRes.json();
      const runId = runData.id;

      // Poll for completion
      let status = runData.status;
      let attempts = 0;
      while (status !== 'completed' && status !== 'failed' && attempts < 20) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          }
        });
        const pollData = await pollRes.json();
        status = pollData.status;
        attempts++;
      }

      // Get the assistant's reply
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        }
      });
      const messagesData = await messagesRes.json();
      const msgArray = Array.isArray(messagesData.data) ? messagesData.data : [];
      const lastMsg = msgArray.reverse().find((msg: any) => msg.role === 'assistant');
      const aiReply = lastMsg?.content?.[0]?.text?.value || 'No response from assistant.';

      // Store the team response
      await supabaseAdmin
        .from('team_responses')
        .insert({
          session_id: session_id,
          message_id: message.id,
          product_id: product.id,
          content: aiReply,
          created_at: new Date().toISOString(),
        });

      teamResponses.push({
        product_id: product.id,
        product_name: product.name,
        content: aiReply,
      });
    }

    // Generate a summary of all responses
    const summaryPrompt = `Please provide a concise summary of the following team responses to the user's question: "${content}"
    
    Team Responses:
    ${teamResponses.map(r => `${r.product_name}: ${r.content}`).join('\n\n')}
    
    Summary:`;

    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0].message.content;

    // Store the summary as an assistant message
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: session_id,
        user_id: user.id,
        content: `Team Summary:\n\n${summary}\n\nIndividual Responses:\n\n${teamResponses.map(r => `${r.product_name}:\n${r.content}`).join('\n\n')}`,
        role: 'assistant',
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      responses: teamResponses,
      summary,
      message_id: message.id
    });
  } catch (error: any) {
    console.error('Ask team API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process team responses' },
      { status: error.status || 500 }
    );
  }
} 