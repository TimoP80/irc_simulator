// Network Service for Station V
// Handles WebSocket connections to the Station V server

import { networkDebug } from '../utils/debugLogger';

export interface NetworkUser {
  nickname: string;
  type: 'human' | 'virtual' | 'bot';
  status: 'online' | 'away';
  channels: string[];
}

export interface NetworkChannel {
  name: string;
  users: NetworkUser[];
  messages: NetworkMessage[];
  topic?: string;
}

export interface NetworkMessage {
  id: number;
  nickname: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'system' | 'bot' | 'ai';
  channel?: string;
}

export interface NetworkConfig {
  serverHost: string;
  serverPort: number;
  nickname: string;
  autoJoinChannels: string[];
}

class NetworkService {
  private ws: WebSocket | null = null;
  private config: NetworkConfig | null = null;
  private connected: boolean = false;
  private channels: Map<string, NetworkChannel> = new Map();
  private users: Map<string, NetworkUser> = new Map();
  private messageHandlers: ((message: NetworkMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private userHandlers: ((users: NetworkUser[]) => void)[] = [];
  private channelDataHandlers: ((channelData: any) => void)[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private receivedMessageIds: Set<number> = new Set();
  private maxStoredMessageIds: number = 1000;

  constructor() {
    this.setupEventListeners();
    this.setupBroadcastChannel();
  }

  private setupEventListeners() {
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }

  private setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('station-v-network');
      this.broadcastChannel.addEventListener('message', (event) => {
        const { type, data } = event.data;
        
        if (type === 'userUpdate') {
          networkDebug.log('Received user update from another tab:', data);
          networkDebug.log('Updating local users from', this.users.size, 'to', data.users.length);
          networkDebug.log('Received users:', data.users.map((u: NetworkUser) => u.nickname));
          
          // Update local users map
          this.users.clear();
          data.users.forEach((user: NetworkUser) => {
            this.users.set(user.nickname, user);
          });
          
          // Update channels
          this.channels.forEach(channel => {
            channel.users = Array.from(this.users.values()).filter(user => 
              user.channels.includes(channel.name)
            );
          });
          
          // Notify local handlers
          this.notifyUserHandlers(Array.from(this.users.values()));
        } else if (type === 'message') {
          const message = data.message;
          networkDebug.log(`Received message ${message.id} from another tab:`, message);
          
          // Check if we've already processed this message
          if (this.receivedMessageIds.has(message.id)) {
            networkDebug.log(`Message ${message.id} already processed from broadcast, skipping`);
            return;
          }
          
          // Mark message as processed
          this.receivedMessageIds.add(message.id);
          
          // Add message to appropriate channel
          const channel = this.channels.get(message.channel || 'general');
          if (channel) {
            channel.messages.push(message);
            
            // Notify local message handlers
            this.messageHandlers.forEach(handler => handler(message));
          }
        }
      });
    } catch (error) {
      networkDebug.warn('BroadcastChannel not supported:', error);
    }
  }

  async connect(config: NetworkConfig): Promise<boolean> {
    try {
      this.config = config;
      const wsUrl = `ws://${config.serverHost}:${config.serverPort}/station-v`;
      
      networkDebug.log(`Connecting to ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        // Set up timeout for connection (10 seconds)
        const timeout = setTimeout(() => {
          if (this.ws) {
            networkDebug.error('Connection timeout - server not responding');
            this.ws.close();
            reject(new Error('Connection timeout - server not responding. Please ensure the server is running.'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          networkDebug.log('Connected to Station V server');
          this.connected = true;
          this.notifyConnectionHandlers(true);
          
          // Join channels
          config.autoJoinChannels.forEach(channel => {
            this.joinChannel(channel);
          });
          
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
          } catch (error) {
            networkDebug.error('Failed to parse server message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          networkDebug.log('Disconnected from server', event.code, event.reason);
          this.connected = false;
          // Clear all users and channels when disconnected
          this.users.clear();
          this.channels.clear();
          this.notifyConnectionHandlers(false);
          this.notifyUserHandlers([]);
          
          // Only reject if this wasn't a successful connection followed by a close
          if (!this.ws) {
            return; // Don't reject on intentional close
          }
          
          // If connection was closed with an error code
          if (event.code !== 1000) {
            let errorMessage = 'Connection closed unexpectedly';
            if (event.code === 1006) {
              errorMessage = 'Connection failed. Please check if the server is running on ' + wsUrl;
            }
            networkDebug.error('Connection closed with error code:', event.code);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          networkDebug.error('WebSocket error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Connection failed. Please ensure the server is running.';
          reject(new Error(errorMessage));
        };
      });
    } catch (error) {
      networkDebug.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      throw new Error(errorMessage);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    // Clear all users and channels when disconnecting
    this.users.clear();
    this.channels.clear();
    this.notifyConnectionHandlers(false);
    this.notifyUserHandlers([]);
    
    // Close broadcast channel
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    // Clear message ID tracking
    this.receivedMessageIds.clear();
  }

  private handleServerMessage(message: any): void {
    networkDebug.log('Received server message:', message);

    switch (message.type) {
      case 'joined':
        this.handleJoined(message);
        break;
      case 'message':
        this.handleMessage(message);
        break;
      case 'ai_message':
        this.handleAIMessage(message);
        break;
      case 'user_joined':
        this.handleUserJoined(message);
        break;
      case 'user_parted':
        this.handleUserParted(message);
        break;
      case 'user_quit':
        this.handleUserQuit(message);
        break;
      case 'nick_change':
        this.handleNickChange(message);
        break;
      case 'error':
        networkDebug.error('Server error:', message.message);
        break;
      default:
        networkDebug.log('Unknown message type:', message.type);
    }
  }

  private handleJoined(message: any): void {
    networkDebug.log(`Joined channel: ${message.channel}`);
    
    // Process channel data if provided
    if (message.channelData) {
      networkDebug.log(`Received channel data for ${message.channel}:`, message.channelData);
      
      // Update channel with received data
      const channel = this.channels.get(message.channel);
      if (channel) {
        // Update users
        if (message.channelData.users) {
          message.channelData.users.forEach((user: any) => {
            // Ensure channels is an array, not a Set
            const normalizedUser: NetworkUser = {
              ...user,
              channels: Array.isArray(user.channels) ? user.channels : Array.from(user.channels || [])
            };
            this.users.set(user.nickname, normalizedUser);
          });
        }
        
        // Update messages
        if (message.channelData.messages) {
          channel.messages = message.channelData.messages;
        }
        
        // Update topic
        if (message.channelData.topic !== undefined) {
          channel.topic = message.channelData.topic;
        }
        
        networkDebug.log(`Updated channel ${message.channel} with ${message.channelData.users?.length || 0} users and ${message.channelData.messages?.length || 0} messages`);
        
        // Notify handlers about the updated channel state
        this.notifyUserHandlers(Array.from(this.users.values()));
        
        // Notify channel data handlers about the initial channel data
        this.notifyChannelDataHandlers({
          channel: message.channel,
          users: message.channelData.users || [],
          messages: message.channelData.messages || [],
          topic: message.channelData.topic || ''
        });
        
        // Notify about any messages that were loaded
        if (message.channelData.messages && message.channelData.messages.length > 0) {
          networkDebug.log(`Notifying about ${message.channelData.messages.length} loaded messages`);
          message.channelData.messages.forEach((msg: any) => {
            this.notifyMessageHandlers({
              ...msg,
              channel: message.channel
            });
          });
        }
      }
    }
  }

  private handleMessage(message: any): void {
    networkDebug.log('handleMessage received:', message);
    
    const networkMessage: NetworkMessage = {
      id: message.message.id,
      nickname: message.message.nickname,
      content: message.message.content,
      timestamp: new Date(message.message.timestamp),
      type: message.message.type
    };

    networkDebug.log('Converted to networkMessage:', networkMessage);

    // Don't store messages here - let the App handle message storage
    // Just notify message handlers with channel information
    networkDebug.log('Notifying message handlers, count:', this.messageHandlers.length);
    this.notifyMessageHandlers({
      ...networkMessage,
      channel: message.channel
    });
  }

  private handleAIMessage(message: any): void {
    networkDebug.log('handleAIMessage received:', message);
    
    const networkMessage: NetworkMessage = {
      id: message.message.id,
      nickname: message.message.nickname,
      content: message.message.content,
      timestamp: new Date(message.message.timestamp),
      type: 'ai'
    };

    networkDebug.log('Converted to AI networkMessage:', networkMessage);

    // Notify message handlers with channel information
    networkDebug.log('Notifying message handlers for AI message, count:', this.messageHandlers.length);
    this.notifyMessageHandlers({
      ...networkMessage,
      channel: message.channel
    });
  }

  private handleUserJoined(message: any): void {
    networkDebug.log(`User joined: ${message.nickname} in ${message.channel}`);
    
    // Process channel data if provided (for initial user list)
    if (message.channelData) {
      networkDebug.log(`Received channel data in user_joined for ${message.channel}:`, message.channelData);
      
      // Update channel with received data
      const channel = this.channels.get(message.channel);
      if (channel) {
        // Update users
        if (message.channelData.users) {
          message.channelData.users.forEach((user: any) => {
            // Ensure channels is an array, not a Set
            const normalizedUser: NetworkUser = {
              ...user,
              channels: Array.isArray(user.channels) ? user.channels : Array.from(user.channels || [])
            };
            this.users.set(user.nickname, normalizedUser);
          });
        }
        
        // Update topic
        if (message.channelData.topic !== undefined) {
          channel.topic = message.channelData.topic;
        }
        
        networkDebug.log(`Updated channel ${message.channel} with ${message.channelData.users?.length || 0} users`);
        
        // Notify handlers about the updated channel state
        this.notifyUserHandlers(Array.from(this.users.values()));
        
        // Notify channel data handlers about the initial channel data
        this.notifyChannelDataHandlers({
          channel: message.channel,
          users: message.channelData.users || [],
          topic: message.channelData.topic || ''
        });
      }
      return;
    }
    
    // Add user to channel (existing logic for individual user joins)
    const channel = this.channels.get(message.channel);
    if (channel) {
      const user: NetworkUser = {
        nickname: message.nickname,
        type: 'human',
        status: 'online',
        channels: [message.channel]
      };
      
      // Check if user already exists
      const existingUser = this.users.get(message.nickname);
      if (existingUser) {
        // Ensure channels is an array before pushing
        if (!Array.isArray(existingUser.channels)) {
          existingUser.channels = Array.from(existingUser.channels || []);
        }
        if (!existingUser.channels.includes(message.channel)) {
          existingUser.channels.push(message.channel);
        }
      } else {
        this.users.set(message.nickname, user);
      }
      
      // Update channel users
      channel.users = Array.from(this.users.values()).filter(user => 
        user.channels.includes(message.channel)
      );
      
      // Notify user handlers
      this.notifyUserHandlers(Array.from(this.users.values()));
    }
  }

  private handleUserParted(message: any): void {
    networkDebug.log(`User parted: ${message.nickname} from ${message.channel}`);
    
    // Remove user from channel
    const user = this.users.get(message.nickname);
    if (user) {
      user.channels = user.channels.filter(ch => ch !== message.channel);
      
      // Remove user if not in any channels
      if (user.channels.length === 0) {
        this.users.delete(message.nickname);
      }
    }
    
    // Update channel users
    const channel = this.channels.get(message.channel);
    if (channel) {
      channel.users = Array.from(this.users.values()).filter(user => 
        user.channels.includes(message.channel)
      );
    }
    
    // Notify user handlers
    this.notifyUserHandlers(Array.from(this.users.values()));
  }

  private handleUserQuit(message: any): void {
    networkDebug.log(`User quit: ${message.nickname}`);
    this.users.delete(message.nickname);
    
    // Update all channels
    this.channels.forEach(channel => {
      channel.users = channel.users.filter(user => user.nickname !== message.nickname);
    });
    
    // Notify user handlers
    this.notifyUserHandlers(Array.from(this.users.values()));
  }

  private handleNickChange(message: any): void {
    networkDebug.log(`Nick change: ${message.oldNickname} -> ${message.newNickname}`);
    
    const user = this.users.get(message.oldNickname);
    if (user) {
      this.users.delete(message.oldNickname);
      user.nickname = message.newNickname;
      this.users.set(message.newNickname, user);
    }
    
    // Notify user handlers
    this.notifyUserHandlers(Array.from(this.users.values()));
  }

  // Public methods
  joinChannel(channelName: string): void {
    if (!this.connected || !this.ws) {
      networkDebug.error('Not connected to server');
      return;
    }

    networkDebug.log(`Joining channel: ${channelName}`);
    
    this.ws.send(JSON.stringify({
      type: 'join',
      nickname: this.config?.nickname,
      channel: channelName
    }));

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        name: channelName,
        users: [],
        messages: []
      });
    }
  }

  partChannel(channelName: string): void {
    if (!this.connected || !this.ws) {
      networkDebug.error('Not connected to server');
      return;
    }

    networkDebug.log(`Parting channel: ${channelName}`);
    
    this.ws.send(JSON.stringify({
      type: 'part',
      channel: channelName
    }));
  }

  sendMessage(channelName: string, content: string): void {
    if (!this.connected || !this.ws) {
      networkDebug.error('Not connected to server');
      return;
    }

    networkDebug.log(`Sending message to ${channelName}: ${content}`);
    
    this.ws.send(JSON.stringify({
      type: 'message',
      channel: channelName,
      content: content
    }));
  }

  sendAIMessage(channelName: string, content: string, nickname: string): void {
    if (!this.connected || !this.ws) {
      networkDebug.error('Not connected to server');
      return;
    }

    networkDebug.log(`Sending AI message from ${nickname} to ${channelName}: ${content}`);
    
    this.ws.send(JSON.stringify({
      type: 'ai_message',
      channel: channelName,
      content: content,
      nickname: nickname
    }));
  }

  changeNickname(newNickname: string): void {
    if (!this.connected || !this.ws) {
      networkDebug.error('Not connected to server');
      return;
    }

    networkDebug.log(`Changing nickname to: ${newNickname}`);
    
    this.ws.send(JSON.stringify({
      type: 'nick',
      newNickname: newNickname
    }));
  }

  // Getters
  isConnected(): boolean {
    return this.connected;
  }

  getCurrentNickname(): string | null {
    return this.config?.nickname || null;
  }

  getChannels(): NetworkChannel[] {
    return Array.from(this.channels.values());
  }

  getChannel(name: string): NetworkChannel | undefined {
    return this.channels.get(name);
  }

  getUsers(): NetworkUser[] {
    return Array.from(this.users.values());
  }

  getUsersInChannel(channelName: string): NetworkUser[] {
    const channel = this.channels.get(channelName);
    return channel ? channel.users : [];
  }

  // Event handlers
  onMessage(handler: (message: NetworkMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: NetworkMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  onConnection(handler: (connected: boolean) => void): void {
    this.connectionHandlers.push(handler);
  }

  offConnection(handler: (connected: boolean) => void): void {
    const index = this.connectionHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionHandlers.splice(index, 1);
    }
  }

  onUsers(handler: (users: NetworkUser[]) => void): void {
    this.userHandlers.push(handler);
  }

  offUsers(handler: (users: NetworkUser[]) => void): void {
    const index = this.userHandlers.indexOf(handler);
    if (index > -1) {
      this.userHandlers.splice(index, 1);
    }
  }

  onChannelData(handler: (channelData: any) => void): void {
    this.channelDataHandlers.push(handler);
  }

  offChannelData(handler: (channelData: any) => void): void {
    const index = this.channelDataHandlers.indexOf(handler);
    if (index > -1) {
      this.channelDataHandlers.splice(index, 1);
    }
  }

  private notifyMessageHandlers(message: NetworkMessage): void {
    // Check if we've already processed this message
    if (this.receivedMessageIds.has(message.id)) {
      return;
    }
    
    // Mark message as processed
    this.receivedMessageIds.add(message.id);
    
    // Clean up old message IDs to prevent memory leaks
    if (this.receivedMessageIds.size > this.maxStoredMessageIds) {
      const idsToRemove = Array.from(this.receivedMessageIds).slice(0, this.receivedMessageIds.size - this.maxStoredMessageIds);
      idsToRemove.forEach(id => this.receivedMessageIds.delete(id));
    }
    
    this.messageHandlers.forEach(handler => handler(message));
    
    // Broadcast to other tabs
    this.broadcastMessage(message);
  }

  private broadcastMessage(message: NetworkMessage): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'message',
          data: { message }
        });
      } catch (error) {
        networkDebug.warn('Failed to broadcast message:', error);
      }
    }
  }

  private notifyConnectionHandlers(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private notifyUserHandlers(users: NetworkUser[]): void {
    this.userHandlers.forEach(handler => handler(users));
    
    // Broadcast to other tabs
    this.broadcastUserUpdate(users);
  }

  private notifyChannelDataHandlers(channelData: any): void {
    this.channelDataHandlers.forEach(handler => handler(channelData));
  }

  private broadcastUserUpdate(users: NetworkUser[]): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'userUpdate',
          data: { users: Array.from(users) }
        });
        networkDebug.log(`Broadcasted user update to other tabs with ${users.length} users:`, users.map(u => u.nickname));
      } catch (error) {
        networkDebug.warn('Failed to broadcast user update:', error);
      }
    }
  }
}

// Create singleton instance
let networkService: NetworkService | null = null;

export const getNetworkService = (): NetworkService => {
  if (!networkService) {
    networkService = new NetworkService();
  }
  return networkService;
};

export default NetworkService;
