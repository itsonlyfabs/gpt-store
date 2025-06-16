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

    if (!user || !user.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
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

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch all products in the bundle
    let productIds: string[] = [];
    if (session.is_bundle && session.bundle_id) {
      const bundleProductRows = (await supabaseAdmin.from('bundle_products').select('product_id').eq('bundle_id', session.bundle_id)).data;
      if (Array.isArray(bundleProductRows)) {
        productIds = bundleProductRows.map((row: any) => row.product_id).filter(Boolean);
      }
    } else if (!session.is_bundle && session.product_id) {
      productIds = [session.product_id];
    }
    const { data: productsRaw, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, prompt')
      .in('id', productIds);
    const products = Array.isArray(productsRaw) ? productsRaw : [];
    if (productsError || products.length === 0) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    // Use OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
    }

    // Insert the Ask Team user message into chat_messages
    const userMessagePayload = {
      session_id: session.id,
      conversation_id: session.id,
      user_id: user.id,
      content,
      role: 'user',
      product_id: null, // Always null for Ask Team
      created_at: new Date().toISOString(),
    };
    console.log('Inserting Ask Team user message:', userMessagePayload);
    const { data: userInsertResult, error: userInsertError } = await supabaseAdmin
      .from('chat_messages')
      .insert(userMessagePayload)
      .select('*')
      .single();
    console.log('Inserted user message result:', userInsertResult, userInsertError);

    // Fetch last 20 chat messages for context
    const { data: chatMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content, product_id')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Get responses from all products using OpenAI Chat Completion API
    const teamResponses = [];
    for (const product of products) {
      const productPrompt = product.prompt || '';
      const systemPrompt = `You are ${product.name}. ${productPrompt} Only answer as ${product.name}. Do not claim to be another expert. If the user refers to another expert, acknowledge them by name. Always maintain your own identity.`;
      const briefInstruction = 'Please answer in a single short sentence (max 100 characters). ';
      // Format chat history with speaker tags
      const history = (chatMessages || []).map(msg => {
        if (msg.role === 'user') return `[User]: ${msg.content}`;
        const prodName = products.find(p => p.id === msg.product_id)?.name || 'Team';
        return `[${prodName}]: ${msg.content}`;
      }).join('\n');
      const fullPrompt = `${briefInstruction}\nChat history:\n${history}\n\nUser question: ${content}`;

      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-0125-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: fullPrompt }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });
      const openaiData = await openaiRes.json();
      const answer = openaiData.choices?.[0]?.message?.content || '';
      teamResponses.push({ product: product.name, answer });
    }
    // Build a summary response
    let summary = '';
    if (teamResponses.length === 0) {
      summary = `There were no responses provided by any of the teams to the user's question regarding the "${content}".`;
    } else {
      summary = teamResponses.map(r => `${r.product}: ${r.answer}`).join('\n');
    }

    // Store the Ask Team response in chat_messages as an assistant message
    const assistantMessagePayload = {
      session_id: session.id,
      conversation_id: session.id,
      user_id: user.id,
      content: summary,
      role: 'assistant',
      product_id: null, // Always null for Ask Team
      created_at: new Date().toISOString(),
    };
    console.log('Inserting Ask Team assistant message:', assistantMessagePayload);
    const { data: assistantInsertResult, error: assistantInsertError } = await supabaseAdmin
      .from('chat_messages')
      .insert(assistantMessagePayload)
      .select('*')
      .single();
    console.log('Inserted assistant message result:', assistantInsertResult, assistantInsertError);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Ask team API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process team responses' },
      { status: error.status || 500 }
    );
  }
} 