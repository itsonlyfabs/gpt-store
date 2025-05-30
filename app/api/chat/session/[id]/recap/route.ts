import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get request body safely
    let chat_history = undefined, team_title = undefined, team_description = undefined, is_bundle = undefined;
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json();
        chat_history = body.chat_history;
        team_title = body.team_title;
        team_description = body.team_description;
        is_bundle = body.is_bundle;
      } catch (e) {
        // Ignore JSON parse errors, fallback to DB
      }
    }

    // If chat history is provided in the request and is an array, use it directly
    let messages = Array.isArray(chat_history) ? chat_history : undefined;

    // If no chat history in request, fetch from database
    if (!messages) {
      const { data: dbMessages, error: messagesError } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      if (!dbMessages || dbMessages.length === 0) {
        return NextResponse.json({ error: 'No messages found in this chat' }, { status: 400 });
      }

      messages = dbMessages
    }

    // Fetch session info
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError) {
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    // Format messages for ChatGPT
    const formattedMessages: { role: 'user' | 'assistant'; content: string }[] = (messages || [])
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));

    // Fetch bundle info
    let bundleName = team_title || session.title || 'Bundle Chat';
    let bundleDescription = team_description || session.description || '';
    if (is_bundle && session.bundle_id) {
      // Fetch bundle info from bundles table
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .select('name, description')
        .eq('id', session.bundle_id)
        .single();
      if (!bundleError && bundle) {
        bundleName = bundle.name || bundleName;
        bundleDescription = bundle.description || bundleDescription;
      }
    }

    // Prepare system message
    let systemMessage = "You are a helpful assistant that creates concise recaps of conversations. Create a clear, well-structured summary of the following conversation, highlighting key points and decisions made. Format it in markdown with appropriate headers and bullet points where needed."
    if (is_bundle) {
      systemMessage = `You are a helpful assistant that creates concise recaps of team conversations. Create a clear, well-structured summary of the following team chat, highlighting key points and decisions made. The team is titled "${bundleName}" and its description is "${bundleDescription}". Format the recap in markdown with appropriate headers and bullet points where needed.`
    }

    // Generate recap using ChatGPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        ...formattedMessages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Fix: handle possibly undefined OpenAI response
    const recap = completion.choices?.[0]?.message?.content ?? 'No recap generated.';

    // Save the recap (but first, clean up the recap for bundles)
    let finalRecap = recap;
    if (is_bundle) {
      // Remove leading lines that repeat the bundle name/description
      finalRecap = recap
        .split('\n')
        .filter(line =>
          !/^Recap of/i.test(line.trim()) &&
          !/^Team Title:/i.test(line.trim()) &&
          !/^Team Description:/i.test(line.trim())
        )
        .join('\n')
        .replace(/^\n+/, ''); // Remove leading blank lines
    }
    // Save the recap
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({ 
        saved: true,
        recap: finalRecap,
        title: is_bundle ? bundleName : (session.title || (is_bundle ? team_title : 'Chat Recap')),
        description: is_bundle ? bundleDescription : session.description
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, recap });
  } catch (error: any) {
    console.error('Save chat recap error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save chat recap' }, { status: 500 });
  }
} 