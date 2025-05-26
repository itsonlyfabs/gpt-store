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

    // If bundle chat, fetch bundle and products, and always use latest title, description
    let products: any[] = [];
    let title = session.title;
    let description = session.description;
    if (session.is_bundle && session.bundle_id) {
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('*')
        .eq('id', session.bundle_id)
        .single();
      if (!bundleError && bundle && bundle.product_ids && bundle.product_ids.length > 0) {
        const { data: bundleProducts, error: productsError } = await supabaseAdmin
          .from('products')
          .select('id, name, assistant_id, description')
          .in('id', bundle.product_ids);
        if (!productsError && bundleProducts) {
          products = Array.isArray(bundleProducts) ? bundleProducts : [];
        } else {
          products = [];
        }
        // Always use latest bundle info
        title = bundle.name;
        description = bundle.description;
      } else {
        products = [];
      }
    } else if (session.product_id) {
      // For single product, always use latest product info
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, description')
        .eq('id', session.product_id)
        .single();
      if (!productError && product) {
        title = product.name;
        description = product.description;
        products = [product];
      } else {
        products = [];
      }
    } else {
      products = [];
    }

    // Update the session with latest title and description
    if (title !== session.title || description !== session.description) {
      await supabaseAdmin
        .from('chat_sessions')
        .update({ title, description })
        .eq('id', id);
    }

    let productInfo = null;
    if (session.product_id) {
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, name, description')
        .eq('id', session.product_id)
        .single();
      if (!productError && product) {
        productInfo = product;
        title = product.name;
        description = product.description;
      }
    }

    return NextResponse.json({ session: { ...session, title, description }, messages, products, product: productInfo });
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

    // Fetch the last 20 messages for context
    const { data: chatHistoryRaw, error: historyError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (historyError) {
      console.error('Error fetching chat history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }
    const chatHistory = Array.isArray(chatHistoryRaw) ? chatHistoryRaw : [];
    const orderedHistory = [...chatHistory].reverse();

    // Check if total message count exceeds threshold (e.g., 50)
    const { count, error: countError } = await supabaseAdmin
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', id);
    if (countError) {
      console.error('Error fetching message count:', countError);
    }
    const shouldAlertUser = count && count > 50;

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
        .select('id, name, assistant_id, description')
        .in('id', bundle.product_ids) as { data: { id: string, name: string, assistant_id: string, description: string }[], error: any };
      if (productsError || !products) {
        return NextResponse.json({ error: 'Products not found' }, { status: 404 });
      }
      // Only include products with a valid assistant_id
      const safeProducts = Array.isArray(products) ? products : [];
      const validProducts = safeProducts.filter((p: any) => !!p.assistant_id);
      // Parse mentions in the message
      const mentionRegex = /@([\w-]+)/g;
      const mentions = Array.from(content.matchAll(mentionRegex))
        .map((m) => (Array.isArray(m) && typeof m[1] === 'string' ? m[1].toLowerCase() : ''))
        .filter(Boolean) as string[];
      // Build a map of possible mention keys to product ids
      const normalizedMentionMap: Record<string, string> = {};
      for (const product of validProducts) {
        normalizedMentionMap[product.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = product.id;
      }
      // --- Product selection logic ---
      let targetProductId: string | null = null;
      let mentionedId: string | null = null;
      if (mentions.length > 0) {
        const normalizedMention = mentions[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedMentionMap[normalizedMention]) {
          mentionedId = normalizedMentionMap[normalizedMention];
        }
      }
      if (mentionedId) {
        targetProductId = mentionedId;
      } else if (validProducts.length > 0) {
        const randomIdx = Math.floor(Math.random() * validProducts.length);
        targetProductId = validProducts[randomIdx]?.id ?? null;
      }
      if (!targetProductId) {
        return NextResponse.json({ error: 'No valid product to answer' }, { status: 400 });
      }
      // Find the product for the response
      const product = validProducts.find(p => p.id === targetProductId);
      if (!product || !product.assistant_id) {
        return NextResponse.json({ error: 'Product not found or missing assistant_id' }, { status: 404 });
      }
      // Build dynamic system prompt
      const otherProducts = validProducts.filter(p => p.id !== product.id);
      const otherNames = otherProducts.map(p => p && p.name ? p.name : '').filter(Boolean).join(', ') || 'none';
      const bundleContextPrompt = `You are responding as ${product.name}. The other products in this bundle chat are: ${otherNames}. You always see the full chat context.`;
      // Always use the full last 20 messages for context
      const { data: chatHistory, error: historyError } = await supabaseAdmin
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (historyError) {
        console.error('Error fetching chat history:', historyError);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
      }
      const orderedHistory = Array.isArray(chatHistory) ? [...chatHistory].reverse() : [];
      const openaiMessages = [
        { role: 'user', content: bundleContextPrompt },
        ...orderedHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content }
      ];
      // Use the API key from the environment (fix linter error)
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
      }
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ messages: openaiMessages })
      });
      const threadData = await threadRes.json();
      console.log('OpenAI threadData:', JSON.stringify(threadData, null, 2));
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
      console.log('OpenAI runData:', JSON.stringify(runData, null, 2));
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
      console.log('OpenAI messagesData:', JSON.stringify(messagesData, null, 2));
      const msgArray = Array.isArray(messagesData.data) ? messagesData.data : [];
      const lastMsg = msgArray.reverse().find((msg: any) => msg.role === 'assistant');
      const aiReply = lastMsg?.content?.[0]?.text?.value || 'No response from assistant.';
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
          product_id: product.id,
          conversation_id: session.conversation_id,
          created_at: new Date().toISOString(),
        });
      // Add to responses array
      const responses = [{
        product_id: product.id,
        product_name: product.name,
        content: aiReply,
      }];
      return NextResponse.json({ responses, alert: shouldAlertUser ? 'Chat is getting long. Consider downloading a recap and resetting for better accuracy.' : null });
    }
    // --- End bundle chat support ---

    // Fetch the product to get assistant_id
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, assistant_id')
      .eq('id', session.product_id)
      .single();
    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Use the API key from the environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let aiReply = 'Sorry, I could not generate a response.';
    try {
      // System prompt for single product context (prepend as user message)
      const contextPrompt = `You are responding as ${product.name}.`;
      // 1. Create a thread with chat history included
      const openaiMessages = [
        { role: 'user', content: contextPrompt },
        ...((chatHistory ? [...chatHistory].reverse() : []).map(msg => ({ role: msg.role, content: msg.content }))),
        { role: 'user', content }
      ];
      const threadRes = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify({ messages: openaiMessages })
      });
      const threadData = await threadRes.json();
      console.log('OpenAI threadData:', JSON.stringify(threadData, null, 2));
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
      console.log('OpenAI runData:', JSON.stringify(runData, null, 2));
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
      console.log('OpenAI messagesData:', JSON.stringify(messagesData, null, 2));
      const msgArray = Array.isArray(messagesData.data) ? messagesData.data : [];
      const lastMsg = msgArray.reverse().find((msg: any) => msg.role === 'assistant');
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
    return NextResponse.json({ response: aiReply, alert: shouldAlertUser ? 'Chat is getting long. Consider downloading a recap and resetting for better accuracy.' : null });
  } catch (error: any) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to store message' }, { status: 500 });
  }
} 