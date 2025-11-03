// Vision Service
// Handles image analysis and description using Google GenAI
import { GoogleGenAI } from "@google/genai";
import { visionDebug } from '../utils/debugLogger';
import { listAvailableModels } from './geminiService'; // Import model listing function
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
// Get available vision models
export const getAvailableVisionModels = async () => {
    try {
        const allModels = await listAvailableModels();
        // Filter for models that support vision capabilities (e.g., 'flash' and 'pro' variants)
        const visionModels = allModels
            .filter(model => model.name.includes('gemini') && (model.name.includes('flash') || model.name.includes('pro')))
            .map(model => model.name.replace('models/', ''));
        return visionModels;
    }
    catch (error) {
        visionDebug.error('Failed to fetch available vision models:', error);
        // Return a default list as a fallback
        return ['gemini-1.5-flash', 'gemini-1.5-pro'];
    }
};
const extractTextFromResponse = (response) => {
    if (response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            const textPart = candidate.content.parts.find((part) => 'text' in part);
            if (textPart && 'text' in textPart) {
                return textPart.text.trim();
            }
        }
    }
    visionDebug.error("Invalid response structure:", response);
    throw new Error("Invalid response from AI service: unable to extract text content");
};
class VisionService {
    model;
    constructor(model = 'gemini-1.5-flash') {
        this.model = model;
        visionDebug.log('VisionService initialized with model:', this.model);
    }
    async analyzeImage(request) {
        try {
            const prompt = request.prompt || "Describe this image in detail.";
            const imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: request.imageData,
                },
            };
            const result = await ai.models.generateContent({
                model: this.model,
                contents: [{ role: "user", parts: [{ text: prompt }, imagePart] }]
            });
            const description = extractTextFromResponse(result);
            return {
                success: true,
                description,
                metadata: {
                    model: this.model,
                    provider: 'gemini',
                },
            };
        }
        catch (error) {
            visionDebug.error('Error analyzing image:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
let visionService = null;
export const getVisionService = (model) => {
    if (!visionService) {
        visionService = new VisionService(model);
    }
    return visionService;
};
