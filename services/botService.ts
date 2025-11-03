import { GoogleGenAI } from "@google/genai";
import type { User, Message, BotCommandType } from '../types';
import { withRateLimitAndRetries } from '../utils/config';
import { generateImage, getImageGenerationService } from './imageGenerationService';
import { generateTranslatedPersonality } from '../services/geminiService';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Bot command handlers
export const handleBotCommand = async (
  command: string,
  user: User,
  channelName: string,
  model: string = 'gemini-2.5-flash',
  imageConfig?: {
    provider: 'gemini' | 'imagen' | 'placeholder' | 'dalle';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  addMessageToContext?: (message: Message, context: any) => void,
  updateMessageInContext?: (message: Message, context: any) => void,
  generateUniqueMessageId?: () => number,
  activeContext?: any
): Promise<Message | null> => {
  const commandParts = command.trim().split(' ');
  const botCommand = commandParts[0].toLowerCase();
  const args = commandParts.slice(1);

  console.log(`[Bot Service] Handling command: ${botCommand} from ${user.nickname} in ${channelName}`);

  // If callbacks are provided, manage the typing indicator
  let typingMessageId: number | undefined;
  if (addMessageToContext && updateMessageInContext && generateUniqueMessageId && activeContext) {
    typingMessageId = generateUniqueMessageId();
    const typingMessage: Message = {
      id: typingMessageId,
      nickname: user.nickname,
      content: '', // Content will be updated later
      timestamp: new Date(),
      type: 'bot',
      isTyping: true,
      botCommand: botCommand as BotCommandType,
      botResponse: { status: 'generating' }
    };
    addMessageToContext(typingMessage, activeContext);
  }

  let botResponse: Message | null = null;

  try {
    switch (botCommand) {
      case '!image':
      case '!img':
        botResponse = await generateImageCommand(args, user, channelName, model, imageConfig, addMessageToContext, updateMessageInContext, generateUniqueMessageId, activeContext);
        break;
      
      case '!weather':
        botResponse = await generateWeatherCommand(args, user, channelName, model);
        break;
      
      case '!time':
        botResponse = await generateTimeCommand(user, channelName, model);
        break;
      
      case '!info':
        botResponse = await generateInfoCommand(args, user, channelName, model);
        break;
      
      case '!help':
        botResponse = await generateHelpCommand(user, channelName, model);
        break;
      
      case '!quote':
        botResponse = await generateQuoteCommand(user, channelName, model);
        break;
      
      case '!joke':
        botResponse = await generateJokeCommand(user, channelName, model);
        break;
      
      case '!fact':
        botResponse = await generateFactCommand(user, channelName, model);
        break;
      
      case '!translate':
        botResponse = await generateTranslateCommand(args, user, channelName, model);
        break;
      
      case '!calc':
      case '!calculate':
        botResponse = await generateCalcCommand(args, user, channelName, model);
        break;
      
      case '!search':
        botResponse = await generateSearchCommand(args, user, channelName, model);
        break;
      
      default:
        botResponse = null; // Unknown command
    }
  } catch (error) {
    console.error(`[Bot Service] Error handling command ${botCommand}:`, error);
    botResponse = {
      id: generateUniqueMessageId ? generateUniqueMessageId() : Date.now(),
      nickname: user.nickname,
      content: `❌ An error occurred while processing your command: ${botCommand}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: botCommand as BotCommandType,
      isTyping: false
    };
  } finally {
    // Update the typing message with the actual response or remove it
    if (typingMessageId && updateMessageInContext && activeContext) {
      if (botResponse) {
        updateMessageInContext({ ...botResponse, id: typingMessageId, isTyping: false }, activeContext);
      } else {
        // If no response, just remove the typing indicator
        updateMessageInContext({
          id: typingMessageId,
          nickname: user.nickname,
          content: '',
          timestamp: new Date(),
          type: 'bot',
          isTyping: false
        }, activeContext);
      }
    }
  }

  return botResponse;
};

// Generate AI image using proper image generation service
const generateImageCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string,
  imageConfig?: {
    provider: 'gemini' | 'imagen' | 'placeholder' | 'dalle';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  },
  addMessageToContext?: (message: Message, context: any) => void,
  updateMessageInContext?: (message: Message, context: any) => void,
  generateUniqueMessageId?: () => number,
  activeContext?: any
): Promise<Message> => {
  const prompt = args.join(' ') || 'a beautiful landscape';
  
  try {
    console.log(`[Bot Service] Generating image for prompt: "${prompt}"`);
    
    // Use the image generation service with configuration
    const imageService = getImageGenerationService(imageConfig);
    const result = await imageService.generateImage({
      prompt,
      width: 512,
      height: 512
    });
    
    if (result.success && result.imageUrl) {
      console.log(`[Bot Service] Image generated successfully: ${result.imageUrl}`);
      
      return {
        id: generateUniqueMessageId ? generateUniqueMessageId() : Date.now(),
        nickname: user.nickname,
        content: `🖼️ An image has been generated.`,
        timestamp: new Date(),
        type: 'bot',
        botCommand: 'image',
        botResponse: {
          imageUrl: result.imageUrl,
          prompt,
          metadata: result.metadata
        },
        images: [result.imageUrl],
        isTyping: false // Ensure typing is false when response is ready
      };
    } else {
      console.error('[Bot Service] Image generation failed:', result.error);
      
      // Provide helpful error message based on the error type
      let errorMessage = `❌ Image generation failed: ${result.error || 'Unknown error'}`;
      
      if (result.error?.includes('CORS')) {
        errorMessage = `❌ Image generation failed due to CORS restrictions. Please try using the placeholder service or contact your administrator.`;
      } else if (result.error?.includes('Network')) {
        errorMessage = `❌ Image generation failed due to network issues. Please check your internet connection.`;
      } else if (result.error?.includes('404')) {
        errorMessage = `❌ Image generation service not found. Please check the API endpoint configuration.`;
      } else if (result.error?.includes('API key')) {
        errorMessage = `❌ Image generation failed: API key not configured. Please check your settings.`;
      }
      
      return {
        id: generateUniqueMessageId ? generateUniqueMessageId() : Date.now(),
        nickname: user.nickname,
        content: errorMessage,
        timestamp: new Date(),
        type: 'bot',
        botCommand: 'image',
        isTyping: false // Ensure typing is false on error
      };
    }
  } catch (error) {
    console.error('[Bot Service] Image generation failed:', error);
    return {
      id: generateUniqueMessageId ? generateUniqueMessageId() : Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't generate an image for "${prompt}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'image',
      isTyping: false // Ensure typing is false on error
    };
  }
};

// Weather information
const generateWeatherCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const location = args.join(' ') || 'current location';
  
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Provide a brief weather report for ${location}.
        Include temperature, conditions, and a brief forecast.
        Keep it concise and friendly, like a weather bot would respond.`
      });
    });

    const weatherInfo = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `🌤️ Weather for ${location}: ${weatherInfo}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'weather',
      botResponse: { location, weatherInfo },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Weather generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't get weather information for "${location}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'weather',
      isTyping: false
    };
  }
};

// Current time
const generateTimeCommand = async (
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const now = new Date();
  const timeString = now.toLocaleString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    id: Date.now(),
    nickname: user.nickname,
    content: `🕐 Current time: ${timeString} (${timezone})`,
    timestamp: new Date(),
    type: 'bot',
    botCommand: 'time',
    botResponse: { time: timeString, timezone },
    isTyping: false
  };
};

// Information lookup
const generateInfoCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const query = args.join(' ') || 'general information';
  
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Provide a brief, informative response about "${query}".
          Keep it concise (2-3 sentences) and factual.
          Format it like a helpful bot response.`
      });
    });

    const info = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `ℹ️ ${info}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'info',
      botResponse: { query, info },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Info generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't find information about "${query}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'info',
      isTyping: false
    };
  }
};

// Help command
const generateHelpCommand = async (
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const helpText = `🤖 Available bot commands:
  !image <prompt> - Generate an AI image
  !weather [location] - Get weather information
  !time - Show current time
  !info <topic> - Get information about a topic
  !quote - Get a random quote
  !joke - Tell a joke
  !fact - Share an interesting fact
  !translate <text> - Translate text
  !calc <expression> - Calculate math expressions
  !search <query> - Search for information`;
  
  return {
    id: Date.now(),
    nickname: user.nickname,
    content: helpText,
    timestamp: new Date(),
    type: 'bot',
    botCommand: 'help',
    botResponse: { helpText },
    isTyping: false
  };
};

// Random quote
const generateQuoteCommand = async (
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Generate an inspiring or interesting quote.
        Include the author if possible.
        Keep it concise and meaningful.`
      });
    });

    const quote = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `💭 ${quote}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'quote',
      botResponse: { quote },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Quote generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't generate a quote right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'quote',
      isTyping: false
    };
  }
};

// Joke
const generateJokeCommand = async (
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Tell a clean, family-friendly joke.
        Keep it short and funny.
        Format it like a bot would tell a joke.`
      });
    });

    const joke = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `😄 ${joke}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'joke',
      botResponse: { joke },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Joke generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't think of a joke right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'joke',
      isTyping: false
    };
  }
};

// Interesting fact
const generateFactCommand = async (
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Share an interesting, educational fact.
        Make it surprising or little-known.
        Keep it concise and factual.`
      });
    });

    const fact = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `🧠 ${fact}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'fact',
      botResponse: { fact },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Fact generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't find an interesting fact right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'fact',
      isTyping: false
    };
  }
};

// Translation
const generateTranslateCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const text = args.join(' ');
  
  if (!text) {
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Please provide text to translate. Usage: !translate <text>`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'translate',
      isTyping: false
    };
  }
  
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Translate the following text to English: "${text}".
        If it's already in English, translate it to Spanish.
        Provide the translation and indicate the target language.`
      });
    });

    const translation = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `🌍 ${translation}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'translate',
      botResponse: { originalText: text, translation },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Translation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't translate "${text}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'translate',
      isTyping: false
    };
  }
};

// Calculator
const generateCalcCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const expression = args.join(' ');
  
  if (!expression) {
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Please provide a math expression. Usage: !calc <expression>`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'calc',
      isTyping: false
    };
  }
  
  try {
    // Simple math evaluation with basic operations only
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    if (sanitizedExpression !== expression) {
      return {
        id: Date.now(),
        nickname: user.nickname,
        content: `❌ Invalid characters in expression: "${expression}". Only numbers and basic operators (+, -, *, /, parentheses) are allowed.`,
        timestamp: new Date(),
        type: 'bot',
        botCommand: 'calc',
        isTyping: false
      };
    }
    
    // Use Function constructor instead of eval for better security
    const result = new Function('return ' + sanitizedExpression)();
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `🧮 ${expression} = ${result}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'calc',
      botResponse: { expression, result },
      isTyping: false
    };
  } catch (error) {
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Invalid math expression: "${expression}". Please check your syntax.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'calc',
      isTyping: false
    };
  }
};

// Search
const generateSearchCommand = async (
  args: string[],
  user: User,
  channelName: string,
  model: string
): Promise<Message> => {
  const query = args.join(' ');
  
  if (!query) {
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Please provide a search query. Usage: !search <query>`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'search',
      isTyping: false
    };
  }
  
  try {
    const response = await withRateLimitAndRetries(async () => {
      return await ai.models.generateContent({
        model: model,
        contents: `Search for information about "${query}".
        Provide a brief, informative summary.
        Keep it concise and relevant.`
      });
    });

    const searchResults = response.candidates[0].content.parts[0].text;
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `🔍 Search results for "${query}": ${searchResults}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'search',
      botResponse: { query, results: searchResults },
      isTyping: false
    };
  } catch (error) {
    console.error('[Bot Service] Search failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't search for "${query}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'search',
      isTyping: false
    };
  }
};

/**
 * Translates a bot's personality description to a specified language.
 * @param personality The personality description to translate.
 * @param language The target language for the translation.
 * @returns A promise that resolves to the translated personality string.
 */
export const translateBotPersonality = async (personality: string, language: string): Promise<string> => {
  try {
    const translatedPersonality = await generateTranslatedPersonality(personality, language);
    return translatedPersonality;
  } catch (error) {
    console.error(`[Bot Service] Error translating personality:`, error);
    throw error; // Re-throw the error for the UI layer to handle
  }
};

// Check if a message is a bot command
export const isBotCommand = (content: string): boolean => {
  const trimmed = content.trim();
  return trimmed.startsWith('!') && trimmed.length > 1;
};

// Get available bot commands
export const getAvailableBotCommands = (): string[] => {
  return [
    '!image', '!img', '!weather', '!time', '!info', '!help',
    '!quote', '!joke', '!fact', '!translate', '!calc', '!search'
  ];
};
