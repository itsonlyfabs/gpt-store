import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'
import { PromptService } from '@/services/promptService'
import { Product } from '@/types/product'

console.log('NEXT.JS CHAT API ROUTE LOADED');

// Helper function to generate a context summary
async function generateContextSummary(sessionId: string, productId: string, openaiApiKey: string) {
  try {
    // Fetch the last 30 messages for context
    const { data: chatHistory, error: historyError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content, product_id')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (historyError || !chatHistory) {
      console.error('Error fetching chat history for summary:', historyError);
      return null;
    }

    // Get the session to include team goal
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('team_goal')
      .eq('id', sessionId)
      .single();
    
    if (sessionError || !session) {
      console.error('Error fetching session for summary:', sessionError);
      return null;
    }

    // Create a summary prompt
    const summaryPrompt = `Please provide a concise summary of the following chat history. 
    Focus on key points, decisions, and requirements mentioned by the user.
    Team Goal: ${session.team_goal || 'Not specified'}
    
    Chat History:
    ${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
    
    Summary:`;

    // Use OpenAI to generate the summary
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating context summary:', error);
    return null;
  }
}

// Helper function to handle "Ask the team" feature
async function handleAskTheTeam(sessionId: string, content: string, products: any[], openaiApiKey: string, session: any, user: any) {
  try {
    // Fetch the last 10 messages for context (excluding the current message)
    const { data: recentMessages, error: recentMessagesError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);
    let chatHistoryString = '';
    if (recentMessages && Array.isArray(recentMessages)) {
      chatHistoryString = recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
    }
    const userMessageWithGoalAndHistory = session.team_goal
      ? `TEAM GOAL: ${session.team_goal}\n\nRECENT CHAT HISTORY:\n${chatHistoryString}\n\nUser: ${content}`
      : content;

    // Store the user's message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        conversation_id: sessionId,
        user_id: user.id,
        product_id: products[0].id,
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
        body: JSON.stringify({ 
          messages: [
            ...(session.team_goal ? [{
              role: 'system',
              content: `IMPORTANT CONTEXT: The current team goal for this chat is: \"${session.team_goal}\"\n\nPlease:\n1. Always keep responses focused on this specific goal\n2. When asked about the team goal, explicitly state it\n3. If a question seems unrelated to the goal, explain how it connects to the goal or suggest refocusing on the goal\n\nCurrent team goal: \"${session.team_goal}\"`
            }] : []),
            { role: 'user', content: userMessageWithGoalAndHistory }
          ]
        })
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
          session_id: sessionId,
          conversation_id: sessionId,
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
        session_id: sessionId,
        conversation_id: sessionId,
        user_id: user.id,
        product_id: products[0].id,
        content: `Team Summary:\n\n${summary}\n\nIndividual Responses:\n\n${teamResponses.map(r => `${r.product_name}:\n${r.content}`).join('\n\n')}`,
        role: 'assistant',
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      responses: teamResponses,
      summary,
      message_id: message.id
    });
  } catch (error) {
    console.error('Error handling ask the team:', error);
    return NextResponse.json({ error: 'Failed to process team responses' }, { status: 500 });
  }
}

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
      .select('id, content, created_at, product_id, role')
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
          .select('id, name, assistant_id, description, expertise, personality, style, prompt')
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
        .select('id, name, assistant_id, description, expertise, personality, style, prompt')
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

    // Fetch user notes
    const { data: notes, error: notesError } = await supabaseAdmin
      .from('user_notes')
      .select('id, content, created_at, updated_at')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // Fetch chat summaries
    const { data: summaries, error: summariesError } = await supabaseAdmin
      .from('chat_summaries')
      .select('id, content, created_at')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
      session: { ...session, title, description }, 
      messages, 
      products, 
      active_product_id: session.active_product_id,
      team_goal: session.team_goal,
      notes: notes || [],
      summaries: summaries || []
    });
  } catch (error: any) {
    console.error('Chat session API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat session' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request, context: any) {
  console.log('POST handler entered for chat API', context?.params?.id);
  const { id } = context.params;
  try {
    const { content, role, askTeam, teamGoal, noteContent, generateSummary, reset } = await request.json();
    console.log('POST body:', { content, role, askTeam, teamGoal, noteContent, generateSummary, reset });
    
    // Handle chat reset
    if (reset) {
      await supabaseAdmin
        .from('chat_messages')
        .delete()
        .eq('session_id', id);
      return NextResponse.json({ response: null, messages: [] });
    }

    if (!content && !teamGoal && !noteContent && !generateSummary) {
      return NextResponse.json({ error: 'Content, teamGoal, noteContent, or generateSummary is required' }, { status: 400 });
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
    console.log('Session loaded:', { is_bundle: session.is_bundle, bundle_id: session.bundle_id, product_id: session.product_id });

    // Handle team goal update
    if (teamGoal !== undefined) {
      await supabaseAdmin
        .from('chat_sessions')
        .update({ team_goal: teamGoal })
        .eq('id', id);
      
      return NextResponse.json({ success: true, team_goal: teamGoal });
    }

    // Handle note content
    if (noteContent !== undefined) {
      const { data: note, error: noteError } = await supabaseAdmin
        .from('user_notes')
        .insert({
          session_id: id,
          user_id: user.id,
          content: noteContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, content, created_at, updated_at')
        .single();

      if (noteError) {
        console.error('Error storing note:', noteError);
        return NextResponse.json({ error: 'Failed to store note' }, { status: 500 });
      }

      return NextResponse.json({ success: true, note });
    }

    // Handle generate summary
    if (generateSummary) {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
      }

      // Fetch the last 50 messages for context
      const { data: chatHistory, error: historyError } = await supabaseAdmin
        .from('chat_messages')
        .select('role, content, product_id')
        .eq('session_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (historyError || !chatHistory) {
        console.error('Error fetching chat history for summary:', historyError);
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
      }

      // Create a summary prompt
      const summaryPrompt = `Please provide a comprehensive summary of the following chat history. 
      Focus on key points, decisions, and requirements mentioned by the user.
      Team Goal: ${session.team_goal || 'Not specified'}
      
      Chat History:
      ${chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
      
      Summary:`;

      // Use OpenAI to generate the summary
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: summaryPrompt }],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      const summary = data.choices[0].message.content;

      // Store the summary
      const { data: storedSummary, error: summaryError } = await supabaseAdmin
        .from('chat_summaries')
        .insert({
          session_id: id,
          user_id: user.id,
          content: summary,
          created_at: new Date().toISOString(),
        })
        .select('id, content, created_at')
        .single();

      if (summaryError) {
        console.error('Error storing summary:', summaryError);
        return NextResponse.json({ error: 'Failed to store summary' }, { status: 500 });
      }

      return NextResponse.json({ success: true, summary: storedSummary });
    }

    // Handle "Ask the team" feature and bundle chat
    if (session.is_bundle) {
      console.log('Bundle chat logic entered');
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
      }
      let productIds: string[] = [];
      if (session.bundle_id) {
        const { data: bundle, error: bundleError } = await supabaseAdmin
          .from('bundles')
          .select('product_ids')
          .eq('id', session.bundle_id)
          .single();
        if (!bundleError && bundle?.product_ids) {
          productIds = bundle.product_ids;
        }
      }
      console.log('Bundle productIds:', productIds);
      // Fetch ALL products with their complete attributes for the bundle
      const { data: bundleProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, name, description, expertise, personality, style, prompt, assistant_id')
        .in('id', productIds);

      console.log('Bundle products fetched:', bundleProducts);

      if (productsError || !bundleProducts) {
        return NextResponse.json({ error: 'Products not found' }, { status: 404 });
      }

      // Fetch the last 20 messages for context (same as single product chat)
      const { data: recentMessages, error: historyError } = await supabaseAdmin
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('session_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (historyError) {
        return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
      }

      // Store the user's message (use activeProduct.id for bundle chat)
      if (!bundleProducts || bundleProducts.length === 0) {
        return NextResponse.json({ error: 'No products found in bundle.' }, { status: 500 });
      }
      const { data: message, error: messageError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          session_id: id,
          conversation_id: id,
          user_id: user.id,
          product_id: bundleProducts[0]!.id,
          content,
          role: 'user',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (messageError || !message) {
        return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
      }

      // For each product in the bundle, build the context exactly as in single product chat
      const teamResponses = [];
      for (const product of bundleProducts) {
        console.log('Building prompt for product:', product);
        const promptContext = {
          product: product, // full product object
          teamGoal: session.team_goal,
          chatHistory: recentMessages?.reverse() || [], // chronological order
          isBundle: true,
          bundleProducts: bundleProducts // full list of products in the bundle
        };
        const messages = PromptService.buildSingleProductPrompt(promptContext);
        messages.push({ role: 'user', content });

        // Call OpenAI Chat Completions API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages,
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        const data = await response.json();
        const aiReply = data.choices[0].message.content;

        // Store the team response
        await supabaseAdmin
          .from('team_responses')
          .insert({
            session_id: id,
            conversation_id: id,
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
      const summary = await PromptService.combineTeamResponses(
        teamResponses.map(r => ({ productId: r.product_name, content: r.content })),
        openaiApiKey
      );

      // Store the summary as an assistant message (use activeProduct.id)
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          session_id: id,
          conversation_id: id,
          user_id: user.id,
          product_id: bundleProducts[0]!.id,
          content: `Team Summary:\n\n${summary}\n\nIndividual Responses:\n\n${teamResponses.map(r => `${r.product_name}:\n${r.content}`).join('\n\n')}`,
          role: 'assistant',
          created_at: new Date().toISOString(),
        });

      return await handleAskTheTeam(id, content, bundleProducts, openaiApiKey, session, user);
    }

    // Handle regular chat message
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set' }, { status: 500 });
    }

    // Fetch the active product with ALL its attributes
    const { data: activeProduct, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, description, expertise, personality, style, prompt, assistant_id')
      .eq('id', session.active_product_id || session.product_id)
      .single();

    if (productError || !activeProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If this is a bundle chat, fetch all products for context
    let bundleProducts: Product[] = [];
    if (session.is_bundle && session.bundle_id) {
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('product_ids')
        .eq('id', session.bundle_id)
        .single();
      
      if (!bundleError && bundle?.product_ids) {
        const { data: products, error: productsError } = await supabaseAdmin
          .from('products')
          .select('id, name, description, expertise, personality, style, prompt, assistant_id')
          .in('id', bundle.product_ids);
        
        if (!productsError && products) {
          bundleProducts = products as Product[];
        }
      }
    }
    // Ensure bundleProducts is always an array
    if (!Array.isArray(bundleProducts)) bundleProducts = [];

    // Fetch the last 20 messages for context
    const { data: recentMessages, error: historyError } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('session_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyError) {
      console.error('Failed to fetch chat history', historyError);
      return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
    }

    // Determine correct product_id for message storage
    const productIdToUse = session.is_bundle
      ? (bundleProducts[0] && bundleProducts[0].id)
      : activeProduct.id;

    if (!productIdToUse) {
      return NextResponse.json({ error: 'No product found for chat.' }, { status: 500 });
    }

    // Store the user's message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: id,
        conversation_id: id,
        user_id: user.id,
        product_id: productIdToUse,
        content,
        role: 'user',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (messageError || !message) {
      console.error('Failed to store message', messageError);
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 });
    }

    // Build the prompt context with ALL necessary information
    const promptContext = {
      teamGoal: session.team_goal,
      chatHistory: recentMessages?.reverse() || [], // Reverse to get chronological order
      product: activeProduct as Product,
      isBundle: session.is_bundle,
      bundleProducts: bundleProducts // always an array
    };

    try {
      // Build the prompt with enhanced context
      const messages = PromptService.buildSingleProductPrompt(promptContext);
      messages.push({ role: 'user', content });

      // Call OpenAI Chat Completions API with higher temperature for more personality
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages,
          max_tokens: 1000,
          temperature: 0.8, // Increased temperature for more personality
        }),
      });

      const data = await response.json();
      const aiReply = data.choices[0].message.content;

      // Store the assistant's message
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          session_id: id,
          conversation_id: id,
          user_id: user.id,
          product_id: productIdToUse,
          content: aiReply,
          role: 'assistant',
          created_at: new Date().toISOString(),
        });

      return NextResponse.json({ 
        response: aiReply,
        message_id: message.id
      });
    } catch (err) {
      console.error('Error in OpenAI call or prompt building', err, { promptContext });
      return NextResponse.json({ error: 'Internal server error (OpenAI or prompt)' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 