import { GoogleGenAI, Type } from "@google/genai";
import type { Channel, Message, PrivateMessageConversation, RandomWorldConfig, GeminiModel, ModelsListResponse, User } from '../types';
import { getLanguageFluency, getAllLanguages, getLanguageAccent, isChannelOperator } from '../types';
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
    .slice(-20) // Increased from 15 to 20 messages for better context
    .map(m => `${m.nickname}: ${m.content}`)
    .join('\n');
};

// Helper function to detect repetitive patterns in recent messages
const detectRepetitivePatterns = (messages: Message[]): string[] => {
  const recentMessages = messages.slice(-10); // Look at last 10 messages
  const phrases: { [key: string]: number } = {};
  
  // Common greeting phrases that should be excluded from repetition detection
  const greetingPhrases = [
    'welcome to', 'hello there', 'hi there', 'hey there', 'good to see', 'nice to meet',
    'welcome back', 'hello everyone', 'hi everyone', 'hey everyone', 'welcome new',
    'glad to see', 'great to see', 'welcome aboard', 'hello new', 'hi new', 'hey new'
  ];
  
  // Extract common phrases and count occurrences
  recentMessages.forEach(msg => {
    // Skip greeting-related messages and system messages
    if (msg.type === 'system' || msg.type === 'join' || msg.type === 'part' || msg.type === 'quit') {
      return;
    }
    
    // Skip messages that are likely greetings based on content
    const content = msg.content.toLowerCase();
    const isGreeting = greetingPhrases.some(phrase => content.includes(phrase)) ||
                      content.match(/^(hi|hello|hey|welcome|greetings)/);
    
    if (isGreeting) {
      return;
    }
    
    const words = content.split(/\s+/);
    // Check for 2-4 word phrases
    for (let i = 0; i < words.length - 1; i++) {
      for (let len = 2; len <= Math.min(4, words.length - i); len++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length > 3) { // Only count meaningful phrases
          phrases[phrase] = (phrases[phrase] || 0) + 1;
        }
      }
    }
  });
  
  // Return phrases that appear more than once
  return Object.entries(phrases)
    .filter(([_, count]) => count > 1)
    .map(([phrase, _]) => phrase);
};

// Helper function to get conversation topics from recent messages
const extractRecentTopics = (messages: Message[]): string[] => {
  const recentMessages = messages.slice(-8); // Last 8 messages
  const topics: string[] = [];
  
  // Simple keyword extraction for common topics
  const topicKeywords = [
    'work', 'job', 'school', 'study', 'weather', 'food', 'music', 'movie', 'game',
    'travel', 'vacation', 'weekend', 'party', 'friend', 'family', 'love', 'relationship',
    'health', 'exercise', 'sport', 'book', 'news', 'politics', 'technology', 'computer',
    'internet', 'phone', 'car', 'house', 'money', 'shopping', 'hobby', 'art', 'photo'
  ];
  
  recentMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    topicKeywords.forEach(keyword => {
      if (content.includes(keyword) && !topics.includes(keyword)) {
        topics.push(keyword);
      }
    });
  });
  
  return topics;
};

// Helper function to extract text from AI response
const extractTextFromResponse = (response: any): string => {
  if (!response) {
    throw new Error("No response received from AI service");
  }
  
  if (response.text) {
    // Old format
    return response.text.trim();
  } else if (response.candidates && response.candidates.length > 0 && 
             response.candidates[0].content && 
             response.candidates[0].content.parts && 
             response.candidates[0].content.parts.length > 0) {
    // New format - extract from candidates
    return response.candidates[0].content.parts[0].text?.trim() || '';
  } else {
    console.error("Invalid response structure:", response);
    throw new Error("Invalid response from AI service: unable to extract text content");
  }
};

// Time-of-day context generation
const getTimeOfDayContext = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Determine time of day
  let timePeriod = '';
  let energyLevel = '';
  let commonTopics = '';
  let socialContext = '';
  
  if (hour >= 6 && hour < 12) {
    timePeriod = 'morning';
    energyLevel = 'fresh and energetic';
    commonTopics = 'coffee, breakfast, plans for the day, weather, news';
    socialContext = 'people are starting their day, checking in, sharing morning routines';
  } else if (hour >= 12 && hour < 17) {
    timePeriod = 'afternoon';
    energyLevel = 'productive and focused';
    commonTopics = 'work, lunch, projects, afternoon activities, current events';
    socialContext = 'people are in work mode, taking breaks, discussing ongoing projects';
  } else if (hour >= 17 && hour < 21) {
    timePeriod = 'evening';
    energyLevel = 'relaxed and social';
    commonTopics = 'dinner plans, evening activities, relaxation, social events, hobbies';
    socialContext = 'people are winding down from work, planning evening activities, being more social';
  } else if (hour >= 21 && hour < 24) {
    timePeriod = 'late evening';
    energyLevel = 'calm and reflective';
    commonTopics = 'reflection on the day, late-night thoughts, quiet activities, tomorrow\'s plans';
    socialContext = 'people are winding down, being more introspective, preparing for sleep';
  } else {
    timePeriod = 'late night/early morning';
    energyLevel = 'tired but sometimes energetic';
    commonTopics = 'insomnia, late-night activities, deep thoughts, quiet conversations';
    socialContext = 'very few people online, those who are might be night owls or in different time zones';
  }
  
  // Weekend vs weekday context
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayContext = isWeekend ? 'weekend' : 'weekday';
  
  return `Current time context: It's ${timePeriod} (${hour}:${now.getMinutes().toString().padStart(2, '0')}) on a ${dayContext}. 
People are generally ${energyLevel}. Common topics include: ${commonTopics}. 
Social context: ${socialContext}.`;
};

const getBaseSystemInstruction = (currentUserNickname: string) => `You are an advanced AI simulating an Internet Relay Chat (IRC) environment. 
Your goal is to generate realistic, brief, and in-character chat messages for various virtual users.
Adhere strictly to the format 'nickname: message'. 
Do not add any extra text, explanations, or markdown formatting. 
Keep messages concise and natural for a chat room setting.
The human user's nickname is '${currentUserNickname}'.

IMPORTANT: Always respond in the user's primary language as specified in their language skills. 
If a user only speaks Finnish, respond in Finnish. If they only speak English, respond in English.
Match the language to the user's language configuration exactly.
`;

export const generateChannelActivity = async (channel: Channel, currentUserNickname: string, model: string = 'gemini-2.5-flash'): Promise<string> => {
  console.log(`[AI Debug] generateChannelActivity called for channel: ${channel.name}`);
  console.log(`[AI Debug] Model parameter: "${model}" (type: ${typeof model}, length: ${model.length})`);
  
  const validatedModel = validateModelId(model);
  console.log(`[AI Debug] Validated model ID: "${validatedModel}"`);
  
  const usersInChannel = channel.users.filter(u => u.nickname !== currentUserNickname);
  console.log(`[AI Debug] Channel ${channel.name} users:`, channel.users.map(u => u.nickname));
  console.log(`[AI Debug] Current user nickname: "${currentUserNickname}"`);
  console.log(`[AI Debug] Filtered users (excluding current user):`, usersInChannel.map(u => u.nickname));
  
  if (usersInChannel.length === 0) {
    console.log(`[AI Debug] No virtual users in channel ${channel.name} (excluding current user) - skipping AI generation`);
    return '';
  }
  
  // Additional safety check: ensure we don't generate messages for the current user
  if (usersInChannel.some(u => u.nickname === currentUserNickname)) {
    console.log(`[AI Debug] Current user found in filtered users - this should not happen! Skipping AI generation`);
    return '';
  }
  
  // Get language context for the channel first
  let dominantLanguage: string;
  if (channel.dominantLanguage) {
    // Use explicitly set dominant language
    dominantLanguage = channel.dominantLanguage;
    console.log(`[AI Debug] Channel ${channel.name} explicit dominant language: ${dominantLanguage}`);
  } else {
    // Calculate dominant language from users
    const channelLanguages = channel.users.map(u => getAllLanguages(u.languageSkills)[0]).filter(Boolean);
    dominantLanguage = channelLanguages.length > 0 ? 
      channelLanguages.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b) : 
      'English';
    console.log(`[AI Debug] Channel ${channel.name} calculated dominant language: ${dominantLanguage}`);
  }
  
  // Prioritize users whose primary language matches the channel's dominant language
  const usersMatchingLanguage = usersInChannel.filter(user => {
    const userLanguages = getAllLanguages(user.languageSkills);
    return userLanguages[0] === dominantLanguage;
  });
  
  // If we have users matching the dominant language, use them; otherwise use any user
  let candidateUsers = usersMatchingLanguage.length > 0 ? usersMatchingLanguage : usersInChannel;
  
  // Add user rotation to prevent the same users from always being selected
  // Shuffle the array to add more variety
  const shuffledUsers = [...candidateUsers].sort(() => Math.random() - 0.5);
  
  // Sometimes prefer users who haven't spoken recently (last 5 messages)
  const recentSpeakers = channel.messages.slice(-5).map(msg => msg.nickname);
  const lessActiveUsers = shuffledUsers.filter(user => !recentSpeakers.includes(user.nickname));
  
  // Time-based user activity patterns
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Adjust user selection based on time of day
  let timeBasedUsers = shuffledUsers;
  
  if (hour >= 6 && hour < 12) {
    // Morning: Prefer users with energetic personalities
    timeBasedUsers = shuffledUsers.filter(user => 
      user.personality.toLowerCase().includes('energetic') ||
      user.personality.toLowerCase().includes('optimistic') ||
      user.personality.toLowerCase().includes('morning') ||
      user.writingStyle.verbosity === 'verbose' ||
      user.writingStyle.verbosity === 'very_verbose'
    );
  } else if (hour >= 21 || hour < 6) {
    // Late night/early morning: Prefer users with introspective personalities
    timeBasedUsers = shuffledUsers.filter(user => 
      user.personality.toLowerCase().includes('quiet') ||
      user.personality.toLowerCase().includes('introspective') ||
      user.personality.toLowerCase().includes('night') ||
      user.writingStyle.verbosity === 'terse' ||
      user.writingStyle.verbosity === 'very_terse'
    );
  }
  
  // If no time-based users found, use original shuffled users
  if (timeBasedUsers.length === 0) {
    timeBasedUsers = shuffledUsers;
  }
  
  // 30% chance to prefer less active users, 70% chance to use time-based selection
  if (lessActiveUsers.length > 0 && Math.random() < 0.3) {
    candidateUsers = lessActiveUsers;
  } else {
    candidateUsers = timeBasedUsers;
  }
  
  const randomUser = candidateUsers[Math.floor(Math.random() * candidateUsers.length)];
  
  console.log(`[AI Debug] Selected user: ${randomUser.nickname} for channel activity (language: ${getAllLanguages(randomUser.languageSkills)[0]})`);

  const userLanguages = getAllLanguages(randomUser.languageSkills);
  const primaryLanguage = userLanguages[0] || 'English';

  // Calculate appropriate token limit based on verbosity
  const getTokenLimit = (verbosity: string): number => {
    switch (verbosity) {
      case 'very_terse': return 100;  // Increased from 50 to ensure complete messages
      case 'terse': return 150;       // Increased from 75
      case 'neutral': return 200;     // Increased from 100
      case 'verbose': return 400;     // Increased from 300
      case 'very_verbose': return 600; // Increased from 500
      default: return 200;            // Increased from 100
    }
  };

  const tokenLimit = getTokenLimit(randomUser.writingStyle.verbosity);
  console.log(`[AI Debug] Token limit for ${randomUser.nickname} (${randomUser.writingStyle.verbosity}): ${tokenLimit}`);

  // Enhanced conversation diversity and repetition prevention
  const conversationVariety = Math.random();
  const repetitivePhrases = detectRepetitivePatterns(channel.messages);
  const recentTopics = extractRecentTopics(channel.messages);
  
  let diversityPrompt = '';
  let repetitionAvoidance = '';
  
  // Always include repetition avoidance if patterns detected
  if (repetitivePhrases.length > 0) {
    repetitionAvoidance = `CRITICAL: Avoid repeating these recent phrases: "${repetitivePhrases.join('", "')}". Be creative and use different wording.`;
  }
  
  // Enhanced diversity prompts with higher probability
  if (conversationVariety < 0.15) {
    // 15% chance: Introduce a completely new topic
    const newTopics = ['technology', 'travel', 'food', 'music', 'movies', 'books', 'sports', 'hobbies', 'current events', 'memories'];
    const randomTopic = newTopics[Math.floor(Math.random() * newTopics.length)];
    diversityPrompt = `IMPORTANT: Introduce a completely new topic about ${randomTopic}. Be creative and unexpected.`;
  } else if (conversationVariety < 0.3) {
    // 15% chance: Ask a question to engage others
    diversityPrompt = 'IMPORTANT: Ask an engaging question to other users in the channel to spark discussion.';
  } else if (conversationVariety < 0.45) {
    // 15% chance: Share a personal experience or story
    diversityPrompt = 'IMPORTANT: Share a brief personal experience or story related to the topic.';
  } else if (conversationVariety < 0.6) {
    // 15% chance: Make an observation about the current conversation
    diversityPrompt = 'IMPORTANT: Make an observation about the current conversation or comment on what others have been discussing.';
  } else if (conversationVariety < 0.75) {
    // 15% chance: Change the mood or tone
    diversityPrompt = 'IMPORTANT: Change the mood or tone of the conversation - be more lighthearted, serious, or different from recent messages.';
  } else if (conversationVariety < 0.9) {
    // 15% chance: Introduce humor or wit
    diversityPrompt = 'IMPORTANT: Add some humor, wit, or clever wordplay to the conversation.';
  } else {
    // 10% chance: Be more conversational and natural
    diversityPrompt = 'IMPORTANT: Be more conversational and natural - like you\'re talking to friends in a relaxed setting.';
  }
  
  // Add topic evolution if conversation is getting stale
  let topicEvolution = '';
  if (recentTopics.length > 3) {
    topicEvolution = 'IMPORTANT: The conversation has been focused on similar topics recently. Try to bring up something fresh or unexpected.';
  }

  // Get time-of-day context
  const timeContext = getTimeOfDayContext();
  console.log(`[AI Debug] Time context: ${timeContext}`);

  const prompt = `
${timeContext}

The topic of channel ${channel.name} is: "${channel.topic}".
The users in the channel are: ${channel.users.map(u => u.nickname).join(', ')}.
Their personalities are: ${channel.users.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
Channel operators (who can kick/ban users): ${channel.operators.join(', ') || 'None'}.
The last 20 messages were:
${formatMessageHistory(channel.messages)}

${repetitionAvoidance}

${diversityPrompt}

${topicEvolution}

Generate a new, single, in-character message from ${randomUser.nickname} that is relevant to the topic or the recent conversation.
The message should feel natural for the current time of day and social context.
The message must be a single line in the format: "nickname: message"

${randomUser.writingStyle.verbosity === 'very_verbose' ? 'IMPORTANT: This user is very verbose - write a long, detailed message with multiple sentences and thorough explanations. Do not cut off the message.' : randomUser.writingStyle.verbosity === 'verbose' ? 'IMPORTANT: This user is verbose - write a moderately detailed message with several sentences.' : ''}

CRITICAL: Respond ONLY in ${primaryLanguage}. Do not use any other language.
${userLanguages.length > 1 ? `Available languages: ${userLanguages.join(', ')}. Use ${primaryLanguage} only.` : ''}
${dominantLanguage !== primaryLanguage ? `Note: The channel's dominant language is ${dominantLanguage}, but ${randomUser.nickname} should respond in ${primaryLanguage}.` : ''}

Consider ${randomUser.nickname}'s writing style:
- Formality: ${randomUser.writingStyle.formality}
- Verbosity: ${randomUser.writingStyle.verbosity} ${randomUser.writingStyle.verbosity === 'very_verbose' ? '(write very long, detailed messages with multiple sentences and thorough explanations)' : randomUser.writingStyle.verbosity === 'verbose' ? '(write moderately detailed messages with several sentences)' : randomUser.writingStyle.verbosity === 'terse' ? '(write brief, concise messages)' : randomUser.writingStyle.verbosity === 'very_terse' ? '(write very brief messages - short phrases or single sentences, but make them complete and meaningful)' : ''}
- Humor: ${randomUser.writingStyle.humor}
- Emoji usage: ${randomUser.writingStyle.emojiUsage}
- Punctuation: ${randomUser.writingStyle.punctuation}
- Language fluency: ${getLanguageFluency(randomUser.languageSkills)}
- Languages: ${userLanguages.join(', ')}
${getLanguageAccent(randomUser.languageSkills) ? `- Accent: ${getLanguageAccent(randomUser.languageSkills)}` : ''}
${isChannelOperator(channel, randomUser.nickname) ? `- Role: Channel operator (can kick/ban users)` : ''}
`;

  try {
    console.log(`[AI Debug] Sending request to Gemini for channel activity in ${channel.name}`);
    console.log(`[AI Debug] Using model ID: "${validatedModel}" for API call`);
    // Add temperature variation for more diverse responses
    const baseTemperature = 0.9;
    const temperatureVariation = Math.random() * 0.3; // Add 0-0.3 variation
    const finalTemperature = Math.min(1.0, baseTemperature + temperatureVariation);
    
    console.log(`[AI Debug] Using temperature: ${finalTemperature.toFixed(2)} for ${randomUser.nickname}`);
    
    const response = await withRateLimitAndRetries(() => 
      ai.models.generateContent({
          model: validatedModel,
          contents: prompt,
          config: {
              systemInstruction: getBaseSystemInstruction(currentUserNickname),
              temperature: finalTemperature,
              maxOutputTokens: tokenLimit,
              thinkingConfig: { thinkingBudget: 0 },
          },
      })
    );
    
    const result = extractTextFromResponse(response);
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
    console.log(`[AI Debug] Reaction - Channel ${channel.name} users:`, channel.users.map(u => u.nickname));
    console.log(`[AI Debug] Reaction - Current user nickname: "${currentUserNickname}"`);
    console.log(`[AI Debug] Reaction - Filtered users (excluding current user):`, usersInChannel.map(u => u.nickname));
    
    if (usersInChannel.length === 0) {
        console.log(`[AI Debug] No virtual users in channel ${channel.name} to react (excluding current user) - skipping reaction generation`);
        return '';
    }
    
    // Additional safety check: ensure we don't generate reactions for the current user
    if (usersInChannel.some(u => u.nickname === currentUserNickname)) {
        console.log(`[AI Debug] Current user found in filtered users for reaction - this should not happen! Skipping reaction generation`);
        return '';
    }

    // Get language context for the channel first
    let dominantLanguage: string;
    if (channel.dominantLanguage) {
      // Use explicitly set dominant language
      dominantLanguage = channel.dominantLanguage;
      console.log(`[AI Debug] Channel ${channel.name} explicit dominant language: ${dominantLanguage}`);
    } else {
      // Calculate dominant language from users
      const channelLanguages = channel.users.map(u => getAllLanguages(u.languageSkills)[0]).filter(Boolean);
      dominantLanguage = channelLanguages.length > 0 ? 
        channelLanguages.reduce((a, b, i, arr) => arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b) : 
        'English';
      console.log(`[AI Debug] Channel ${channel.name} calculated dominant language: ${dominantLanguage}`);
    }
    
    // Prioritize users whose primary language matches the channel's dominant language
    const usersMatchingLanguage = usersInChannel.filter(user => {
      const userLanguages = getAllLanguages(user.languageSkills);
      return userLanguages[0] === dominantLanguage;
    });
    
    // If we have users matching the dominant language, use them; otherwise use any user
    let candidateUsers = usersMatchingLanguage.length > 0 ? usersMatchingLanguage : usersInChannel;
    
    // Add user rotation for reactions too
    const shuffledUsers = [...candidateUsers].sort(() => Math.random() - 0.5);
    
    // Sometimes prefer users who haven't reacted recently
    const recentSpeakers = channel.messages.slice(-3).map(msg => msg.nickname);
    const lessActiveUsers = shuffledUsers.filter(user => !recentSpeakers.includes(user.nickname));
    
    // 40% chance to prefer less active users for reactions
    if (lessActiveUsers.length > 0 && Math.random() < 0.4) {
      candidateUsers = lessActiveUsers;
    } else {
      candidateUsers = shuffledUsers;
    }
    
    const randomUser = candidateUsers[Math.floor(Math.random() * candidateUsers.length)];
    
    console.log(`[AI Debug] Selected user: ${randomUser.nickname} to react to ${userMessage.nickname}'s message (language: ${getAllLanguages(randomUser.languageSkills)[0]})`);
    
    // Handle different message types
    let messageDescription = '';
    if (userMessage.type === 'action') {
      messageDescription = `performed an action: *${userMessage.nickname} ${userMessage.content}*`;
    } else {
      messageDescription = `said: "${userMessage.content}"`;
    }
    
    const userLanguages = getAllLanguages(randomUser.languageSkills);
    const primaryLanguage = userLanguages[0] || 'English';
    
    // Calculate appropriate token limit based on verbosity
    const getTokenLimit = (verbosity: string): number => {
      switch (verbosity) {
      case 'very_terse': return 100;  // Increased from 50 to ensure complete messages
      case 'terse': return 150;       // Increased from 75
      case 'neutral': return 200;     // Increased from 100
      case 'verbose': return 400;     // Increased from 300
      case 'very_verbose': return 600; // Increased from 500
      default: return 200;            // Increased from 100
      }
    };

    const tokenLimit = getTokenLimit(randomUser.writingStyle.verbosity);
    console.log(`[AI Debug] Token limit for reaction from ${randomUser.nickname} (${randomUser.writingStyle.verbosity}): ${tokenLimit}`);
    
    // Get time-of-day context for reactions too
    const timeContext = getTimeOfDayContext();
    console.log(`[AI Debug] Time context for reaction: ${timeContext}`);

    // Enhanced reaction diversity and repetition prevention
    const repetitivePhrases = detectRepetitivePatterns(channel.messages);
    let reactionRepetitionAvoidance = '';
    
    if (repetitivePhrases.length > 0) {
      reactionRepetitionAvoidance = `CRITICAL: Avoid repeating these recent phrases: "${repetitivePhrases.join('", "')}". Be creative and use different wording.`;
    }

    const prompt = `
${timeContext}

In IRC channel ${channel.name}, the user "${userMessage.nickname}" just ${messageDescription}.
The topic is: "${channel.topic}".
The other users in the channel are: ${usersInChannel.map(u => u.nickname).join(', ')}.
Their personalities are: ${usersInChannel.map(u => `${u.nickname} is ${u.personality}`).join('. ')}.
Channel operators (who can kick/ban users): ${channel.operators.join(', ') || 'None'}.
The last 20 messages were:
${formatMessageHistory(channel.messages)}

${reactionRepetitionAvoidance}

Generate a realistic and in-character reaction from ${randomUser.nickname}.
The reaction should feel natural for the current time of day and social context.
The reaction must be a single line in the format: "nickname: message"
${randomUser.writingStyle.verbosity === 'very_verbose' ? 'IMPORTANT: This user is very verbose - write a long, detailed reaction with multiple sentences and thorough explanations. Do not cut off the message.' : randomUser.writingStyle.verbosity === 'verbose' ? 'IMPORTANT: This user is verbose - write a moderately detailed reaction with several sentences.' : ''}

CRITICAL: Respond ONLY in ${primaryLanguage}. Do not use any other language.
${userLanguages.length > 1 ? `Available languages: ${userLanguages.join(', ')}. Use ${primaryLanguage} only.` : ''}

Consider ${randomUser.nickname}'s writing style:
- Formality: ${randomUser.writingStyle.formality}
- Verbosity: ${randomUser.writingStyle.verbosity} ${randomUser.writingStyle.verbosity === 'very_verbose' ? '(write very long, detailed messages with multiple sentences and thorough explanations)' : randomUser.writingStyle.verbosity === 'verbose' ? '(write moderately detailed messages with several sentences)' : randomUser.writingStyle.verbosity === 'terse' ? '(write brief, concise messages)' : randomUser.writingStyle.verbosity === 'very_terse' ? '(write very brief messages - short phrases or single sentences, but make them complete and meaningful)' : ''}
- Humor: ${randomUser.writingStyle.humor}
- Emoji usage: ${randomUser.writingStyle.emojiUsage}
- Punctuation: ${randomUser.writingStyle.punctuation}
- Language fluency: ${getLanguageFluency(randomUser.languageSkills)}
- Languages: ${userLanguages.join(', ')}
${getLanguageAccent(randomUser.languageSkills) ? `- Accent: ${getLanguageAccent(randomUser.languageSkills)}` : ''}
${isChannelOperator(channel, randomUser.nickname) ? `- Role: Channel operator (can kick/ban users)` : ''}
`;
    
    try {
        console.log(`[AI Debug] Sending request to Gemini for reaction in ${channel.name}`);
        
        // Add temperature variation for reactions too
        const baseTemperature = 0.8;
        const temperatureVariation = Math.random() * 0.3;
        const finalTemperature = Math.min(1.0, baseTemperature + temperatureVariation);
        
        console.log(`[AI Debug] Using temperature: ${finalTemperature.toFixed(2)} for reaction from ${randomUser.nickname}`);
        
        const response = await withRateLimitAndRetries(() => 
            ai.models.generateContent({
                model: validatedModel,
                contents: prompt,
                config: {
                    systemInstruction: getBaseSystemInstruction(currentUserNickname),
                    temperature: finalTemperature,
                    maxOutputTokens: tokenLimit,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            })
        );
        
        const result = extractTextFromResponse(response);
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
    const userLanguages = getAllLanguages(aiUser.languageSkills);
    const primaryLanguage = userLanguages[0] || 'English';
    
    // Calculate appropriate token limit based on verbosity
    const getTokenLimit = (verbosity: string): number => {
      switch (verbosity) {
      case 'very_terse': return 100;  // Increased from 50 to ensure complete messages
      case 'terse': return 150;       // Increased from 75
      case 'neutral': return 200;     // Increased from 100
      case 'verbose': return 400;     // Increased from 300
      case 'very_verbose': return 600; // Increased from 500
      default: return 200;            // Increased from 100
      }
    };

    const tokenLimit = getTokenLimit(aiUser.writingStyle.verbosity);
    console.log(`[AI Debug] Token limit for private message from ${aiUser.nickname} (${aiUser.writingStyle.verbosity}): ${tokenLimit}`);
    
    // Get time-of-day context for private messages too
    const timeContext = getTimeOfDayContext();
    console.log(`[AI Debug] Time context for private message: ${timeContext}`);

    const prompt = `
${timeContext}

You are roleplaying as an IRC user named '${aiUser.nickname}'. 
Your personality is: ${aiUser.personality}.
You are in a private message conversation with '${currentUserNickname}'.
The conversation history (last 15 messages) is:
${formatMessageHistory(conversation.messages)}

'${currentUserNickname}' just sent you this message: "${userMessage.content}"

CRITICAL: Respond ONLY in ${primaryLanguage}. Do not use any other language.
${userLanguages.length > 1 ? `Available languages: ${userLanguages.join(', ')}. Use ${primaryLanguage} only.` : ''}

Your writing style:
- Formality: ${aiUser.writingStyle.formality}
- Verbosity: ${aiUser.writingStyle.verbosity} ${aiUser.writingStyle.verbosity === 'very_verbose' ? '(write very long, detailed messages with multiple sentences and thorough explanations)' : aiUser.writingStyle.verbosity === 'verbose' ? '(write moderately detailed messages with several sentences)' : aiUser.writingStyle.verbosity === 'terse' ? '(write brief, concise messages)' : aiUser.writingStyle.verbosity === 'very_terse' ? '(write very brief messages - short phrases or single sentences, but make them complete and meaningful)' : ''}
- Humor: ${aiUser.writingStyle.humor}
- Emoji usage: ${aiUser.writingStyle.emojiUsage}
- Punctuation: ${aiUser.writingStyle.punctuation}
- Language fluency: ${getLanguageFluency(aiUser.languageSkills)}
- Languages: ${userLanguages.join(', ')}
${getLanguageAccent(aiUser.languageSkills) ? `- Accent: ${getLanguageAccent(aiUser.languageSkills)}` : ''}

Generate a natural, in-character response that feels appropriate for the current time of day.
The response must be a single line in the format: "${aiUser.nickname}: message"
${aiUser.writingStyle.verbosity === 'very_verbose' ? 'IMPORTANT: This user is very verbose - write a long, detailed response with multiple sentences and thorough explanations. Do not cut off the message.' : aiUser.writingStyle.verbosity === 'verbose' ? 'IMPORTANT: This user is verbose - write a moderately detailed response with several sentences.' : ''}
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
                    maxOutputTokens: tokenLimit,
                    thinkingConfig: { thinkingBudget: 0 },
                },
            })
        );
        
        const result = extractTextFromResponse(response);
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

IMPORTANT: Create a diverse mix of languages including English, Finnish, Spanish, French, German, Japanese, etc.
Include users who speak only one language (e.g., only Finnish) and users who speak multiple languages.
Make the language distribution realistic and varied.

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
          systemInstruction: "You are a creative character generator for an IRC simulation. Generate diverse, interesting users with unique personalities and communication styles. Create a realistic mix of languages including English, Finnish, Spanish, French, German, Japanese, and others. Include both monolingual and multilingual users. Provide a valid JSON response.",
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
                        languages: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              language: {
                                type: Type.STRING,
                                description: "The language name (e.g., 'English', 'Finnish', 'Spanish')."
                              },
                              fluency: {
                                type: Type.STRING,
                                enum: ['beginner', 'intermediate', 'advanced', 'native'],
                                description: "Fluency level in this specific language."
                        },
                        accent: {
                          type: Type.STRING,
                                description: "Optional accent or dialect for this language."
                              }
                            },
                            required: ['language', 'fluency']
                          },
                          description: "List of languages with individual fluency levels."
                        }
                      },
                      required: ['languages']
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
    
    const jsonString = extractTextFromResponse(response);
    const result = JSON.parse(jsonString);
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
                maxOutputTokens: 4000,
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

    const jsonString = extractTextFromResponse(response);
    
    // Log the raw response for debugging
    console.log(`[AI Debug] Raw response from AI:`, jsonString);
    console.log(`[AI Debug] Response length:`, jsonString.length);
    console.log(`[AI Debug] First 200 characters:`, jsonString.substring(0, 200));
    
    // Try to find JSON content if the response contains extra text
    let jsonContent = jsonString;
    
    // Look for JSON object boundaries
    const jsonStart = jsonString.indexOf('{');
    const jsonEnd = jsonString.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonContent = jsonString.substring(jsonStart, jsonEnd + 1);
        console.log(`[AI Debug] Extracted JSON content:`, jsonContent);
    } else {
        console.warn(`[AI Debug] No JSON object boundaries found in response`);
    }
    
    let parsedConfig: RandomWorldConfig;
    try {
        parsedConfig = JSON.parse(jsonContent);
    } catch (parseError) {
        console.error(`[AI Debug] JSON parse error:`, parseError);
        console.error(`[AI Debug] Attempted to parse:`, jsonContent);
        
        // Try to repair truncated JSON
        console.log(`[AI Debug] Attempting to repair truncated JSON...`);
        let repairedJson = jsonContent;
        
        // If the JSON is truncated, try to close it properly
        if (jsonContent.includes('"channels"') && !jsonContent.endsWith('}')) {
            // Find the last complete channel entry
            const lastChannelMatch = jsonContent.match(/"channels":\s*\[(.*?)(?:\]|$)/s);
            if (lastChannelMatch) {
                const channelsContent = lastChannelMatch[1];
                const channelEntries = channelsContent.match(/\{[^}]*\}/g);
                if (channelEntries && channelEntries.length > 0) {
                    // Close the channels array and the main object
                    repairedJson = jsonContent.replace(/"channels":\s*\[.*$/, `"channels": [${channelEntries.join(', ')}]}`);
                    console.log(`[AI Debug] Repaired JSON:`, repairedJson);
                }
            }
        }
        
        // Try parsing the repaired JSON
        try {
            parsedConfig = JSON.parse(repairedJson);
            console.log(`[AI Debug] Successfully parsed repaired JSON`);
        } catch (repairError) {
            console.error(`[AI Debug] JSON repair failed:`, repairError);
            
            // Try to provide a fallback configuration if JSON parsing fails
            console.log(`[AI Debug] Attempting to create fallback configuration...`);
            const fallbackConfig: RandomWorldConfig = {
            users: [
                {
                    nickname: 'nova',
                    personality: 'A curious tech-savvy individual who loves gadgets.',
                    languageSkills: {
                        languages: [{
                            language: 'English',
                            fluency: 'native',
                            accent: ''
                        }]
                    },
                    writingStyle: {
                        formality: 'casual',
                        verbosity: 'moderate',
                        humor: 'light',
                        emojiUsage: 'minimal',
                        punctuation: 'standard'
                    }
                },
                {
                    nickname: 'seraph',
                    personality: 'Calm, wise, and often speaks in poetic terms.',
                    languageSkills: {
                        languages: [{
                            language: 'English',
                            fluency: 'native',
                            accent: ''
                        }]
                    },
                    writingStyle: {
                        formality: 'formal',
                        verbosity: 'moderate',
                        humor: 'none',
                        emojiUsage: 'none',
                        punctuation: 'standard'
                    }
                },
                {
                    nickname: 'jinx',
                    personality: 'A chaotic, funny, and unpredictable prankster.',
                    languageSkills: {
                        languages: [{
                            language: 'English',
                            fluency: 'native',
                            accent: ''
                        }]
                    },
                    writingStyle: {
                        formality: 'casual',
                        verbosity: 'moderate',
                        humor: 'heavy',
                        emojiUsage: 'frequent',
                        punctuation: 'excessive'
                    }
                },
                {
                    nickname: 'rex',
                    personality: 'Gruff but helpful, an expert in system administration.',
                    languageSkills: {
                        languages: [{
                            language: 'English',
                            fluency: 'native',
                            accent: ''
                        }]
                    },
                    writingStyle: {
                        formality: 'casual',
                        verbosity: 'concise',
                        humor: 'light',
                        emojiUsage: 'none',
                        punctuation: 'minimal'
                    }
                },
                {
                    nickname: 'luna',
                    personality: 'An artist who is dreamy, creative, and talks about music.',
                    languageSkills: {
                        languages: [{
                            language: 'English',
                            fluency: 'native',
                            accent: ''
                        }]
                    },
                    writingStyle: {
                        formality: 'casual',
                        verbosity: 'verbose',
                        humor: 'light',
                        emojiUsage: 'frequent',
                        punctuation: 'standard'
                    }
                }
            ],
            channels: [
                { 
                    name: '#general', 
                    topic: 'General chit-chat about anything and everything.',
                    users: [
                        { 
                            nickname: 'nova',
                            status: 'online' as const,
                            personality: 'A curious tech-savvy individual who loves gadgets.',
                            languageSkills: {
                                fluency: 'native' as const,
                                languages: ['English'],
                                accent: ''
                            },
                            writingStyle: {
                                formality: 'casual' as const,
                                verbosity: 'moderate' as const,
                                humor: 'light' as const,
                                emojiUsage: 'minimal' as const,
                                punctuation: 'standard' as const
                            }
                        },
                        { 
                            nickname: 'seraph',
                            status: 'online' as const,
                            personality: 'Calm, wise, and often speaks in poetic terms.',
                            languageSkills: {
                                fluency: 'native' as const,
                                languages: ['English'],
                                accent: ''
                            },
                            writingStyle: {
                                formality: 'formal' as const,
                                verbosity: 'moderate' as const,
                                humor: 'none' as const,
                                emojiUsage: 'none' as const,
                                punctuation: 'standard' as const
                            }
                        },
                        { 
                            nickname: 'jinx',
                            status: 'online' as const,
                            personality: 'A chaotic, funny, and unpredictable prankster.',
                            languageSkills: {
                                fluency: 'native' as const,
                                languages: ['English'],
                                accent: ''
                            },
                            writingStyle: {
                                formality: 'casual' as const,
                                verbosity: 'moderate' as const,
                                humor: 'heavy' as const,
                                emojiUsage: 'frequent' as const,
                                punctuation: 'excessive' as const
                            }
                        },
                        { 
                            nickname: 'rex',
                            status: 'online' as const,
                            personality: 'Gruff but helpful, an expert in system administration.',
                            languageSkills: {
                                fluency: 'native' as const,
                                languages: ['English'],
                                accent: ''
                            },
                            writingStyle: {
                                formality: 'casual' as const,
                                verbosity: 'concise' as const,
                                humor: 'light' as const,
                                emojiUsage: 'none' as const,
                                punctuation: 'minimal' as const
                            }
                        },
                        { 
                            nickname: 'luna',
                            status: 'online' as const,
                            personality: 'An artist who is dreamy, creative, and talks about music.',
                            languageSkills: {
                                fluency: 'native' as const,
                                languages: ['English'],
                                accent: ''
                            },
                            writingStyle: {
                                formality: 'casual' as const,
                                verbosity: 'verbose' as const,
                                humor: 'light' as const,
                                emojiUsage: 'frequent' as const,
                                punctuation: 'standard' as const
                            }
                        }
                    ],
                    messages: [
                        { id: Date.now(), nickname: 'system', content: 'You have joined #general', timestamp: new Date(), type: 'system' as const }
                    ],
                    operators: []
                },
                { 
                    name: '#tech-talk', 
                    topic: 'Discussing the latest in technology and software.',
                    users: [],
                    messages: [
                        { id: Date.now() + 1, nickname: 'system', content: 'You have joined #tech-talk', timestamp: new Date(), type: 'system' as const }
                    ],
                    operators: []
                },
                { 
                    name: '#random', 
                    topic: 'For off-topic conversations and random thoughts.',
                    users: [],
                    messages: [
                        { id: Date.now() + 2, nickname: 'system', content: 'You have joined #random', timestamp: new Date(), type: 'system' as const }
                    ],
                    operators: []
                },
                { 
                    name: '#help', 
                    topic: 'Ask for help with the simulator here.',
                    users: [],
                    messages: [
                        { id: Date.now() + 3, nickname: 'system', content: 'You have joined #help', timestamp: new Date(), type: 'system' as const }
                    ],
                    operators: []
                }
            ]
        };
        
            console.log(`[AI Debug] Using fallback configuration due to JSON parse error`);
            return fallbackConfig;
        }
    }

    if (!parsedConfig.users || !parsedConfig.channels || parsedConfig.users.length === 0 || parsedConfig.channels.length === 0) {
        throw new Error("Invalid config structure received from AI.");
    }

    // Properly initialize channels with required properties
    const initializedChannels = parsedConfig.channels.map((channel, index) => ({
        name: channel.name,
        topic: channel.topic,
        users: parsedConfig.users.map(user => ({
            ...user,
            status: 'online' as const
        })),
        messages: [
            { 
                id: Date.now() + index, 
                nickname: 'system', 
                content: `You have joined ${channel.name}`, 
                timestamp: new Date(), 
                type: 'system' as const 
            }
        ],
        operators: []
    }));

    return {
        users: parsedConfig.users.map(user => ({
            ...user,
            status: 'online' as const
        })),
        channels: initializedChannels
    };
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