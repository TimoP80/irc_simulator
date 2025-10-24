// Image Generation Service
// Supports multiple image generation APIs: Nano Banana, Imagen, and others

export interface ImageGenerationConfig {
  provider: 'nano-banana' | 'imagen' | 'placeholder' | 'dalle';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

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
  provider: 'nano-banana', // Default to Gemini for real image generation
  model: 'gemini-2.0-flash-exp', // Use the working model
  baseUrl: undefined // Gemini uses Google GenAI SDK directly
};

class ImageGenerationService {
  private config: ImageGenerationConfig;

  constructor(config: Partial<ImageGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const startTime = Date.now();
    
    try {
      switch (this.config.provider) {
        case 'nano-banana':
          return await this.generateWithNanoBanana(request);
        case 'imagen':
          return await this.generateWithImagen(request);
        case 'dalle':
          return await this.generateWithDALLE(request);
        case 'placeholder':
        default:
          return await this.generatePlaceholder(request);
      }
    } catch (error) {
      console.error('[Image Generation] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async generateWithNanoBanana(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const startTime = Date.now();

    try {
      // Import GoogleGenAI dynamically to avoid issues in browser
      const { GoogleGenAI } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
      
      // Use Gemini's image generation model
      const model = this.config.model || 'gemini-2.0-flash-exp';
      
      console.log(`[Image Generation] Attempting to generate image with model: ${model}`);
      
      // Try to generate content with the model
      const response = await ai.models.generateContent({
        model: model,
        contents: `Generate an image based on this prompt: ${request.prompt}`,
      });

      // Extract image data from response
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Convert base64 data to data URL
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${imageData}`;
          
          console.log(`[Image Generation] Successfully generated image with Gemini`);
          
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
      
      // If no image data found, fall back to placeholder
      console.warn('No image data received from Gemini, falling back to placeholder');
      return await this.generatePlaceholder(request);
      
    } catch (error) {
      console.error('Gemini image generation failed:', error);
      
      // Check if it's a model not found error
      if (error instanceof Error && error.message.includes('not found')) {
        console.warn('Gemini model not found or doesn\'t support image generation, falling back to placeholder');
      }
      
      // Fall back to placeholder on any error
      console.log('Falling back to placeholder image generation');
      return await this.generatePlaceholder(request);
    }
  }

  private async generateWithImagen(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Imagen API key not configured');
    }

    // Imagen API integration would go here
    // This is a placeholder implementation
    throw new Error('Imagen integration not yet implemented');
  }

  private async generateWithDALLE(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('DALLE API key not configured');
    }

    // OpenAI DALLE API integration would go here
    // This is a placeholder implementation
    throw new Error('DALLE integration not yet implemented');
  }

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

  // Update configuration
  updateConfig(newConfig: Partial<ImageGenerationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
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
export const setImageGenerationProvider = (provider: ImageGenerationConfig['provider'], apiKey?: string) => {
  const service = getImageGenerationService();
  service.updateConfig({ provider, apiKey });
};

export const isImageGenerationConfigured = (): boolean => {
  const service = getImageGenerationService();
  const config = service.getConfig();
  return config.provider !== 'placeholder' && !!config.apiKey;
};
