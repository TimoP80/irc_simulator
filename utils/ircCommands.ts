import type { Message, MessageType } from '../types';

export interface ParsedCommand {
  command: string;
  args: string[];
  content: string;
  type: MessageType;
  target?: string;
}

/**
 * Parses an IRC command from user input
 * @param input The user input string
 * @returns ParsedCommand object or null if not a command
 */
export const parseIRCCommand = (input: string): ParsedCommand | null => {
  if (!input.startsWith('/')) {
    return null;
  }

  const trimmed = input.slice(1).trim();
  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case 'me':
      return {
        command: 'me',
        args,
        content: args.join(' '),
        type: 'action'
      };

    case 'notice':
      if (args.length < 2) return null;
      return {
        command: 'notice',
        args,
        content: args.slice(1).join(' '),
        type: 'notice',
        target: args[0]
      };

    case 'topic':
      return {
        command: 'topic',
        args,
        content: args.join(' '),
        type: 'topic'
      };

    case 'kick':
      if (args.length < 1) return null;
      return {
        command: 'kick',
        args,
        content: args.slice(1).join(' ') || 'No reason given',
        type: 'kick',
        target: args[0]
      };

    case 'ban':
      if (args.length < 1) return null;
      return {
        command: 'ban',
        args,
        content: args.slice(1).join(' ') || 'No reason given',
        type: 'ban',
        target: args[0]
      };

    case 'unban':
      if (args.length < 1) return null;
      return {
        command: 'unban',
        args,
        content: '',
        type: 'system',
        target: args[0]
      };

    case 'join':
      if (args.length < 1) return null;
      return {
        command: 'join',
        args,
        content: args[0],
        type: 'join'
      };

    case 'part':
      return {
        command: 'part',
        args,
        content: args.join(' ') || 'Leaving',
        type: 'part'
      };

    case 'quit':
      return {
        command: 'quit',
        args,
        content: args.join(' ') || 'Quitting',
        type: 'quit'
      };

    case 'nick':
      if (args.length < 1) return null;
      return {
        command: 'nick',
        args,
        content: args[0],
        type: 'system'
      };

    case 'who':
      return {
        command: 'who',
        args,
        content: '',
        type: 'system'
      };

    case 'help':
      return {
        command: 'help',
        args,
        content: '',
        type: 'system'
      };

    default:
      return null;
  }
};

/**
 * Creates a message object from a parsed command
 * @param parsedCommand The parsed command
 * @param nickname The user's nickname
 * @param channelName The current channel name
 * @returns Message object
 */
export const createCommandMessage = (
  parsedCommand: ParsedCommand,
  nickname: string,
  channelName: string
): Message => {
  const now = new Date();
  const id = Date.now() + Math.random();

  return {
    id,
    nickname,
    content: parsedCommand.content,
    timestamp: now,
    type: parsedCommand.type,
    command: parsedCommand.command,
    target: parsedCommand.target
  };
};

/**
 * Gets help text for IRC commands
 * @returns Array of help strings
 */
export const getIRCCommandsHelp = (): string[] => {
  return [
    '/me <action> - Send an action message (e.g., /me waves)',
    '/notice <nickname> <message> - Send a notice to a user',
    '/topic [new topic] - View or change channel topic',
    '/kick <nickname> [reason] - Kick a user from the channel',
    '/ban <nickname> [reason] - Ban a user from the channel',
    '/unban <nickname> - Unban a user from the channel',
    '/join <channel> - Join a channel',
    '/part [message] - Leave current channel',
    '/quit [message] - Quit IRC',
    '/nick <newnick> - Change your nickname',
    '/who - List users in current channel',
    '/help - Show this help message'
  ];
};
