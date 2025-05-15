import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not set' });

    const response = await fetch('https://api.openai.com/v1/assistants/asst_Xh2FPgIEsDg9jSAmfaJC8twb/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ messages: [{ role: 'user', content: message }] })
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Failed to contact OpenAI Assistant' });
  }
} 