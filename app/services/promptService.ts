import { Product } from '@/types/product'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface PromptContext {
  teamGoal?: string
  chatHistory?: ChatMessage[]
  product: Product
  isBundle?: boolean
  bundleProducts?: Product[]
}

export class PromptService {
  /**
   * Builds a system message for a single product
   */
  static buildProductSystemMessage(product: Product, isBundle: boolean = false): string {
    let persona = `You are ${product.name}, ${product.description}

IMPORTANT: You MUST maintain these specific attributes in EVERY response:
- Your expertise: ${product.expertise}
- Your personality: ${product.personality}
- Your communication style: ${product.style}

CRITICAL CONCISENESS REQUIREMENT: Keep your responses short and concise (maximum 200 characters). Be direct and to the point while maintaining your personality and expertise. This saves tokens and enables faster, more fluid conversations.

You should reference your expertise and personality only when it is relevant to the user's question or if the user asks about it. Do not introduce yourself or your expertise unless asked. Focus your response strictly on the user's question and the chat context.`;

    if (isBundle) {
      persona += `\n\nYou are part of a team chat. You MUST:
1. ALWAYS maintain your unique expertise and personality in EVERY response
2. ALWAYS reference your specific expertise when contributing, but only if it is relevant to the user's question or if the user asks
3. ALWAYS maintain your communication style while collaborating
4. ALWAYS be aware of the team goal and explain how your expertise contributes to it if relevant
5. ALWAYS consider how your expertise complements other team members
6. NEVER give generic responses - always speak from your unique perspective
7. NEVER forget your personality traits - they should be evident in your tone and approach
8. ALWAYS acknowledge your role in the team and how your expertise fits into the overall goal if asked
9. ALWAYS maintain your unique voice while collaborating with others
10. ALWAYS explain how your specific expertise helps achieve the team goal if relevant
11. ALWAYS read and consider the full chat history to maintain context
12. ALWAYS acknowledge and build upon other team members' contributions if relevant
13. ALWAYS maintain awareness of the team's progress towards the goal
14. ALWAYS provide insights that complement rather than duplicate others' responses
15. ALWAYS keep responses concise (max 200 characters) for faster team collaboration`;
    }

    if (product.prompt && product.prompt.trim().length > 0) {
      // Combine persona fields and custom prompt
      return `${persona}\n\nAdditional instructions:\n${product.prompt}\n\nREMEMBER: Only mention your expertise, personality, or background if the user asks about it or if it is directly relevant to the user's question. Otherwise, focus strictly on the user's question and the chat context. Keep responses concise (max 200 characters).`;
    }
    return `${persona}\n\nREMEMBER: Only mention your expertise, personality, or background if the user asks about it or if it is directly relevant to the user's question. Otherwise, focus strictly on the user's question and the chat context. Keep responses concise (max 200 characters).`;
  }

  /**
   * Builds a complete prompt for a single product chat
   */
  static buildSingleProductPrompt(context: PromptContext): ChatMessage[] {
    const messages: ChatMessage[] = []

    // Add strong system message for team/bundle context
    const isTeam = !!context.isBundle;
    const systemMessage = isTeam
      ? `You are ${context.product.name}, one of several experts in a team chat.\n\nIMPORTANT:\n- Only answer as ${context.product.name}.\n- Do NOT claim to be another expert.\n- Only mention your expertise, personality, or background if the user asks about it or if it is directly relevant to the user's question.\n- Otherwise, focus your response strictly on the user's question and the current chat context.\n- You are part of a team. Reference the chat history below in your response.\n- If another team member has already answered, do not repeat their answer; instead, add your unique perspective.\n- If you are asked about the team, list the other team members by name.\n- If you are asked about previous responses, summarize or reference them.\n- Always be aware you are collaborating in a team chat.\n- Keep responses concise (max 200 characters) for faster team collaboration.`
      : `You are ${context.product.name}. Only answer as yourself. Maintain your unique expertise, personality, and style, but only mention them if the user asks or if it is directly relevant to the user's question. Do not introduce yourself unless asked. Keep responses concise (max 200 characters) for faster conversations.`;
    messages.push({ role: 'system', content: systemMessage })

    // Add product persona/prompt
    const persona = this.buildProductSystemMessage(context.product, context.isBundle)
    messages.push({ role: 'system', content: persona })

    // Add team goal if present
    if (context.teamGoal) {
      messages.push({
        role: 'system',
        content: `TEAM GOAL: ${context.teamGoal}`
      })
    }

    // Add bundle context if this is a bundle chat
    if (isTeam && context.bundleProducts) {
      const otherProducts = context.bundleProducts.filter(p => p.id !== context.product.id);
      if (otherProducts.length > 0) {
        messages.push({
          role: 'system',
          content: `You are working with these team members:\n${otherProducts.map(p => `- ${p.name}: ${p.expertise} (${p.personality})`).join('\n')}`
        });
      }
    }

    // Add the last 20 messages, tagging each with the speaker
    if (context.chatHistory && context.chatHistory.length > 0) {
      const taggedHistory = context.chatHistory.slice(-20).map((msg: any) => {
        let speaker = 'User';
        if (msg.role === 'assistant' && msg.product_id && context.bundleProducts) {
          const prod = context.bundleProducts.find(p => p.id === msg.product_id);
          if (prod) speaker = prod.name;
        }
        if (msg.role === 'user') speaker = 'User';
        // If this is a team/bundle chat and msg.product_id is null, treat as "Team"
        if (isTeam && msg.role === 'assistant' && !msg.product_id) speaker = 'Team';
        return `[${speaker}]: ${msg.content}`;
      });
      messages.push({
        role: 'user',
        content: taggedHistory.join('\n')
      });
    }

    return messages
  }

  /**
   * Builds prompts for each product in a bundle
   */
  static buildBundlePrompts(contexts: PromptContext[]): Map<string, ChatMessage[]> {
    const prompts = new Map<string, ChatMessage[]>()

    for (const context of contexts) {
      // Set isBundle to true for all products in the bundle
      prompts.set(
        context.product.id,
        this.buildSingleProductPrompt({ ...context, isBundle: true })
      )
    }

    return prompts
  }

  /**
   * Combines multiple product responses into a team response
   */
  static async combineTeamResponses(
    responses: { productId: string; content: string }[],
    openaiApiKey: string
  ): Promise<string> {
    const prompt = `Please provide a concise summary of the following team responses:

${responses.map(r => `Response from ${r.productId}:\n${r.content}`).join('\n\n')}

Summary:`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    const data = await response.json()
    return data.choices[0].message.content
  }
} 