const { PromptService } = require('../app/services/promptService.ts');

// Mock product for testing
const mockProduct = {
  id: '1',
  name: 'Test Assistant',
  description: 'A test assistant for conciseness testing',
  expertise: 'Testing and validation',
  personality: 'Direct and efficient',
  style: 'Concise and clear'
};

// Test the prompt service
function testConciseness() {
  console.log('Testing conciseness constraint...\n');
  
  // Test single product prompt
  const context = {
    product: mockProduct,
    isBundle: false,
    chatHistory: []
  };
  
  const messages = PromptService.buildSingleProductPrompt(context);
  
  console.log('Generated system messages:');
  messages.forEach((msg, index) => {
    if (msg.role === 'system') {
      console.log(`\n--- System Message ${index + 1} ---`);
      console.log(msg.content);
      console.log(`Length: ${msg.content.length} characters`);
      
      // Check if conciseness instruction is present
      if (msg.content.includes('200 characters') || msg.content.includes('concise')) {
        console.log('✅ Conciseness instruction found');
      } else {
        console.log('❌ Conciseness instruction missing');
      }
    }
  });
  
  console.log('\n✅ Conciseness test completed');
}

testConciseness();
