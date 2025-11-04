// Audio Service
// Handles microphone input and audio analysis using Google GenAI

import { audioDebug } from '../utils/debugLogger';
import { listAvailableModels } from './geminiService';
import { getAIService } from './vertexAIService';

export interface AudioAnalysisRequest {
  audioData: string; // base64 encoded audio
  prompt?: string;
}

export interface AudioAnalysisResponse {
  success: boolean;
  transcript?: string;
  error?: string;
  metadata?: {
    model: string;
    provider: string;
  };
}

// Get the AI service instance (supports both Vertex AI and API key)
const ai = getAIService();

// Get available audio models
export const getAvailableAudioModels = async (): Promise<string[]> => {
    try {
        const allModels = await listAvailableModels();
        // Filter for models that support audio capabilities
        const audioModels = allModels
            .filter(model => model.name.includes('gemini') && (model.name.includes('flash') || model.name.includes('pro')))
            .map(model => model.name.replace('models/', ''));
        return audioModels;
    } catch (error) {
        audioDebug.error('Failed to fetch available audio models:', error);
        return ['gemini-1.5-flash', 'gemini-1.5-pro'];
    }
};

const extractTextFromResponse = (response: any): string => {
  if (response && response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const textPart = candidate.content.parts.find((part: any) => 'text' in part);
      if (textPart && 'text' in textPart) {
        return textPart.text.trim();
      }
    }
  }
  audioDebug.error("Invalid response structure:", response);
  throw new Error("Invalid response from AI service: unable to extract text content");
};

class AudioService {
  private model: string;

  constructor(model: string = 'gemini-1.5-flash') {
    this.model = model;
    audioDebug.log('AudioService initialized with model:', this.model);
  }

  async analyzeAudio(request: AudioAnalysisRequest): Promise<AudioAnalysisResponse> {
    try {
      const prompt = request.prompt || "Transcribe this audio.";
      const audioPart = {
        inlineData: {
          mimeType: 'audio/wav',
          data: request.audioData,
        },
      };

      const result = await ai.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts: [ {text: prompt}, audioPart ] }]
      });

      const transcript = extractTextFromResponse(result);

      return {
        success: true,
        transcript,
        metadata: {
          model: this.model,
          provider: 'gemini',
        },
      };
    } catch (error) {
      audioDebug.error('Error analyzing audio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

let audioService: AudioService | null = null;

export const getAudioService = (model?: string): AudioService => {
  if (!audioService) {
    audioService = new AudioService(model);
  }
  return audioService;
};