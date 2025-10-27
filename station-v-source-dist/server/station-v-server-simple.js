import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

class StationVServer extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.connectedClients = new Map(); // Map WebSocket connections to client info
    this.channels = new Map(); // Map channel names to channel data
    this.users = new Map(); // Map nicknames to user data
    this.port = 8080;
  }

  start(port = 8080) {
    this.port = port;
    
    // Create WebSocket server for web clients
    this.wss = new WebSocketServer({ 
      port,
      path: '/station-v',
      clientTracking: true,
      perMessageDeflate: false // Disable compression for simpler debugging
    });

    console.log('🚀 Station V Server started');
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/station-v`);
    console.log('🎯 Station V - Virtual Chat Simulator Server');
    console.log('📋 Usage:');
    console.log('1. Start this server: npm run server');
    console.log('2. Open Station V in your browser');
    console.log('3. Use the Network panel to connect to localhost:8080');

    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', (code, reason) => {
        console.log('🔌 WebSocket connection closed');
        this.handleClientDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleClientDisconnect(ws);
      });
    });
  }

  handleWebSocketMessage(ws, message) {
    console.log('📨 Handling WebSocket message type:', message.type);
    
    switch (message.type) {
      case 'register':
        this.handleWebSocketRegister(ws, message);
        break;
      case 'join':
        this.handleWebSocketJoin(ws, message);
        break;
      case 'message':
        this.handleWebSocketMessageSend(ws, message);
        break;
      case 'ai_message':
        this.handleWebSocketAIMessage(ws, message);
        break;
      case 'part':
        this.handleWebSocketPart(ws, message);
        break;
      case 'nick':
        this.handleWebSocketNick(ws, message);
        break;
      default:
        console.log('📨 Unknown WebSocket message type:', message.type);
    }
  }

  handleWebSocketJoin(ws, message) {
    const { nickname, channel } = message;
    
    console.log(`[Server] User ${nickname} joining channel ${channel}`);
    
    // Store client info
    const client = {
      nickname,
      channels: new Set(),
      type: 'human'
    };
    this.connectedClients.set(ws, client);

    // Join channel
    this.joinChannel(nickname, channel);
    
    // Add channel to client's channels
    client.channels.add(channel);
    
    // Send confirmation with channel data
    const channelData = this.channels.get(channel);
    const channelUsers = Array.from(this.users.values()).map(user => ({
      nickname: user.nickname,
      type: user.type || 'human',
      status: user.status || 'online',
      channels: Array.from(user.channels)
    })).filter(user => user.channels.includes(channel));
    
    ws.send(JSON.stringify({
      type: 'joined',
      channel,
      nickname,
      channelData: {
        users: channelUsers,
        messages: channelData ? channelData.messages || [] : [],
        topic: channelData ? channelData.topic || '' : ''
      }
    }));

    // Notify other clients
    this.broadcastToChannel(channel, {
      type: 'user_joined',
      nickname,
      channel
    });
    
    console.log(`[Server] User ${nickname} joined channel ${channel}. Total users: ${this.users.size}`);
  }

  handleWebSocketMessageSend(ws, message) {
    const client = this.connectedClients.get(ws);
    if (!client) return;

    const { channel, content } = message;
    
    // Create message object
    const msg = {
      id: Date.now(),
      nickname: client.nickname,
      content,
      timestamp: new Date(),
      type: 'user'
    };

    // Add to channel messages
    this.addMessageToChannel(channel, msg);

    // Broadcast to all clients in channel
    this.broadcastToChannel(channel, {
      type: 'message',
      message: msg,
      channel: channel
    });
  }

  handleWebSocketAIMessage(ws, message) {
    const { channel, content, nickname } = message;
    
    console.log(`[Server] AI message from ${nickname} in ${channel}: ${content}`);
    
    // Create AI message object
    const aiMsg = {
      id: Date.now(),
      nickname: nickname,
      content,
      timestamp: new Date().toISOString(),
      type: 'ai'
    };
    
    // Broadcast to all clients in channel
    this.broadcastToChannel(channel, {
      type: 'ai_message',
      message: aiMsg,
      channel: channel
    });
  }

  handleWebSocketPart(ws, message) {
    const client = this.connectedClients.get(ws);
    if (!client) return;

    const { channel } = message;
    
    // Remove from channel
    this.partChannel(client.nickname, channel);
    
    // Notify other clients
    this.broadcastToChannel(channel, {
      type: 'user_parted',
      nickname: client.nickname,
      channel
    });
  }

  handleWebSocketNick(ws, message) {
    const client = this.connectedClients.get(ws);
    if (!client) return;

    const { newNickname } = message;
    const oldNickname = client.nickname;
    
    // Check if nickname is available
    if (this.users.has(newNickname)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Nickname already in use'
      }));
      return;
    }

    // Update nickname
    client.nickname = newNickname;
    this.users.delete(oldNickname);
    this.users.set(newNickname, client);

    // Notify all clients
    this.broadcastToAll({
      type: 'nick_change',
      oldNickname,
      newNickname
    });
  }

  handleClientDisconnect(ws) {
    const client = this.connectedClients.get(ws);
    if (client) {
      this.handleUserQuit(client.nickname);
      this.connectedClients.delete(ws);
    }
  }

  handleUserQuit(nickname) {
    const user = this.users.get(nickname);
    if (!user) return;

    // Remove from all channels
    user.channels.forEach(channel => {
      this.partChannel(nickname, channel);
    });

    // Remove user
    this.users.delete(nickname);

    // Notify all clients
    this.broadcastToAll({
      type: 'user_quit',
      nickname
    });
  }

  joinChannel(nickname, channelName) {
    console.log(`[Server] joinChannel: ${nickname} -> ${channelName}`);
    
    // Get or create channel
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        name: channelName,
        users: new Set(),
        messages: [],
        topic: ''
      });
      console.log(`[Server] Created new channel: ${channelName}`);
    }

    const channel = this.channels.get(channelName);
    
    // Create user if it doesn't exist
    if (!this.users.has(nickname)) {
      this.users.set(nickname, {
        nickname,
        channels: new Set(),
        type: 'human'
      });
      console.log(`[Server] Created new user: ${nickname}`);
    }
    
    const user = this.users.get(nickname);
    if (user) {
      channel.users.add(nickname);
      user.channels.add(channelName);
      console.log(`[Server] Added ${nickname} to channel ${channelName}. Channel users: ${Array.from(channel.users).join(', ')}`);
    }
  }

  partChannel(nickname, channelName) {
    const channel = this.channels.get(channelName);
    const user = this.users.get(nickname);

    if (channel && user) {
      channel.users.delete(nickname);
      user.channels.delete(channelName);
    }
  }

  addMessageToChannel(channelName, message) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.messages.push(message);
      
      // Keep only last 100 messages per channel
      if (channel.messages.length > 100) {
        channel.messages = channel.messages.slice(-100);
      }
    }
  }

  broadcastToChannel(channelName, message) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.log(`[Server] Channel ${channelName} not found for broadcast`);
      return;
    }

    console.log(`[Server] Broadcasting to channel ${channelName}:`, message);
    console.log(`[Server] Connected clients: ${this.connectedClients.size}`);

    // Send to WebSocket clients
    this.connectedClients.forEach((client, ws) => {
      console.log(`[Server] Client ${client.nickname} channels:`, Array.from(client.channels));
      if (client.channels.has(channelName)) {
        try {
          ws.send(JSON.stringify(message));
          console.log(`[Server] Sent message to ${client.nickname}`);
        } catch (error) {
          console.error('❌ Error sending to WebSocket client:', error);
        }
      }
    });
  }

  handleWebSocketRegister(ws, message) {
    const { nickname } = message;
    
    console.log(`[Server] Registering user ${nickname}`);
    
    // Store client info without joining any channels
    const client = {
      nickname,
      channels: new Set(),
      type: 'human'
    };
    this.connectedClients.set(ws, client);
    
    // Add to users list
    if (!this.users.has(nickname)) {
      this.users.set(nickname, {
        nickname,
        channels: new Set(),
        type: 'human'
      });
      console.log(`[Server] Created new user: ${nickname}`);
    }
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'registered',
      nickname,
      success: true
    }));
    
    console.log(`[Server] User ${nickname} registered. Total users: ${this.users.size}`);
  }

  broadcastToAll(message) {
    // Send to all WebSocket clients
    this.connectedClients.forEach((client, ws) => {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('❌ Error broadcasting to WebSocket client:', error);
      }
    });
  }
}

// Start the server
const server = new StationVServer();
server.start(8080);

export default StationVServer;
