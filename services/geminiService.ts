import { GoogleGenAI, Type } from "@google/genai";
import type { Channel, Message, PrivateMessageConversation, RandomWorldConfig } from '../types';
import { withRateLimitAndRetries } from '../utils/config';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

export const generateChannelActivity = async (channel: Channel, currentUserNickname: string): Promise<string> => {
  const usersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
  if (usersInChannel.length === 0) return '';
  
  const randomUser = usersInChannel[Math.floor(Math.random() * usersInChannel.length)];

  const prompt = `
The topic of channel ${channel.name} is: "${channel.topic}".
The users in the channel are: ${channel.users.map(u => u.nickname).join(', ')}.
Their personalities are: ${channel.users.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
The last 15 messages were:
${formatMessageHistory(channel.messages)}

Generate a new, single, in-character message from ${randomUser.nickname} that is relevant to the topic or the recent conversation.
The message must be a single line in the format: "nickname: message"
`;

  const response = await withRateLimitAndRetries(() => 
    ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: getBaseSystemInstruction(currentUserNickname),
            temperature: 0.9,
            maxOutputTokens: 100,
            thinkingConfig: { thinkingBudget: 0 },
        },
    })
  );
  return response.text.trim();
};

export const generateReactionToMessage = async (channel: Channel, userMessage: Message, currentUserNickname: string): Promise<string> => {
    const usersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
    if (usersInChannel.length === 0) return '';

    const prompt = `
In IRC channel ${channel.name}, the user "${userMessage.nickname}" just said: "${userMessage.content}".
The topic is: "${channel.topic}".
The other users in the channel are: ${usersInChannel.map(u => u.nickname).join(', ')}.
Their personalities are: ${usersInChannel.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
The last 15 messages were:
${formatMessageHistory(channel.messages)}

Generate a realistic and in-character reaction from one of the other users.
The reaction must be a single line in the format: "nickname: message"
`;
    const response = await withRateLimitAndRetries(() => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getBaseSystemInstruction(currentUserNickname),
                temperature: 0.8,
                maxOutputTokens: 150,
                thinkingConfig: { thinkingBudget: 0 },
            },
        })
    );
    return response.text.trim();
};

export const generatePrivateMessageResponse = async (conversation: PrivateMessageConversation, userMessage: Message, currentUserNickname: string): Promise<string> => {
    const aiUser = conversation.user;
    const prompt = `
You are roleplaying as an IRC user named '${aiUser.nickname}'. 
Your personality is: ${aiUser.personality}.
You are in a private message conversation with '${currentUserNickname}'.
The conversation history (last 15 messages) is:
${formatMessageHistory(conversation.messages)}

'${currentUserNickname}' just sent you this message: "${userMessage.content}"

Generate a natural, in-character response.
The response must be a single line in the format: "${aiUser.nickname}: message"
`;

    const response = await withRateLimitAndRetries(() => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: getBaseSystemInstruction(currentUserNickname),
                temperature: 0.75,
                maxOutputTokens: 200,
                thinkingConfig: { thinkingBudget: 0 },
            },
        })
    );
    return response.text.trim();
};


export const generateRandomWorldConfiguration = async (): Promise<RandomWorldConfig> => {
    const prompt = `
Generate a creative and interesting configuration for a simulated IRC world.
Create a list of 8 unique virtual users with distinct, concise, and interesting personalities. Nicknames should be lowercase and simple.
Create a list of 4 unique and thematic IRC channels with creative topics. Channel names must start with #.

Provide the output in JSON format.
`;

    const response = await withRateLimitAndRetries(() =>
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
                                    }
                                },
                                required: ['nickname', 'personality']
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