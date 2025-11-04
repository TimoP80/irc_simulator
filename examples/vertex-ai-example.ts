/**
 * Vertex AI Integration Example
 * 
 * This example demonstrates how to use the Vertex AI authentication
 * in the IRC Simulator application.
 */

import { getAIService, getAIServiceConfig, resetAIService } from '../services/vertexAIService';

/**
 * Example 1: Basic usage with automatic configuration
 */
async function basicExample() {
  console.log('=== Basic Vertex AI Example ===\n');
  
  // Get the AI service - automatically configured based on environment variables
  const ai = getAIService();
  
  // Get the current configuration
  const config = getAIServiceConfig();
  console.log('Current configuration:');
  console.log(`  Mode: ${config.useVertexAI ? 'Vertex AI' : 'API Key'}`);
  if (config.useVertexAI && config.vertexAI) {
    console.log(`  Project: ${config.vertexAI.project}`);
    console.log(`  Location: ${config.vertexAI.location}`);
  }
  console.log();
  
  // Use the AI service to generate content
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ 
        role: 'user', 
        parts: [{ text: 'Why is the sky blue?' }] 
      }]
    });
    
    const text = response.response.text();
    console.log('AI Response:', text);
  } catch (error) {
    console.error('Error generating content:', error);
  }
}

/**
 * Example 2: Using different models
 */
async function modelExample() {
  console.log('\n=== Model Selection Example ===\n');
  
  const ai = getAIService();
  
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-001',
    'gemini-1.5-pro',
    'gemini-2.0-flash'
  ];
  
  for (const model of models) {
    try {
      console.log(`Testing model: ${model}`);
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ 
          role: 'user', 
          parts: [{ text: 'Say hello in one word' }] 
        }]
      });
      
      const text = response.response.text();
      console.log(`  Response: ${text}\n`);
    } catch (error) {
      console.error(`  Error with ${model}:`, error);
    }
  }
}

/**
 * Example 3: Chat conversation
 */
async function chatExample() {
  console.log('\n=== Chat Conversation Example ===\n');
  
  const ai = getAIService();
  
  const conversation = [
    { role: 'user', parts: [{ text: 'Hello! What is your name?' }] },
    { role: 'model', parts: [{ text: 'I am Gemini, a large language model.' }] },
    { role: 'user', parts: [{ text: 'Can you help me with coding?' }] }
  ];
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: conversation
    });
    
    const text = response.response.text();
    console.log('AI Response:', text);
  } catch (error) {
    console.error('Error in chat:', error);
  }
}

/**
 * Example 4: Resetting the service (useful for testing)
 */
async function resetExample() {
  console.log('\n=== Reset Service Example ===\n');
  
  console.log('Getting initial service...');
  const ai1 = getAIService();
  console.log('Service instance 1:', ai1 ? 'Created' : 'Failed');
  
  console.log('\nResetting service...');
  resetAIService();
  
  console.log('Getting new service...');
  const ai2 = getAIService();
  console.log('Service instance 2:', ai2 ? 'Created' : 'Failed');
  
  console.log('\nNote: In production, you typically don\'t need to reset the service.');
}

/**
 * Example 5: Error handling
 */
async function errorHandlingExample() {
  console.log('\n=== Error Handling Example ===\n');
  
  const ai = getAIService();
  
  try {
    // Try to use an invalid model
    const response = await ai.models.generateContent({
      model: 'invalid-model-name',
      contents: [{ 
        role: 'user', 
        parts: [{ text: 'Hello' }] 
      }]
    });
    
    console.log('Response:', response.response.text());
  } catch (error) {
    console.error('Expected error caught:');
    if (error instanceof Error) {
      console.error(`  Message: ${error.message}`);
      console.error(`  Type: ${error.constructor.name}`);
    }
  }
}

/**
 * Main function to run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Vertex AI Integration Examples                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Check configuration
  const config = getAIServiceConfig();
  console.log('Current Setup:');
  console.log(`  Authentication: ${config.useVertexAI ? 'Vertex AI' : 'API Key'}`);
  if (config.useVertexAI && config.vertexAI) {
    console.log(`  Project: ${config.vertexAI.project}`);
    console.log(`  Location: ${config.vertexAI.location}`);
  }
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Run examples
  try {
    await basicExample();
    await modelExample();
    await chatExample();
    await resetExample();
    await errorHandlingExample();
    
    console.log('\n' + '='.repeat(60));
    console.log('All examples completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\nFatal error running examples:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use in other modules
export {
  basicExample,
  modelExample,
  chatExample,
  resetExample,
  errorHandlingExample
};

