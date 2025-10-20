import { GoogleGenAI, Type } from "@google/genai";
import type { Channel, Message, PrivateMessageConversation, RandomWorldConfig, GeminiModel, ModelsListResponse, User } from '../types';
import { withRateLimitAndRetries } from '../utils/config';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Validate and clean model ID
const validateModelId = (model: string): string => {
  // If model contains spaces or looks like a display name, extract the actual model ID
  if (model.includes(' ') || model.includes('-') && model.length > 20) {
    // Try to extract model ID from display name
    const match = model.match(/(gemini-[0-9.]+-[a-z]+)/i);
    if (match) {
      console.log(`[AI Debug] Extracted model ID "${match[1]}" from display name "${model}"`);
      return match[1];
    }
  }
  
  // If it looks like a valid model ID, return as is
  if (model.match(/^gemini-[0-9.]+-[a-z]+$/i)) {
    return model;
  }
  
  // Fallback to default
  console.log(`[AI Debug] Invalid model ID "${model}", falling back to default`);
  return 'gemini-2.5-flash';
};

const formatMessageHistory = (messages: Message[]): string => {
  return messages
    .slice(-15) // Get last 15 messages
    .map(m => `${m.nickname}: ${m.content}`)
    .join('\n');
};

const getBaseSystemInstruction = (currentUserNickname: string) => `You are an advanced AI simulating an Internet Relay Chat (IRC) environment. 
Your goal is to generate realistic, brief, and in-character chat messages for various virtual users.
Adhere strictly to the format 'nickname: message'. 
Do not add any extra text, explanations, or markdown formatting. 
Keep messages concise and natural for a chat room setting.
The human user's nickname is '${currentUserNickname}'.
`;

export const generateChannelActivity = async (channel: Channel, currentUserNickname: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  console.log(`[AI Debug] generateChannelActivity called for channel: ${channel.name}`);
  console.log(`[AI Debug] Model parameter: "${model}" (type: ${typeof model}, length: ${model.length})`);
  
  const validatedModel = validateModelId(model);
  console.log(`[AI Debug] Validated model ID: "${validatedModel}"`);
  
  const usersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
  if (usersInChannel.length === 0) {
    console.log(`[AI Debug] No users in channel ${channel.name} (excluding current user)`);
    return '';
  }
  
  const randomUser = usersInChannel[Math.floor(Math.random() * usersInChannel.length)];
  console.log(`[AI Debug] Selected user: ${randomUser.nickname} for channel activity`);

  const prompt = `
The topic of channel ${channel.name} is: "${channel.topic}".
The users in the channel are: ${channel.users.map(u => u.nickname).join(', ')}.
Their personalities are: ${channel.users.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
The last 15 messages were:
${formatMessageHistory(channel.messages)}

Generate a new, single, in-character message from ${randomUser.nickname} that is relevant to the topic or the recent conversation.
The message must be a single line in the format: "nickname: message"

Consider ${randomUser.nickname}'s writing style:
- Formality: ${randomUser.writingStyle.formality}
- Verbosity: ${randomUser.writingStyle.verbosity}
- Humor: ${randomUser.writingStyle.humor}
- Emoji usage: ${randomUser.writingStyle.emojiUsage}
- Punctuation: ${randomUser.writingStyle.punctuation}
- Language fluency: ${randomUser.languageSkills.fluency}
- Languages: ${randomUser.languageSkills.languages.join(', ')}
${randomUser.languageSkills.accent ? `- Accent: ${randomUser.languageSkills.accent}` : ''}
`;

  try {
    console.log(`[AI Debug] Sending request to Gemini for channel activity in ${channel.name}`);
    console.log(`[AI Debug] Using model ID: "${validatedModel}" for API call`);
    const response = await withRateLimitAndRetries(() => 
      ai.models.generateContent({
          model: validatedModel,
          contents: prompt,
          config: {
              systemInstruction: getBaseSystemInstruction(currentUserNickname),
              temperature: 0.9,
              maxOutputTokens: 100,
              thinkingConfig: { thinkingBudget: 0 },
          },
      })
    );
    
    const result = response.text.trim();
    console.log(`[AI Debug] Successfully generated channel activity: "${result}"`);
    return result;
  } catch (error) {
    console.error(`[AI Debug] Error generating channel activity for ${channel.name}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      channelName: channel.name,
      selectedUser: randomUser.nickname,
      userCount: usersInChannel.length
    });
    throw error;
  }
};

export const generateReactionToMessage = async (channel: Channel, userMessage: Message, currentUserNickname: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
    console.log(`[AI Debug] generateReactionToMessage called for channel: ${channel.name}, reacting to: ${userMessage.nickname}`);
    
    const validatedModel = validateModelId(model);
    console.log(`[AI Debug] Validated model ID for reaction: "${validatedModel}"`);
    
    const usersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
    if (usersInChannel.length === 0) {
        console.log(`[AI Debug] No users in channel ${channel.name} to react (excluding current user)`);
        return '';
    }

    const randomUser = usersInChannel[Math.floor(Math.random() * usersInChannel.length)];
    console.log(`[AI Debug] Selected user: ${randomUser.nickname} to react to ${userMessage.nickname}'s message`);
    
    // Handle different message types
    let messageDescription = '';
    if (userMessage.type === 'action') {
      messageDescription = `performed an action: *${userMessage.nickname} ${userMessage.content}*`;
    } else {
      messageDescription = `said: "${userMessage.content}"`;
    }
    
    const prompt = `
In IRC channel ${channel.name}, the user "${userMessage.nickname}" just ${messageDescription}.
The topic is: "${channel.topic}".
The other users in the channel are: ${usersInChannel.map(u => u.nickname).join(', ')}.
Their personalities are: ${usersInChannel.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
The last 15 messages were:
${formatMessageHistory(channel.messages)}

Generate a realistic and in-character reaction from ${randomUser.nickname}.
The reaction must be a single line in the format: "nickname: message"

Consider ${randomUser.nickname}'s writing style:
- Formality: ${randomUser.writingStyle.formality}
- Verbosity: ${randomUser.writingStyle.verbosity}
- Humor: ${randomUser.writingStyle.humor}
- Emoji usage: ${randomUser.writingStyle.emojiUsage}
- Punctuation: ${randomUser.writingStyle.punctuation}
- Language fluency: ${randomUser.languageSkills.fluency}
- Languages: ${randomUser.languageSkills.languages.join(', ')}
${randomUser.languageSkills.accent ? `- Accent: ${randomUser.languageSkills.accent}` : ''}
`;
    
    try {
        console.log(`[AI Debug] Sending request to Gemini for reaction in ${channel.name}`);
        const response = await withRateLimitAndRetries(() => 
            ai.models.generateContent({
                model: validatedModel,
                contents: prompt,
                config: {
                    systemInstruction: getBaseSystemInstruction(currentUserNickname),
                    temperature: 0.8,
                    maxOutputTokens: 150,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            })
        );
        
        const result = response.text.trim();
        console.log(`[AI Debug] Successfully generated reaction: "${result}"`);
        return result;
    } catch (error) {
        console.error(`[AI Debug] Error generating reaction for ${channel.name}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            channelName: channel.name,
            reactingUser: randomUser.nickname,
            originalMessage: userMessage.content,
            originalUser: userMessage.nickname,
            messageType: userMessage.type
        });
        throw error;
    }
};

export const generatePrivateMessageResponse = async (conversation: PrivateMessageConversation, userMessage: Message, currentUserNickname: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
    console.log(`[AI Debug] generatePrivateMessageResponse called for user: ${conversation.user.nickname}`);
    
    const validatedModel = validateModelId(model);
    console.log(`[AI Debug] Validated model ID for private message: "${validatedModel}"`);
    
    const aiUser = conversation.user;
    const prompt = `
You are roleplaying as an IRC user named '${aiUser.nickname}'. 
Your personality is: ${aiUser.personality}.
You are in a private message conversation with '${currentUserNickname}'.
The conversation history (last 15 messages) is:
${formatMessageHistory(conversation.messages)}

'${currentUserNickname}' just sent you this message: "${userMessage.content}"

Your writing style:
- Formality: ${aiUser.writingStyle.formality}
- Verbosity: ${aiUser.writingStyle.verbosity}
- Humor: ${aiUser.writingStyle.humor}
- Emoji usage: ${aiUser.writingStyle.emojiUsage}
- Punctuation: ${aiUser.writingStyle.punctuation}
- Language fluency: ${aiUser.languageSkills.fluency}
- Languages: ${aiUser.languageSkills.languages.join(', ')}
${aiUser.languageSkills.accent ? `- Accent: ${aiUser.languageSkills.accent}` : ''}

Generate a natural, in-character response.
The response must be a single line in the format: "${aiUser.nickname}: message"
`;

    try {
        console.log(`[AI Debug] Sending request to Gemini for private message response from ${aiUser.nickname}`);
        const response = await withRateLimitAndRetries(() => 
            ai.models.generateContent({
                model: validatedModel,
                contents: prompt,
                config: {
                    systemInstruction: getBaseSystemInstruction(currentUserNickname),
                    temperature: 0.75,
                    maxOutputTokens: 200,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            })
        );
        
        const result = response.text.trim();
        console.log(`[AI Debug] Successfully generated private message response: "${result}"`);
        return result;
    } catch (error) {
        console.error(`[AI Debug] Error generating private message response from ${aiUser.nickname}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            aiUser: aiUser.nickname,
            currentUser: currentUserNickname,
            messageContent: userMessage.content,
            conversationLength: conversation.messages.length
        });
        throw error;
    }
};


export const generateBatchUsers = async (count: number, model: string = 'gemini-2.5-flash'): Promise<User[]> => {
  console.log(`[AI Debug] generateBatchUsers called for count: ${count}`);
  
  const validatedModel = validateModelId(model);
  console.log(`[AI Debug] Validated model ID for batch users: "${validatedModel}"`);
  
  const prompt = `
Generate ${count} unique IRC users with diverse personalities, language skills, and writing styles.
Each user should have:
- A unique nickname (lowercase, creative, tech-inspired)
- A detailed personality description
- Language skills with fluency level, languages spoken, and optional accent
- Writing style preferences for formality, verbosity, humor, emoji usage, and punctuation

Make each user distinct and interesting for an IRC chat environment.
Provide the output in JSON format.
`;

  try {
    console.log(`[AI Debug] Sending request to Gemini for batch user generation (${count} users)`);
    const response = await withRateLimitAndRetries(() =>
      ai.models.generateContent({
        model: validatedModel,
        contents: prompt,
        config: {
          systemInstruction: "You are a creative character generator for an IRC simulation. Generate diverse, interesting users with unique personalities and communication styles. Provide a valid JSON response.",
          temperature: 1.0,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              users: {
                type: Type.ARRAY,
                description: `A list of ${count} virtual users.`,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nickname: {
                      type: Type.STRING,
                      description: "The user's lowercase nickname."
                    },
                    personality: {
                      type: Type.STRING,
                      description: "A detailed personality description."
                    },
                    languageSkills: {
                      type: Type.OBJECT,
                      properties: {
                        fluency: {
                          type: Type.STRING,
                          enum: ['beginner', 'intermediate', 'advanced', 'native'],
                          description: "Language fluency level."
                        },
                        languages: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "List of languages the user speaks."
                        },
                        accent: {
                          type: Type.STRING,
                          description: "Optional accent or dialect description."
                        }
                      },
                      required: ['fluency', 'languages']
                    },
                    writingStyle: {
                      type: Type.OBJECT,
                      properties: {
                        formality: {
                          type: Type.STRING,
                          enum: ['casual', 'formal', 'mixed'],
                          description: "Writing formality level."
                        },
                        verbosity: {
                          type: Type.STRING,
                          enum: ['concise', 'moderate', 'verbose'],
                          description: "Writing verbosity level."
                        },
                        humor: {
                          type: Type.STRING,
                          enum: ['none', 'light', 'heavy'],
                          description: "Humor level in writing."
                        },
                        emojiUsage: {
                          type: Type.STRING,
                          enum: ['none', 'minimal', 'frequent'],
                          description: "Emoji usage frequency."
                        },
                        punctuation: {
                          type: Type.STRING,
                          enum: ['minimal', 'standard', 'excessive'],
                          description: "Punctuation style."
                        }
                      },
                      required: ['formality', 'verbosity', 'humor', 'emojiUsage', 'punctuation']
                    }
                  },
                  required: ['nickname', 'personality', 'languageSkills', 'writingStyle']
                }
              }
            },
            required: ['users']
          }
        }
      })
    );

    console.log(`[AI Debug] Successfully received response from Gemini for batch user generation`);
    const result = JSON.parse(response.text);
    const users = result.users.map((user: any) => ({
      ...user,
      status: 'online' as const
    }));
    
    console.log(`[AI Debug] Successfully generated ${users.length} users:`, users.map(u => u.nickname));
    return users;
  } catch (error) {
    console.error(`[AI Debug] Error generating batch users (${count} requested):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestedCount: count
    });
    throw error;
  }
};

export const generateRandomWorldConfiguration = async (model: string = 'gemini-2.5-flash'): Promise<RandomWorldConfig> => {
    const validatedModel = validateModelId(model);
    console.log(`[AI Debug] Validated model ID for world config: "${validatedModel}"`);
    
    const prompt = `
Generate a creative and interesting configuration for a simulated IRC world.
Create a list of 8 unique virtual users with distinct, concise, and interesting personalities. Nicknames should be lowercase and simple.

For each user, also generate:
- Language skills: fluency level (beginner/intermediate/advanced/native), languages they speak, and optional accent/dialect
- Writing style: formality (casual/formal/mixed), verbosity (concise/moderate/verbose), humor level (none/light/heavy), emoji usage (none/minimal/frequent), and punctuation style (minimal/standard/excessive)

Create a list of 4 unique and thematic IRC channels with creative topics. Channel names must start with #.

Provide the output in JSON format.
`;

    const response = await withRateLimitAndRetries(() =>
        ai.models.generateContent({
            model: validatedModel,
            contents: prompt,
            config: {
                systemInstruction: "You are a creative world-builder for a simulated IRC environment. Generate a valid JSON response based on the provided schema.",
                temperature: 1.0,
                maxOutputTokens: 1000,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        users: {
                            type: Type.ARRAY,
                            description: "A list of 8 virtual users.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    nickname: {
                                        type: Type.STRING,
                                        description: "The user's lowercase nickname."
                                    },
                                    personality: {
                                        type: Type.STRING,
                                        description: "A brief, interesting personality description."
                                    },
                                    languageSkills: {
                                        type: Type.OBJECT,
                                        properties: {
                                            fluency: {
                                                type: Type.STRING,
                                                enum: ['beginner', 'intermediate', 'advanced', 'native'],
                                                description: "Language fluency level."
                                            },
                                            languages: {
                                                type: Type.ARRAY,
                                                items: { type: Type.STRING },
                                                description: "List of languages the user speaks."
                                            },
                                            accent: {
                                                type: Type.STRING,
                                                description: "Optional accent or dialect description."
                                            }
                                        },
                                        required: ['fluency', 'languages']
                                    },
                                    writingStyle: {
                                        type: Type.OBJECT,
                                        properties: {
                                            formality: {
                                                type: Type.STRING,
                                                enum: ['casual', 'formal', 'mixed'],
                                                description: "Writing formality level."
                                            },
                                            verbosity: {
                                                type: Type.STRING,
                                                enum: ['concise', 'moderate', 'verbose'],
                                                description: "Writing verbosity level."
                                            },
                                            humor: {
                                                type: Type.STRING,
                                                enum: ['none', 'light', 'heavy'],
                                                description: "Humor level in writing."
                                            },
                                            emojiUsage: {
                                                type: Type.STRING,
                                                enum: ['none', 'minimal', 'frequent'],
                                                description: "Emoji usage frequency."
                                            },
                                            punctuation: {
                                                type: Type.STRING,
                                                enum: ['minimal', 'standard', 'excessive'],
                                                description: "Punctuation style."
                                            }
                                        },
                                        required: ['formality', 'verbosity', 'humor', 'emojiUsage', 'punctuation']
                                    }
                                },
                                required: ['nickname', 'personality', 'languageSkills', 'writingStyle']
                            }
                        },
                        channels: {
                            type: Type.ARRAY,
                            description: "A list of 4 IRC channels.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: {
                                        type: Type.STRING,
                                        description: "The channel name, starting with #."
                                    },
                                    topic: {
                                        type: Type.STRING,
                                        description: "A creative topic for the channel."
                                    }
                                },
                                required: ['name', 'topic']
                            }
                        }
                    },
                    required: ['users', 'channels']
                }
            }
        })
    );

    const jsonString = response.text.trim();
    const parsedConfig: RandomWorldConfig = JSON.parse(jsonString);

    if (!parsedConfig.users || !parsedConfig.channels || parsedConfig.users.length === 0 || parsedConfig.channels.length === 0) {
        throw new Error("Invalid config structure received from AI.");
    }

    return parsedConfig;
};

/**
 * Lists all available Gemini models from the API.
 * @returns Promise<GeminiModel[]> Array of available models
 */
export const listAvailableModels = async (): Promise<GeminiModel[]> => {
    console.log("🔍 Fetching available Gemini models...");
    
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + API_KEY);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        
        const data: ModelsListResponse = await response.json();
        console.log(`✅ Successfully fetched ${data.models.length} models`);
        
        // Filter for models that support generateContent
        const supportedModels = data.models.filter(model => 
            model.supportedGenerationMethods?.includes('generateContent')
        );
        
        console.log(`📝 Found ${supportedModels.length} models supporting generateContent`);
        
        return supportedModels;
    } catch (error) {
        console.error("❌ Error fetching available models:", error);
        throw new Error(`Failed to fetch available models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Gets detailed information about a specific model.
 * @param modelId The model ID (e.g., 'gemini-2.0-flash')
 * @returns Promise<GeminiModel> Model information
 */
export const getModelInfo = async (modelId: string): Promise<GeminiModel> => {
    console.log(`🔍 Fetching info for model: ${modelId}`);
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}?key=` + API_KEY);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch model info: ${response.status} ${response.statusText}`);
        }
        
        const model: GeminiModel = await response.json();
        console.log(`✅ Successfully fetched info for model: ${model.displayName}`);
        
        return model;
    } catch (error) {
        console.error(`❌ Error fetching model info for ${modelId}:`, error);
        throw new Error(`Failed to fetch model info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};