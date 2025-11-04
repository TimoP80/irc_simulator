// Image Generation Service
// Supports multiple image generation APIs: Nano Banana, Imagen, and others
import { imageDebug } from '../utils/debugLogger.js';
import { listAvailableModels } from './geminiService.js';
import OpenAI from 'openai'; // Import OpenAI
// Fetches available image generation models from the Gemini API
export const getAvailableImageModels = async () => {
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
    }
    catch (error) {
        imageDebug.error('Failed to fetch available image models:', error);
        // Return a default list as a fallback
        return ['gemini-1.5-pro', 'gemini-1.5-flash'];
    }
};
// Default configuration
const DEFAULT_CONFIG = {
    provider: 'dalle', // Default to DALL-E for real image generation
    dalleModel: 'dall-e-3', // Use a modern, capable model
    baseUrl: undefined, // OpenAI uses its own base URL
    models: undefined,
    geminiApiKey: undefined,
    dalleApiKey: undefined,
    geminiModel: 'gemini-1.5-flash' // Default Gemini model for description generation
};
/**
 * Service for generating images using various providers.
 */
class ImageGenerationService {
    config;
    openai = null; // OpenAI client instance
    /**
     * Creates an instance of ImageGenerationService.
     * @param {Partial<ImageGenerationConfig>} [config={}] - Initial configuration.
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeOpenAI();
    }
    /**
     * Initializes the OpenAI client if the provider is DALL-E and an API key is available.
     * @private
     */
    initializeOpenAI() {
        if (this.config.provider === 'dalle' && this.config.dalleApiKey) {
            this.openai = new OpenAI({
                apiKey: this.config.dalleApiKey,
            });
        }
        else if (this.config.provider === 'gemini' && this.config.dalleApiKey) { // If Gemini is provider, DALL-E is still used for final image
            this.openai = new OpenAI({
                apiKey: this.config.dalleApiKey,
            });
        }
        else {
            this.openai = null;
        }
    }
    /**
     * Generates an image based on the provided request.
     * @param {ImageGenerationRequest} request - The image generation request.
     * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
     */
    async generateImage(request) {
        // This method now acts as a simple entry point
        return this._generateImageInternal(request);
    }
    /**
     * Internal method to handle the actual image generation logic.
     * @param {ImageGenerationRequest} request - The image generation request.
     * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
     */
    async _generateImageInternal(request) {
        const startTime = Date.now();
        try {
            switch (this.config.provider) {
                case 'gemini':
                    return await this.generateWithGemini(request);
                case 'imagen':
                    return await this.generateWithImagen(request);
                case 'dalle':
                    return await this.generateWithDALLE(request);
                case 'placeholder':
                default:
                    return await this.generatePlaceholder(request);
            }
        }
        catch (error) {
            imageDebug.error(`Error generating image with ${this.config.provider}:`, error);
            // Fallback to placeholder if the selected provider fails
            return this.generatePlaceholder(request);
        }
    }
    /**
     * Generates an image using the Gemini provider.
     * @private
     * @param {ImageGenerationRequest} request - The image generation request.
     * @returns {Promise<ImageGenerationResponse>} The response containing the image URL or an error.
     */
    async generateWithGemini(request) {
        if (!this.config.geminiApiKey) {
            throw new Error('Gemini API key for description generation not configured');
        }
        if (!this.config.dalleApiKey) {
            throw new Error('DALL-E API key for image generation not configured');
        }
        const startTime = Date.now();
        try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: this.config.geminiApiKey });
            const geminiModel = this.config.geminiModel || 'gemini-1.5-flash';
            imageDebug.log(`Attempting to generate image description with Gemini model: ${geminiModel}`);
            const descriptionResponse = await ai.models.generateContent({
                model: geminiModel,
                contents: [{ role: "user", parts: [{ text: `Create a detailed, vivid, and creative image description from the following prompt: "${request.prompt}". Focus on visual details, colors, lighting, and composition. The description should be suitable for an image generation AI. Max 150 words.` }] }],
            });
            const imageDescription = descriptionResponse.candidates[0].content.parts[0].text;
            imageDebug.log(`Generated image description: ${imageDescription}`);
            // Now use DALL-E to generate the image from the description
            return await this.generateWithDALLE({ ...request, prompt: imageDescription });
        }
        catch (error) {
            imageDebug.error('Gemini image description generation failed:', error);
            return await this.generatePlaceholder(request);
        }
    }
    async generateWithImagen(request) {
        if (!this.config.dalleApiKey) { // Assuming Imagen would also use a specific key or DALL-E's for now
            throw new Error('Imagen API key not configured');
        }
        throw new Error('Imagen integration not yet implemented');
    }
    async generateWithDALLE(request) {
        if (!this.openai) {
            throw new Error('OpenAI client not initialized. DALL-E API key might be missing or provider is not "dalle".');
        }
        const startTime = Date.now();
        const model = this.config.dalleModel || 'dall-e-3'; // Default to dall-e-3
        try {
            imageDebug.log(`Attempting to generate image with DALL-E model: ${model}`);
            const response = await this.openai.images.generate({
                model: model,
                prompt: request.prompt,
                n: 1, // Number of images to generate
                size: request.width && request.height ? `${request.width}x${request.height}` : '1024x1024', // Default size
                response_format: 'url', // Request URL for the image
            });
            if (response.data && response.data.length > 0 && response.data[0].url) {
                const imageUrl = response.data[0].url;
                imageDebug.log(`Successfully generated image with DALL-E: ${imageUrl}`);
                return {
                    success: true,
                    imageUrl: imageUrl,
                    metadata: {
                        model: model,
                        provider: 'dalle',
                        generationTime: Date.now() - startTime
                    }
                };
            }
            else {
                imageDebug.warn('No image URL received from DALL-E, falling back to placeholder');
                return await this.generatePlaceholder(request);
            }
        }
        catch (error) {
            imageDebug.error('DALL-E image generation failed:', error);
            return await this.generatePlaceholder(request);
        }
    }
    /**
     * Generates a placeholder image.
     * @private
     * @param {ImageGenerationRequest} request - The image generation request.
     * @returns {Promise<ImageGenerationResponse>} The response containing the placeholder image URL.
     */
    async generatePlaceholder(request) {
        // Generate a placeholder image using placehold.co service
        const width = request.width || 512;
        const height = request.height || 512;
        const prompt = request.prompt.substring(0, 50);
        // Create a placehold.co URL with custom text and styling
        const encodedText = encodeURIComponent(prompt);
        const imageUrl = `https://placehold.co/${width}x${height}/4A90E2/FFFFFF/png?text=${encodedText}&dummy=${Date.now()}`;
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
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.initializeOpenAI(); // Re-initialize OpenAI client if config changes
    }
    /**
     * Gets the current service configuration.
     * @returns {ImageGenerationConfig} The current configuration.
     */
    getConfig() {
        return { ...this.config };
    }
}
// Create a singleton instance
let imageService = null;
export const getImageGenerationService = (config) => {
    if (!imageService) {
        imageService = new ImageGenerationService(config);
    }
    else if (config) {
        // Update the existing service with new configuration
        imageService.updateConfig(config);
    }
    return imageService;
};
// Helper function to generate image with default service
export const generateImage = async (prompt, config) => {
    const service = getImageGenerationService(config);
    return await service.generateImage({
        prompt,
        width: 512,
        height: 512
    });
};
// Configuration helpers
export const setImageGenerationProvider = (provider, geminiApiKey, dalleApiKey, geminiModel, dalleModel) => {
    const service = getImageGenerationService();
    service.updateConfig({ provider, geminiApiKey, dalleApiKey, geminiModel, dalleModel });
};
export const isImageGenerationConfigured = () => {
    const service = getImageGenerationService();
    const config = service.getConfig();
    // Configuration is considered complete if a provider is set and the corresponding API key is present
    if (config.provider === 'dalle') {
        return !!config.dalleApiKey;
    }
    if (config.provider === 'gemini') {
        return !!config.geminiApiKey && !!config.dalleApiKey; // Gemini for description, DALL-E for generation
    }
    // Add checks for other providers if they become active
    return false;
};
