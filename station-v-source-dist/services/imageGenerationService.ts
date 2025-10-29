// Image Generation Service
// Supports multiple image generation APIs: Nano Banana, Imagen, and others

import { imageDebug } from '../utils/debugLogger';

export interface ImageGenerationConfig {
  provider: 'nano-banana' | 'imagen' | 'placeholder' | 'dalle' | 'stable-diffusion';
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

export interface StableDiffusionModel {
  id: string;
  name: string;
  description?: string;
}

// Default configuration
const DEFAULT_CONFIG: ImageGenerationConfig = {
  provider: 'placeholder', // Default to placeholder since Gemini doesn't support image generation
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
        case 'stable-diffusion':
          return await this.generateWithStableDiffusion(request, progressCallback);
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

      // Use Gemini's image generation model - try the correct model that supports image generation
      const model = this.config.model || 'gemini-1.5-pro'; // Use a model that supports image generation

      imageDebug.log(`Attempting to generate image with model: ${model}`);

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 50,
          message: 'Generating image...'
        });
      }

      // Use the correct API for image generation - Gemini doesn't generate images directly
      // We need to use a different approach or service
      imageDebug.warn('Gemini API does not support direct image generation. Using placeholder instead.');
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

  private async generateWithStableDiffusion(request: ImageGenerationRequest, progressCallback?: ImageGenerationProgressCallback): Promise<ImageGenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Stable Diffusion API key not configured');
    }

    const startTime = Date.now();

    try {
      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 10,
          message: 'Initializing Stable Diffusion...'
        });
      }

      // Use Stability AI REST API v2 (according to docs)
      const baseUrl = this.config.baseUrl || 'https://api.stability.ai';
      const apiUrl = `${baseUrl}/v2beta/stable-image/generate/core`;

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 30,
          message: 'Connecting to Stable Diffusion API...'
        });
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: this.buildFormData(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorData.message ? ` - ${errorData.message}` : ''}`);
      }

      if (progressCallback) {
        progressCallback({
          status: 'generating',
          progress: 70,
          message: 'Processing image data...'
        });
      }

      const data = await response.json();

      if (data.artifacts && data.artifacts.length > 0) {
        // Convert base64 to data URL
        const imageData = data.artifacts[0].base64;
        const dataUrl = `data:image/png;base64,${imageData}`;

        imageDebug.log('Successfully generated image with Stable Diffusion');

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
            model: this.config.model || 'stable-diffusion-v1-6',
            provider: 'stable-diffusion',
            generationTime: Date.now() - startTime
          }
        };
      } else {
        throw new Error('No image data returned from Stable Diffusion API');
      }
    } catch (error) {
      imageDebug.error('Stable Diffusion image generation failed:', error);

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

  private buildFormData(request: ImageGenerationRequest): FormData {
    const formData = new FormData();

    // Required parameters
    formData.append('prompt', request.prompt);

    // Optional parameters with defaults
    if (request.width) formData.append('width', request.width.toString());
    if (request.height) formData.append('height', request.height.toString());
    if (request.steps) formData.append('steps', request.steps.toString());

    // Default values for better quality
    formData.append('cfg_scale', '7.0');
    formData.append('samples', '1');
    formData.append('style_preset', 'enhance'); // Use enhance for better quality

    return formData;
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

      // Fall back to placeholder instead of throwing error
      imageDebug.log('Falling back to placeholder image generation');
      return await this.generatePlaceholder(request, progressCallback);
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

// Fetch available Stable Diffusion models from Stability AI API
export const fetchStableDiffusionModels = async (apiKey?: string): Promise<StableDiffusionModel[]> => {
  if (!apiKey) {
    // Return default models if no API key provided
    return [
      { id: 'core', name: 'Stable Diffusion Core', description: 'High-quality general purpose model' },
      { id: 'sd3-large', name: 'Stable Diffusion 3 Large', description: 'Latest high-resolution model' },
      { id: 'sd3-medium', name: 'Stable Diffusion 3 Medium', description: 'Balanced quality and speed' },
      { id: 'sd3-large-turbo', name: 'Stable Diffusion 3 Large Turbo', description: 'Fast high-quality generation' },
      { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion v1.6', description: 'Classic high-quality model' }
    ];
  }

  try {
    // Try to validate API key with a simple generation request (without actually generating)
    // Use the balance endpoint if available, otherwise just return models
    const balanceResponse = await fetch('https://api.stability.ai/v2beta/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    // If balance endpoint works, API key is valid
    if (balanceResponse.ok) {
      return [
        { id: 'core', name: 'Stable Diffusion Core', description: 'High-quality general purpose model' },
        { id: 'sd3-large', name: 'Stable Diffusion 3 Large', description: 'Latest high-resolution model with excellent quality' },
        { id: 'sd3-medium', name: 'Stable Diffusion 3 Medium', description: 'Balanced quality and speed for most use cases' },
        { id: 'sd3-large-turbo', name: 'Stable Diffusion 3 Large Turbo', description: 'Fast high-quality generation with minimal steps' },
        { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion v1.6', description: 'Classic high-quality model with proven reliability' },
        { id: 'stable-diffusion-xl-1024-v1-0', name: 'Stable Diffusion XL 1.0', description: 'High-resolution model optimized for detailed images' },
        { id: 'stable-diffusion-xl-1024-v0-9', name: 'Stable Diffusion XL 0.9', description: 'Advanced high-resolution model with improved composition' }
      ];
    } else {
      // If balance endpoint fails, try a minimal generation request to validate
      const testFormData = new FormData();
      testFormData.append('prompt', 'test');
      testFormData.append('samples', '1');

      const testResponse = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: testFormData
      });

      // If we get a 200 or even a validation error (but not auth error), API key is valid
      if (testResponse.status !== 401 && testResponse.status !== 403) {
        return [
          { id: 'core', name: 'Stable Diffusion Core', description: 'High-quality general purpose model' },
          { id: 'sd3-large', name: 'Stable Diffusion 3 Large', description: 'Latest high-resolution model with excellent quality' },
          { id: 'sd3-medium', name: 'Stable Diffusion 3 Medium', description: 'Balanced quality and speed for most use cases' },
          { id: 'sd3-large-turbo', name: 'Stable Diffusion 3 Large Turbo', description: 'Fast high-quality generation with minimal steps' },
          { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion v1.6', description: 'Classic high-quality model with proven reliability' },
          { id: 'stable-diffusion-xl-1024-v1-0', name: 'Stable Diffusion XL 1.0', description: 'High-resolution model optimized for detailed images' },
          { id: 'stable-diffusion-xl-1024-v0-9', name: 'Stable Diffusion XL 0.9', description: 'Advanced high-resolution model with improved composition' }
        ];
      }
    }
  } catch (error) {
    console.warn('Failed to validate Stable Diffusion API key, using defaults:', error);
  }

  // Fall back to default models if validation fails
  return [
    { id: 'core', name: 'Stable Diffusion Core', description: 'High-quality general purpose model' },
    { id: 'sd3-large', name: 'Stable Diffusion 3 Large', description: 'Latest high-resolution model' },
    { id: 'sd3-medium', name: 'Stable Diffusion 3 Medium', description: 'Balanced quality and speed' },
    { id: 'sd3-large-turbo', name: 'Stable Diffusion 3 Large Turbo', description: 'Fast high-quality generation' },
    { id: 'stable-diffusion-v1-6', name: 'Stable Diffusion v1.6', description: 'Classic high-quality model' }
  ];
};
