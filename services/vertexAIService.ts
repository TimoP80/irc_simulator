// Vertex AI Service
// Handles Vertex AI authentication and configuration

import { GoogleGenAI } from '@google/genai';
import { aiDebug } from '../utils/debugLogger.js';

export interface VertexAIConfig {
  enabled: boolean;
  project: string;
  location: string;
}

export interface AIServiceConfig {
  useVertexAI: boolean;
  vertexAI?: VertexAIConfig;
  apiKey?: string;
}

/**
 * Creates a GoogleGenAI instance configured for either Vertex AI or API key authentication
 * @param config AI service configuration
 * @returns Configured GoogleGenAI instance
 */
export const createAIService = (config: AIServiceConfig): GoogleGenAI => {
  if (config.useVertexAI && config.vertexAI?.enabled) {
    aiDebug.log('🔧 Initializing Vertex AI service...');
    aiDebug.log(`   Project: ${config.vertexAI.project}`);
    aiDebug.log(`   Location: ${config.vertexAI.location}`);
    
    return new GoogleGenAI({
      vertexai: true,
      project: config.vertexAI.project,
      location: config.vertexAI.location,
    });
  } else {
    aiDebug.log('🔧 Initializing API Key-based service...');
    
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY is required when not using Vertex AI');
    }
    
    return new GoogleGenAI({ 
      apiKey: config.apiKey 
    });
  }
};

/**
 * Gets the AI service configuration from environment variables
 * @returns AI service configuration
 */
export const getAIServiceConfig = (): AIServiceConfig => {
  // Check if we're in a browser context
  // In browser: window exists and document exists
  // In Node.js: neither window nor document exist
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  // Vertex AI cannot be used in browser context - it requires server-side authentication
  // Always use API key in browser, only use Vertex AI on server
  const useVertexAI = !isBrowser && process.env.USE_VERTEX_AI === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (useVertexAI) {
    const project = process.env.VERTEX_AI_PROJECT;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

    if (!project) {
      throw new Error('VERTEX_AI_PROJECT environment variable is required when USE_VERTEX_AI is true');
    }

    return {
      useVertexAI: true,
      vertexAI: {
        enabled: true,
        project,
        location,
      },
    };
  } else {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required when not using Vertex AI');
    }

    return {
      useVertexAI: false,
      apiKey,
    };
  }
};

/**
 * Singleton instance of the AI service
 */
let aiServiceInstance: GoogleGenAI | null = null;

/**
 * Gets or creates the AI service instance
 * @returns GoogleGenAI instance
 */
export const getAIService = (): GoogleGenAI => {
  if (!aiServiceInstance) {
    const config = getAIServiceConfig();
    aiServiceInstance = createAIService(config);
    
    aiDebug.log('✅ AI Service initialized successfully');
    aiDebug.log(`   Mode: ${config.useVertexAI ? 'Vertex AI' : 'API Key'}`);
  }
  
  return aiServiceInstance;
};

/**
 * Resets the AI service instance (useful for testing or reconfiguration)
 */
export const resetAIService = (): void => {
  aiServiceInstance = null;
  aiDebug.log('🔄 AI Service instance reset');
};

