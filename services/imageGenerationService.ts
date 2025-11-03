// Image Generation Service
// Supports multiple image generation APIs: Nano Banana, Imagen, and others

import { imageDebug } from '../utils/debugLogger.js';
import { listAvailableModels } from './geminiService.js';

export interface ImageGenerationConfig {
  provider: 'gemini' | 'imagen' | 'placeholder' | 'dalle';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  models?: string[];
}

// Fetches available image generation models from the Gemini API
export const getAvailableImageModels = async (): Promise<string[]> => {
  try {
    const allModels = await listAvailableModels();
    // Filter for models that are likely to support image generation
    const imageModels = allModels
      .filter(model => model.name.includes('gemini') && (model.name.includes('flash') || model.name.includes('pro')))
      .map(model => model.name.replace('models/', ''));
    if (imageModels.length > 0) {
      imageDebug.log('Available image models:', imageModels);
      return imageModels;
    }
    imageDebug.warn('No specific image models found, returning default list.');
    return ['gemini-1.5-pro', 'gemini-1.5-flash'];
  } catch (error) {
    imageDebug.error('Failed to fetch available image models:', error);
    // Return a default list as a fallback
    return ['gemini-1.5-pro', 'gemini-1.5-flash'];
  }
};

export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  metadata?: {
    model: string;
    provider: string;
    generationTime?: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: ImageGenerationConfig = {
  provider: 'gemini', // Default to Gemini for real image generation
  model: 'gemini-1.5-pro', // Use a modern, capable model
  baseUrl: undefined, // Gemini uses Google GenAI SDK directly
  models: undefined
};

/**
 * Service for generating images using various providers.
 */
class ImageGenerationService {
  private config: ImageGenerationConfig;

  /**
   * Creates an instance of ImageGenerationService.
   * @param {Partial<ImageGenerationConfig>} [config={}] - Initial configuration.
   */
  constructor(config: Partial<ImageGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generates an image based on the provided request.
   * @param {ImageGenerationRequest} request - The image generation request.
   * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const startTime = Date.now();
    
    // Use the proxy server for all providers except placeholder
    if (this.config.provider !== 'placeholder') {
      try {
        const response = await fetch('http://localhost:3001/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: request.prompt,
            config: this.config,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          ...result,
          metadata: {
            ...result.metadata,
            generationTime: Date.now() - startTime,
          }
        };
      } catch (error) {
        imageDebug.error('Error calling image generation proxy:', error);
        // Fallback to placeholder if the proxy fails
        return this.generatePlaceholder(request);
      }
    }
    
    // Handle placeholder generation locally
    return this.generatePlaceholder(request);
  }

  /**
   * Generates an image using the Gemini provider.
   * @private
   * @param {ImageGenerationRequest} request - The image generation request.
   * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
   */
  private async generateWithGemini(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const startTime = Date.now();

    try {
      // Import GoogleGenAI dynamically to avoid issues in browser
      const { GoogleGenAI } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
      
      // Use Gemini's image generation model
      const model = this.config.model || 'gemini-1.5-pro';
      
      imageDebug.log(`Attempting to generate image with model: ${model}`);
      
      // Try to generate content with the model
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: `Generate an image of: ${request.prompt}` }] }],
      });

      // Extract image data from response
      if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            // Convert base64 data to data URL
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mimeType};base64,${imageData}`;
            
            imageDebug.log(`Successfully generated image with Gemini`);
            
            return {
              success: true,
              imageUrl: dataUrl,
              metadata: {
                model: model,
                provider: 'gemini',
                generationTime: Date.now() - startTime
              }
            };
          }
        }
      }
      
      // If no image data found, fall back to placeholder
      imageDebug.warn('No image data received from Gemini, falling back to placeholder');
      return await this.generatePlaceholder(request);
      
    } catch (error) {
      imageDebug.error('Gemini image generation failed:', error);
      
      // Check if it's a model not found error
      if (error instanceof Error && error.message.includes('not found')) {
        imageDebug.warn('Gemini model not found or doesn\'t support image generation, falling back to placeholder');
      }
      
      // Fall back to placeholder on any error
      imageDebug.log('Falling back to placeholder image generation');
      return await this.generatePlaceholder(request);
    }
  }

  /**
   * Generates an image using the Imagen provider.
   * @private
   * @param {ImageGenerationRequest} request - The image generation request.
   * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
   */
  private async generateWithImagen(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Imagen API key not configured');
    }

    // Imagen API integration would go here
    // This is a placeholder implementation
    throw new Error('Imagen integration not yet implemented');
  }

  /**
   * Generates an image using the DALLE provider.
   * @private
   * @param {ImageGenerationRequest} request - The image generation request.
   * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
   */
  private async generateWithDALLE(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('DALLE API key not configured');
    }

    // OpenAI DALLE API integration would go here
    // This is a placeholder implementation
    throw new Error('DALLE integration not yet implemented');
  }

  /**
   * Generates a placeholder image.
   * @private
   * @param {ImageGenerationRequest} request - The image generation request.
   * @returns {Promise<ImageGenerationResponse>} The response containing the placeholder image URL.
   */
  private async generatePlaceholder(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Generate a placeholder image using placehold.co service
    const width = request.width || 512;
    const height = request.height || 512;
    const prompt = request.prompt.substring(0, 50);
    
    // Create a placehold.co URL with custom text and styling
    const encodedText = encodeURIComponent(prompt);
    const imageUrl = `https://placehold.co/${width}x${height}/4A90E2/FFFFFF/png?text=${encodedText}`;
    
    return {
      success: true,
      imageUrl,
      metadata: {
        model: 'placeholder',
        provider: 'placeholder',
        generationTime: 0
      }
    };
  }

  /**
   * Updates the service configuration.
   * @param {Partial<ImageGenerationConfig>} newConfig - The new configuration to apply.
   */
  updateConfig(newConfig: Partial<ImageGenerationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets the current service configuration.
   * @returns {ImageGenerationConfig} The current configuration.
   */
  getConfig(): ImageGenerationConfig {
    return { ...this.config };
  }
}

// Create a singleton instance
let imageService: ImageGenerationService | null = null;

export const getImageGenerationService = (config?: Partial<ImageGenerationConfig>): ImageGenerationService => {
  if (!imageService) {
    imageService = new ImageGenerationService(config);
  } else if (config) {
    // Update the existing service with new configuration
    imageService.updateConfig(config);
  }
  return imageService;
};


// Helper function to generate image with default service
export const generateImage = async (prompt: string, config?: Partial<ImageGenerationConfig>): Promise<ImageGenerationResponse> => {
  const service = getImageGenerationService(config);
  return await service.generateImage({
    prompt,
    width: 512,
    height: 512
  });
};

// Configuration helpers
export const setImageGenerationProvider = (provider: ImageGenerationConfig['provider'], apiKey?: string, model?: string) => {
  const service = getImageGenerationService();
  service.updateConfig({ provider, apiKey, model });
};

export const isImageGenerationConfigured = (): boolean => {
  const service = getImageGenerationService();
  const config = service.getConfig();
  return config.provider !== 'placeholder' && !!config.apiKey;
};
