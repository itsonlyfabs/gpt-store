const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize API clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

// Mock responses for development
const MOCK_RESPONSES = {
  '1': { // Focus Enhancement AI
    keywords: {
      'distracted': 'Let\'s work on minimizing distractions. First, try the Pomodoro Technique: work for 25 minutes, then take a 5-minute break. I\'ll guide you through it.',
      'focus': 'Here\'s a quick focus exercise: Take 3 deep breaths, then count backwards from 100 by 7. This helps activate your concentration.',
      'tired': 'When you\'re tired, your focus naturally drops. Let\'s try a quick energizing exercise: Stand up, stretch your arms overhead, and do 5 jumping jacks.',
      'productivity': 'To boost productivity, let\'s create a priority matrix for your tasks. What are your top 3 most important tasks right now?'
    },
    default: 'I\'m here to help you enhance your focus and concentration. Would you like to try a specific technique or get general advice?'
  },
  '2': { // Meditation Guide AI
    keywords: {
      'stress': 'Let\'s do a quick stress-relief meditation. Find a comfortable position, close your eyes, and follow my breathing guidance...',
      'sleep': 'I\'ll guide you through a relaxing bedtime meditation. Lie down comfortably and let\'s begin with deep, slow breaths...',
      'anxiety': 'When anxiety rises, try this grounding exercise: Name 5 things you can see, 4 things you can touch, 3 things you can hear...',
      'peace': 'Let\'s create a moment of peace. Imagine you\'re sitting by a calm lake, watching gentle ripples on the water...'
    },
    default: 'Welcome to your meditation session. Would you like to focus on relaxation, mindfulness, or stress relief?'
  }
};

// Helper function to get mock response
const getMockResponse = (productId, message) => {
  const productResponses = MOCK_RESPONSES[productId];
  if (!productResponses) return 'I\'m not sure how to help with that.';

  const lowercaseMessage = message.toLowerCase();
  
  // Check for keyword matches
  for (const [keyword, response] of Object.entries(productResponses.keywords)) {
    if (lowercaseMessage.includes(keyword)) {
      return response;
    }
  }

  return productResponses.default;
};

// Main chat function
async function chatWithAI(userId, productId, messages, options = {}) {
  try {
    // Remove development mode mock logic
    // Always use real AI services
    const { model = 'gpt-4', temperature = 0.7, assistant_id } = options;

    // If assistant_id is provided, use OpenAI Assistants API (real implementation)
    if (assistant_id) {
      console.log('[chatWithAI] Calling OpenAI Assistants API with assistant_id:', assistant_id);
      // 1. Create a new thread
      const thread = await openai.beta.threads.create();

      // 2. Add user messages to the thread
      for (const msg of messages) {
        await openai.beta.threads.messages.create(thread.id, {
          role: msg.role,
          content: msg.content,
        });
      }

      // 3. Run the Assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id,
      });

      // 4. Poll for completion
      let runStatus;
      do {
        await new Promise(res => setTimeout(res, 1000)); // wait 1s
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      } while (runStatus.status !== 'completed' && runStatus.status !== 'failed');

      if (runStatus.status === 'failed') {
        console.error('[chatWithAI] OpenAI Assistant run failed:', runStatus);
        throw new Error('OpenAI Assistant run failed');
      }

      // 5. Fetch the latest message from the assistant
      const messagesList = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messagesList.data.reverse().find(m => m.role === 'assistant');
      console.log('[chatWithAI] OpenAI Assistant response:', lastMessage?.content?.[0]?.text?.value);
      return {
        content: lastMessage?.content?.[0]?.text?.value || '[No response]',
        usage: {}, // OpenAI Assistants API does not return token usage yet
      };
    }

    // Determine which AI service to use
    if (model.startsWith('claude')) {
      if (!anthropic) {
        throw new Error('Anthropic API key not configured');
      }

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature
      });

      return {
        content: response.content[0].text,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } else {
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }

      const response = await openai.chat.completions.create({
        model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage
      };
    }
  } catch (error) {
    console.error('[chatWithAI] AI chat error:', error);
    throw new Error('Failed to generate AI response');
  }
}

module.exports = {
  chatWithAI
}; 