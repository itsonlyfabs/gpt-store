import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request, context: any) {
  const { id } = context.params;
  try {
    // Get user from Supabase JWT in Authorization header or cookies
    let token = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      const cookieStore = cookies();
      token = cookieStore.get('sb-access-token')?.value || cookieStore.get('sb-tcmkyzcbndmaqxfjvpfs-access-token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Validate user token using Supabase Auth REST API
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await res.json();
    if (!user || !user.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Fetch session metadata
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('chat_messages')
      .select('id, content, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ session, messages });
  } catch (error: any) {
    console.error('Chat session API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat session' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request, context: any) {
  const { id } = context.params;
  try {
    const { content, role } = await request.json();
    if (!content || !role) {
      return NextResponse.json({ error: 'Content and role are required' }, { status: 400 });
    }

    // Use the same auth pattern as GET
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the session to get product_id and bundle_id
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // --- Bundle chat support ---
    if (session.is_bundle && session.bundle_id) {
      // Fetch the bundle and its products
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('*')
        .eq('id', session.bundle_id)
        .single();
      if (bundleError || !bundle) {
        return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
      }
      // Fetch all products in the bundle
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, assistant_id')
        .in('id', bundle.product_ids)
      if (productsError || !products) {
        return NextResponse.json({ error: 'Products not found' }, { status: 404 });
      }
      // Parse mentions in the message
      const mentionRegex = /@([\w-]+)/g;
      const mentions = Array.from(content.matchAll(mentionRegex)).map(m => typeof m[1] === 'string' ? m[1].toLowerCase() : '').filter(Boolean) as string[];
      // Build a map of possible mention keys to product ids
      const mentionMap: Record<string, string> = {};
      for (const product of products) {
        mentionMap[product.name.toLowerCase()] = product.id;
      }
      if (bundle.assistant_nicknames) {
        for (const [pid, nickname] of Object.entries(bundle.assistant_nicknames)) {
          if (nickname) mentionMap[(nickname as string).toLowerCase()] = pid;
        }
      }
      // Determine which products should respond
      let targetProductIds: string[] = [];
      if (mentions.length > 0) {
        // Only products explicitly mentioned
        targetProductIds = mentions.map(m => mentionMap[m]).filter((id): id is string => Boolean(id));
      } else {
        // No mention: use OpenAI to pick the best product
        if (products && products.length > 0) {
          // Build routing prompt
          const routingPrompt = `You are a router for a bundle chat. Here are the products in the bundle:\n${products.map(p => `- ${p.name}: ${p.description || ''}`).join('\n')}\nGiven the user message: "${content}", which product should answer? Return only the product id from this list: [${products.map(p => p.id).join(', ')}]`;
          const openaiApiKey = process.env.OPENAI_API_KEY;
          let chosenProductId = products[0].id;
          try {
            const routeRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                  { role: 'system', content: 'You are a helpful router that only returns a product id.' },
                  { role: 'user', content: routingPrompt }
                ],
                max_tokens: 20,
                temperature: 0
              })
            });
            const routeData = await routeRes.json();
            const routeText = routeData.choices?.[0]?.message?.content?.trim();
            if (routeText && products.some(p => p.id === routeText)) {
              chosenProductId = routeText;
            }
          } catch (err) {
            // fallback to first product
          }
          targetProductIds = [chosenProductId];
        } else {
          targetProductIds = [];
        }
      }
      // For each product, send the message to its assistant
      const openaiApiKey = process.env.OPENAI_API_KEY;
      const responses: any[] = [];
      for (const pid of targetProductIds) {
        const product = products.find(p => p.id === pid);
        if (!product || !product.assistant_id) continue;
        let aiReply = '';
        try {
          // System prompt for bundle context
          const bundleContextPrompt = `You are responding as ${product.name}${bundle.assistant_nicknames?.[pid] ? ` (nickname: ${bundle.assistant_nicknames[pid]})` : ''}. The other products in this bundle chat are: ${products.filter(p => p.id !== pid).map(p => p.name).join(', ') || 'none'}.`;
          // 1. Create a thread
          const threadRes = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: bundleContextPrompt },
                { role: 'user', content }
              ]
            })
          });
          const threadData = await threadRes.json();
          const threadId = threadData.id;
          // 2. Run the assistant
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
          // 3. Poll for completion
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
          // 4. Get the assistant's reply
          const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'OpenAI-Beta': 'assistants=v2',
            }
          });
          const messagesData = await messagesRes.json();
          const lastMsg = messagesData.data?.reverse().find((msg: any) => msg.role === 'assistant');
          aiReply = lastMsg?.content?.[0]?.text?.value || 'No response from assistant.';
        } catch (err) {
          aiReply = 'Sorry, I could not generate a response.';
        }
        // Store assistant message
        await supabaseAdmin
          .from('chat_messages')
          .insert({
            session_id: id,
            user_id: user.id,
            content: aiReply,
            role: 'assistant',
            bundle_id: session.bundle_id,
            is_bundle: true,
            product_id: pid,
            conversation_id: session.conversation_id,
            created_at: new Date().toISOString(),
          });
        // Add to responses array
        responses.push({
          product_id: pid,
          product_name: product.name,
          nickname: bundle.assistant_nicknames?.[pid] || null,
          content: aiReply,
        });
      }
      return NextResponse.json({ responses });
    }
    // --- End bundle chat support ---

    // Fetch the product to get assistant_id
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('assistant_id')
      .eq('id', session.product_id)
      .single();
    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Use the API key from the environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let aiReply = 'Sorry, I could not generate a response.';
    try {
      // System prompt for bundle context
      const bundleContextPrompt = `You are responding as ${product.name}${bundle.assistant_nicknames?.[pid] ? ` (nickname: ${bundle.assistant_nicknames[pid]})` : ''}. The other products in this bundle chat are: ${products.filter(p => p.id !== pid).map(p => p.name).join(', ') || 'none'}.`;
      // 1. Create a thread
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: bundleContextPrompt },
            { role: 'user', content }
          ]
        })
      });
      const threadData = await threadRes.json();
      const threadId = threadData.id;
      // 2. Run the assistant
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
      // 3. Poll for completion
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
      // 4. Get the assistant's reply
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        }
      });
      const messagesData = await messagesRes.json();
      const lastMsg = messagesData.data?.reverse().find((msg: any) => msg.role === 'assistant');
      aiReply = lastMsg?.content?.[0]?.text?.value || 'No response from assistant.';
    } catch (err) {
      console.error('OpenAI API error:', err);
    }

    // Store assistant message
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: id,
        user_id: user.id,
        content: aiReply,
        role: 'assistant',
        product_id: session.product_id,
        bundle_id: session.bundle_id || null,
        conversation_id: session.conversation_id,
        created_at: new Date().toISOString(),
      });

    // Return the assistant's reply
    return NextResponse.json({ response: aiReply });
  } catch (error: any) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to store message' }, { status: 500 });
  }
} 