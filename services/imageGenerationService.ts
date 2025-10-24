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
  provider: 'placeholder', // Default to placeholder for safety
  model: 'gemini-2.5-flash-image-preview',
  baseUrl: undefined // Nano Banana uses Google GenAI SDK directly
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
      throw new Error('Nano Banana API key not configured');
    }

    try {
      // Import GoogleGenAI dynamically to avoid issues in browser
      const { GoogleGenAI } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey: this.config.apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: request.prompt,
      });

      // Extract image data from response
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Convert base64 data to data URL
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUrl = `data:${mimeType};base64,${imageData}`;
          
          return {
            success: true,
            imageUrl: dataUrl,
            metadata: {
              model: 'gemini-2.5-flash-image-preview',
              provider: 'nano-banana',
              generationTime: Date.now() - Date.now()
            }
          };
        }
      }
      
      // If no image data found, return error
      throw new Error('No image data received from Nano Banana API');
      
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        throw new Error('Network error: Unable to connect to Nano Banana API. This is likely due to CORS restrictions. Please use the placeholder service or set up a proxy server.');
      }
      if (error instanceof TypeError && error.message.includes('CORS')) {
        throw new Error('CORS error: Nano Banana API does not allow direct browser requests. Please use the placeholder service or set up a proxy server to bypass CORS restrictions.');
      }
      throw error;
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
    // Generate a local placeholder image using SVG data URL to avoid CORS issues
    const width = request.width || 512;
    const height = request.height || 512;
    const prompt = request.prompt.substring(0, 50);
    
    // Create an SVG placeholder image as a data URL
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#4A90E2"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${prompt.replace(/[<>&"']/g, (char) => {
            switch(char) {
              case '<': return '&lt;';
              case '>': return '&gt;';
              case '&': return '&amp;';
              case '"': return '&quot;';
              case "'": return '&#39;';
              default: return char;
            }
          })}
        </text>
        <text x="50%" y="70%" font-family="Arial, sans-serif" font-size="12" fill="#E0E0E0" text-anchor="middle" dominant-baseline="middle">
          Placeholder Image
        </text>
      </svg>
    `;
    
    // Convert SVG to data URL
    const imageUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
    
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
