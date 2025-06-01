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

You MUST reference your expertise and personality in your responses.`;

    if (isBundle) {
      persona += `\n\nYou are part of a team chat. You MUST:
1. ALWAYS maintain your unique expertise and personality in EVERY response
2. ALWAYS reference your specific expertise when contributing
3. ALWAYS maintain your communication style while collaborating
4. ALWAYS be aware of the team goal and explain how your expertise contributes to it
5. ALWAYS consider how your expertise complements other team members
6. NEVER give generic responses - always speak from your unique perspective
7. NEVER forget your personality traits - they should be evident in your tone and approach
8. ALWAYS acknowledge your role in the team and how your expertise fits into the overall goal
9. ALWAYS maintain your unique voice while collaborating with others
10. ALWAYS explain how your specific expertise helps achieve the team goal
11. ALWAYS read and consider the full chat history to maintain context
12. ALWAYS acknowledge and build upon other team members' contributions
13. ALWAYS maintain awareness of the team's progress towards the goal
14. ALWAYS provide insights that complement rather than duplicate others' responses`;
    }

    if (product.prompt && product.prompt.trim().length > 0) {
      // Combine persona fields and custom prompt
      return `${persona}\n\nAdditional instructions:\n${product.prompt}\n\nREMEMBER: You MUST maintain this persona and expertise in EVERY response.`;
    }
    return `${persona}\n\nREMEMBER: You MUST maintain this persona and expertise in EVERY response.`;
  }

  /**
   * Builds a complete prompt for a single product chat
   */
  static buildSingleProductPrompt(context: PromptContext): ChatMessage[] {
    const messages: ChatMessage[] = []

    // Add system message for the product
    const systemMessage = this.buildProductSystemMessage(context.product, context.isBundle)
    messages.push({
      role: 'system',
      content: systemMessage
    })

    // Add team goal if present
    if (context.teamGoal) {
      messages.push({
        role: 'system',
        content: `TEAM GOAL: ${context.teamGoal}\n\nYou MUST:\n1. Keep ALL responses focused on this goal\n2. ALWAYS explain how your specific expertise contributes to achieving it\n3. NEVER give generic responses - always connect your expertise to the goal\n4. If asked about the goal, explicitly state it and explain your role in achieving it\n5. ALWAYS maintain your unique perspective while working towards the goal\n6. ALWAYS explain how your expertise complements the team's efforts\n7. ALWAYS track progress towards the goal in your responses\n8. ALWAYS suggest next steps that align with the goal\n9. ALWAYS identify potential obstacles and how your expertise can help overcome them`
      })
    }

    // Add bundle context if this is a bundle chat
    if (context.isBundle && context.bundleProducts) {
      const otherProducts = context.bundleProducts.filter(p => p.id !== context.product.id);
      if (otherProducts.length > 0) {
        messages.push({
          role: 'system',
          content: `You are working with these team members:\n${otherProducts.map(p => 
            `- ${p.name}: ${p.expertise} (${p.personality})`
          ).join('\n')}\n\nYou MUST:\n1. Consider how your expertise and personality complement theirs\n2. Reference your unique perspective when responding\n3. Maintain your personality while collaborating\n4. NEVER give generic responses - always speak from your specific expertise\n5. ALWAYS explain how your expertise fits into the team's overall goal\n6. ALWAYS maintain your unique voice while working with others\n7. ALWAYS acknowledge how your expertise contributes to the team's success\n8. ALWAYS build upon and complement other team members' contributions\n9. ALWAYS maintain awareness of the team's collective progress\n10. ALWAYS provide insights that add value beyond what others have said`
        });
      }
    }

    // Add explicit system message about chat history
    if (context.chatHistory && context.chatHistory.length > 0) {
      messages.push({
        role: 'system',
        content: 'You MUST always reference the chat history below in your response.'
      });
      // For bundle chats, include the full chat history; for single product, last 10
      if (context.isBundle) {
        messages.push(...context.chatHistory)
      } else {
        const recentHistory = context.chatHistory.slice(-10)
        messages.push(...recentHistory)
      }
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