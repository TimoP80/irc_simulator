import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
/**
 * Station V Server to handle WebSocket connections.
 * @extends EventEmitter
 */
class StationVServer extends EventEmitter {
  /**
   * Creates an instance of StationVServer.
   */
  constructor() {
    super();
    this.wss = null;
    this.connectedClients = new Map(); // Map WebSocket connections to client info
    this.channels = new Map(); // Map channel names to channel data
    this.users = new Map(); // Map nicknames to user data
    this.port = 8080;
  }

  /**
   * Starts the Station V server.
   * @param {number} [port=8080] - The port to listen on.
   */
  start(port = 8080) {
    this.port = port;
    
    // Create WebSocket server for web clients
    this.wss = new WebSocketServer({
      port,
      path: '/station-v'
    });

    console.log('🚀 Station V Server started');
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/station-v`);
    console.log('🎯 Station V - Virtual Chat Simulator Server');

    this.setupWebSocketServer();
  }

  /**
   * Sets up the WebSocket server and its event listeners.
   */
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


  /**
   * Handles incoming WebSocket messages.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The parsed message object.
   */
  handleWebSocketMessage(ws, message) {
    console.log('📨 Handling WebSocket message type:', message.type);
    
    switch (message.type) {
      case 'join':
        this.handleWebSocketJoin(ws, message);
        break;
      case 'message':
        this.handleWebSocketMessageSend(ws, message);
        break;
      case 'part':
        this.handleWebSocketPart(ws, message);
        break;
      case 'nick':
        this.handleWebSocketNick(ws, message);
        break;
      case 'ai_message':
        this.handleAIMessage(ws, message);
        break;
      default:
        console.log('📨 Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Handles a 'join' message from a WebSocket client.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
  handleWebSocketJoin(ws, message) {
    const { nickname, channel } = message;
    
    // Store client info
    this.connectedClients.set(ws, {
      nickname,
      channels: new Set()
    });

    // Join channel
    this.joinChannel(nickname, channel);
    
    // Get current users in the channel
    const channelData = this.channels.get(channel);
    const channelUsers = channelData ? Array.from(channelData.users.values()) : [];
    
    // Send confirmation with current user list
    ws.send(JSON.stringify({
      type: 'joined',
      channel,
      nickname,
      channelData: {
        users: channelUsers,
        topic: channelData?.topic || ''
      }
    }));

    // Notify other clients
    this.broadcastToChannel(channel, {
      type: 'user_joined',
      nickname,
      channel
    });
  }

  /**
   * Handles a 'message' from a WebSocket client.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
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
      message: msg
    });
  }

  /**
   * Handles a 'part' message from a WebSocket client.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
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

  /**
   * Handles a 'nick' change message from a WebSocket client.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
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

  /**
   * Handles an AI-generated message.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
  handleAIMessage(ws, message) {
    const { channel, nickname, content } = message;

    // If channel doesn't exist, create it and add the AI user
    if (!this.channels.has(channel)) {
      this.joinChannel(nickname, channel);
    }

    const msg = {
      id: Date.now(),
      nickname,
      content,
      timestamp: new Date(),
      type: 'ai',
    };

    this.addMessageToChannel(channel, msg);
    this.broadcastToChannel(channel, {
      type: 'message',
      message: msg,
    });
  }
 

  /**
   * Handles a client disconnecting (WebSocket).
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   */
  handleClientDisconnect(ws) {
    const client = this.connectedClients.get(ws);
    if (client) {
      this.handleUserQuit(client.nickname);
      this.connectedClients.delete(ws);
    }
  }

  /**
   * Handles a user quitting from any client type.
   * @param {string} nickname - The nickname of the user.
   */
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

  /**
   * Adds a user to a channel.
   * @param {string} nickname - The user's nickname.
   * @param {string} channelName - The name of the channel to join.
   */
  joinChannel(nickname, channelName) {
    // Get or create channel
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        name: channelName,
        users: new Set(),
        messages: []
      });
    }

    const channel = this.channels.get(channelName);
    const user = this.users.get(nickname);

    if (user) {
      channel.users.add(nickname);
      user.channels.add(channelName);
    }
  }

  /**
   * Removes a user from a channel.
   * @param {string} nickname - The user's nickname.
   * @param {string} channelName - The name of the channel to part.
   */
  partChannel(nickname, channelName) {
    const channel = this.channels.get(channelName);
    const user = this.users.get(nickname);

    if (channel && user) {
      channel.users.delete(nickname);
      user.channels.delete(channelName);
    }
  }

  /**
   * Adds a message to a channel's message history.
   * @param {string} channelName - The name of the channel.
   * @param {object} message - The message object to add.
   */
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

  /**
   * Broadcasts a message to all clients in a specific channel.
   * @param {string} channelName - The name of the channel.
   * @param {object} message - The message object to broadcast.
   */
  broadcastToChannel(channelName, message) {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    const messageString = JSON.stringify(message);

    // Send to WebSocket clients
    this.connectedClients.forEach((client, ws) => {
      if (client.channels.has(channelName) && ws.readyState === 1) { // 1 for WebSocket.OPEN
        ws.send(messageString, (err) => {
          if (err) {
            console.error('❌ Error sending to WebSocket client:', err);
          }
        });
      }
    });

  }

  /**
   * Broadcasts a message to all connected clients.
   * @param {object} message - The message object to broadcast.
   */
  broadcastToAll(message) {
    const messageString = JSON.stringify(message);

    // Send to all WebSocket clients
    this.connectedClients.forEach((client, ws) => {
      if (ws.readyState === 1) { // 1 for WebSocket.OPEN
        ws.send(messageString, (err) => {
          if (err) {
            console.error('❌ Error broadcasting to WebSocket client:', err);
          }
        });
      }
    });

  }
}

// Start the server
const server = new StationVServer();

// Get port from command line argument, default to 8080
const port = parseInt(process.env.PORT || process.argv[2] || '8080', 10);

// Validate port
if (isNaN(port) || port < 1024 || port > 65535) {
  console.error(`Invalid port specified. Using default port 8080.`);
  server.start(8080);
} else {
  server.start(port);
}

export default StationVServer;
