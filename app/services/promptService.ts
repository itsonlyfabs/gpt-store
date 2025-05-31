import { Product } from '@/types/product'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface PromptContext {
  teamGoal?: string
  chatHistory?: ChatMessage[]
  product: Product
}

export class PromptService {
  /**
   * Builds a system message for a single product
   */
  static buildProductSystemMessage(product: Product): string {
    let persona = `You are ${product.name}, ${product.description}

Your expertise: ${product.expertise}
Your personality: ${product.personality}
Your communication style: ${product.style}`;

    if (product.prompt && product.prompt.trim().length > 0) {
      // Combine persona fields and custom prompt
      return `${persona}\n\nAdditional instructions:\n${product.prompt}\n\nPlease maintain this persona and expertise throughout our conversation.`;
    }
    return `${persona}\n\nPlease maintain this persona and expertise throughout our conversation.`;
  }

  /**
   * Builds a complete prompt for a single product chat
   */
  static buildSingleProductPrompt(context: PromptContext): ChatMessage[] {
    const messages: ChatMessage[] = []

    // Debug: log the product object
    console.log('PRODUCT OBJECT:', context.product)

    // Add system message for the product
    const systemMessage = this.buildProductSystemMessage(context.product)
    // Debug: log the generated system prompt
    console.log('SYSTEM PROMPT:', systemMessage)
    messages.push({
      role: 'system',
      content: systemMessage
    })

    // Add team goal if present
    if (context.teamGoal) {
      messages.push({
        role: 'system',
        content: `TEAM GOAL: ${context.teamGoal}\n\nPlease keep responses focused on this goal.`
      })
    }

    // Add chat history if present
    if (context.chatHistory) {
      messages.push(...context.chatHistory)
    }

    return messages
  }

  /**
   * Builds prompts for each product in a bundle
   */
  static buildBundlePrompts(contexts: PromptContext[]): Map<string, ChatMessage[]> {
    const prompts = new Map<string, ChatMessage[]>()

    for (const context of contexts) {
      prompts.set(
        context.product.id,
        this.buildSingleProductPrompt(context)
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