import { GoogleGenAI } from "@google/genai";
import type { User, Message, BotCommandType } from '../types';
import { withRateLimitAndRetries } from '../utils/config';
import { generateImage, getImageGenerationService } from './imageGenerationService';

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
    provider: 'nano-banana' | 'imagen' | 'placeholder' | 'dalle';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }
): Promise<Message | null> => {
  const commandParts = command.trim().split(' ');
  const botCommand = commandParts[0].toLowerCase();
  const args = commandParts.slice(1);

  console.log(`[Bot Service] Handling command: ${botCommand} from ${user.nickname} in ${channelName}`);

  switch (botCommand) {
    case '!image':
    case '!img':
      return await generateImageCommand(args, user, channelName, model, imageConfig);
    
    case '!weather':
      return await generateWeatherCommand(args, user, channelName, model);
    
    case '!time':
      return await generateTimeCommand(user, channelName, model);
    
    case '!info':
      return await generateInfoCommand(args, user, channelName, model);
    
    case '!help':
      return await generateHelpCommand(user, channelName, model);
    
    case '!quote':
      return await generateQuoteCommand(user, channelName, model);
    
    case '!joke':
      return await generateJokeCommand(user, channelName, model);
    
    case '!fact':
      return await generateFactCommand(user, channelName, model);
    
    case '!translate':
      return await generateTranslateCommand(args, user, channelName, model);
    
    case '!calc':
    case '!calculate':
      return await generateCalcCommand(args, user, channelName, model);
    
    case '!search':
      return await generateSearchCommand(args, user, channelName, model);
    
    default:
      return null; // Unknown command
  }
};

// Generate AI image using proper image generation service
const generateImageCommand = async (
  args: string[], 
  user: User, 
  channelName: string, 
  model: string,
  imageConfig?: {
    provider: 'nano-banana' | 'imagen' | 'placeholder' | 'dalle';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }
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
        id: Date.now(),
        nickname: user.nickname,
        content: `🖼️ Generated image for "${prompt}"`,
        timestamp: new Date(),
        type: 'bot',
        botCommand: 'image',
        botResponse: { 
          imageUrl: result.imageUrl, 
          prompt,
          metadata: result.metadata 
        },
        images: [result.imageUrl]
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
        id: Date.now(),
        nickname: user.nickname,
        content: errorMessage,
        timestamp: new Date(),
        type: 'bot',
        botCommand: 'image'
      };
    }
  } catch (error) {
    console.error('[Bot Service] Image generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't generate an image for "${prompt}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'image'
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
      botResponse: { location, weatherInfo }
    };
  } catch (error) {
    console.error('[Bot Service] Weather generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't get weather information for "${location}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'weather'
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
    botResponse: { time: timeString, timezone }
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
      return await ai.getGenerativeModel({ model }).generateContent([
        {
          text: `Provide a brief, informative response about "${query}". 
          Keep it concise (2-3 sentences) and factual.
          Format it like a helpful bot response.`
        }
      ]);
    });

    const info = response.response.text();
    
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `ℹ️ ${info}`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'info',
      botResponse: { query, info }
    };
  } catch (error) {
    console.error('[Bot Service] Info generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't find information about "${query}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'info'
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
    botResponse: { helpText }
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
      botResponse: { quote }
    };
  } catch (error) {
    console.error('[Bot Service] Quote generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't generate a quote right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'quote'
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
      botResponse: { joke }
    };
  } catch (error) {
    console.error('[Bot Service] Joke generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't think of a joke right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'joke'
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
      botResponse: { fact }
    };
  } catch (error) {
    console.error('[Bot Service] Fact generation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't find an interesting fact right now. Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'fact'
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
      botCommand: 'translate'
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
      botResponse: { originalText: text, translation }
    };
  } catch (error) {
    console.error('[Bot Service] Translation failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't translate "${text}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'translate'
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
      botCommand: 'calc'
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
        botCommand: 'calc'
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
      botResponse: { expression, result }
    };
  } catch (error) {
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Invalid math expression: "${expression}". Please check your syntax.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'calc'
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
      botCommand: 'search'
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
      botResponse: { query, results: searchResults }
    };
  } catch (error) {
    console.error('[Bot Service] Search failed:', error);
    return {
      id: Date.now(),
      nickname: user.nickname,
      content: `❌ Sorry, I couldn't search for "${query}". Please try again later.`,
      timestamp: new Date(),
      type: 'bot',
      botCommand: 'search'
    };
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
