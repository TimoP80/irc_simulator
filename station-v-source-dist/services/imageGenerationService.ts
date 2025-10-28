// Image Generation Service
// Supports multiple image generation APIs: Nano Banana, Imagen, and others

import { imageDebug } from '../utils/debugLogger';

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

export interface ImageGenerationProgress {
  status: 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  imageUrl?: string;
  error?: string;
}

export type ImageGenerationProgressCallback = (progress: ImageGenerationProgress) => void;

// Default configuration
const DEFAULT_CONFIG: ImageGenerationConfig = {
  provider: 'nano-banana', // Default to Gemini for real image generation
  model: 'gemini-2.5-flash', // Use the stable model
  baseUrl: undefined // Gemini uses Google GenAI SDK directly
};

class ImageGenerationService {
  private config: ImageGenerationConfig;

  constructor(config: Partial<ImageGenerationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateImage(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    const startTime = Date.now();

    try {
      switch (this.config.provider) {
        case 'nano-banana':
          return await this.generateWithNanoBanana(request, progressCallback);
        case 'imagen':
          return await this.generateWithImagen(request, progressCallback);
        case 'dalle':
          return await this.generateWithDALLE(request, progressCallback);
        case 'placeholder':
        default:
          return await this.generatePlaceholder(request, progressCallback);
      }
    } catch (error) {
      imageDebug.error('Error:', error);
      if (progressCallback) {
        progressCallback({
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async generateWithNanoBanana(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    // Check if we're in a web environment (browser)
    const isWebEnvironment = typeof window !== 'undefined' && !window.process?.type;

    if (isWebEnvironment) {
      imageDebug.warn('Web environment detected - Gemini API not available in browser due to CORS restrictions');
      imageDebug.log('Falling back to placeholder image generation for web mode');
      return await this.generatePlaceholder(request, progressCallback);
    }

    // Check if we're in Electron environment
    const isElectron = typeof window !== 'undefined' &&
                      window.process &&
                      window.process.type === 'renderer';

    if (isElectron) {
      // In Electron, try to use the local image API server
      try {
        imageDebug.log('Electron environment detected - attempting to use local image API server');
        return await this.generateWithLocalAPIServer(request, progressCallback);
      } catch (error) {
        imageDebug.warn('Local API server failed, falling back to placeholder:', error);
        return await this.generatePlaceholder(request, progressCallback);
      }
    }

    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const startTime = Date.now();

    try {
      // Send initial progress update
      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 10,
          message: 'Initializing image generation...'
        });
      }

      // Import GoogleGenAI dynamically to avoid issues in browser
      const { GoogleGenAI } = await import('@google/genai');

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 30,
          message: 'Connecting to Gemini API...'
        });
      }

      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });

      // Use Gemini's image generation model
      const model = this.config.model || 'gemini-2.0-flash-exp';

      imageDebug.log(`Attempting to generate image with model: ${model}`);

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 50,
          message: 'Generating image...'
        });
      }

      // Try to generate content with the model
      const response = await ai.models.generateContent({
        model: model,
        contents: `Generate an image based on this prompt: ${request.prompt}`,
      });

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 80,
          message: 'Processing image data...'
        });
      }

      // Extract image data from response
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Convert base64 data to data URL
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${imageData}`;

          imageDebug.log(`Successfully generated image with Gemini`);

          if (progressCallback) {
            progressCallback({
              status: 'completed',
              progress: 100,
              message: 'Image generation completed!',
              imageUrl: dataUrl
            });
          }

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
      imageDebug.warn('No image data received from Gemini, falling back to placeholder');
      return await this.generatePlaceholder(request, progressCallback);

    } catch (error) {
      imageDebug.error('Gemini image generation failed:', error);

      if (progressCallback) {
        progressCallback({
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }

      // Check if it's a model not found error
      if (error instanceof Error && error.message.includes('not found')) {
        imageDebug.warn('Gemini model not found or doesn\'t support image generation, falling back to placeholder');
      }

      // Fall back to placeholder on any error
      imageDebug.log('Falling back to placeholder image generation');
      return await this.generatePlaceholder(request, progressCallback);
    }
  }

  private async generateWithImagen(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Imagen API key not configured');
    }

    // Imagen API integration would go here
    // This is a placeholder implementation
    throw new Error('Imagen integration not yet implemented');
  }

  private async generateWithDALLE(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('DALLE API key not configured');
    }

    // OpenAI DALLE API integration would go here
    // This is a placeholder implementation
    throw new Error('DALLE integration not yet implemented');
  }

  private async generateWithLocalAPIServer(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    const startTime = Date.now();

    try {
      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 10,
          message: 'Connecting to local image server...'
        });
      }

      // Try to call the local image API server
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.width || 512,
          height: request.height || 512
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 50,
          message: 'Generating image on server...'
        });
      }

      const data = await response.json();

      if (data.imageUrl) {
        imageDebug.log('Successfully generated image via local API server');

        if (progressCallback) {
          progressCallback({
            status: 'completed',
            progress: 100,
            message: 'Image generation completed!',
            imageUrl: data.imageUrl
          });
        }

        return {
          success: true,
          imageUrl: data.imageUrl,
          metadata: {
            model: 'local-api',
            provider: 'local-server',
            generationTime: Date.now() - startTime
          }
        };
      } else {
        throw new Error('No image URL returned from local API server');
      }
    } catch (error) {
      imageDebug.error('Local API server image generation failed:', error);

      if (progressCallback) {
        progressCallback({
          status: 'failed',
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }

      throw error;
    }
  }

  private async generatePlaceholder(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    if (progressCallback) {
      progressCallback({
        status: 'generating',
        progress: 25,
        message: 'Generating placeholder image...'
      });
    }

    // Generate a placeholder image using placehold.co service
    const width = request.width || 512;
    const height = request.height || 512;
    const prompt = request.prompt.substring(0, 50);

    // Create a placehold.co URL with custom text and styling
    const encodedText = encodeURIComponent(prompt);
    const imageUrl = `https://placehold.co/${width}x${height}/4A90E2/FFFFFF/png?text=${encodedText}`;

    if (progressCallback) {
      progressCallback({
        status: 'completed',
        progress: 100,
        message: 'Placeholder image generated!',
        imageUrl
      });
    }

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
export const generateImage = async (prompt: string, config?: Partial<ImageGenerationConfig>, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> => {
  const service = getImageGenerationService(config);
  return await service.generateImage({
    prompt,
    width: 512,
    height: 512
  }, progressCallback);
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
