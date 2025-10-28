// Global error handlers for diagnostics
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import IRC from 'irc-server';

class StationVServer extends EventEmitter {

  constructor() {
    super();
    this.wss = null;
    this.ircServer = null;
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
      path: '/station-v'
    });
    // Create IRC server for IRC clients using irc-server
    this.ircServer = IRC.createServer();
    this.ircServer.listen(6667, '0.0.0.0');
    console.log('🚀 Station V Server started');
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/station-v`);
    console.log(`🔗 IRC server: irc://localhost:6667`);
    console.log('🎯 Station V - Virtual Chat Simulator Server');
    this.setupWebSocketServer();
    // TODO: Refactor setupIRCServer to use irc-server events if needed
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

  // setupIRCServer() {
  //   // This method is deprecated with irc-server. Add irc-server event handling here if needed.
  // }

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
      default:
        console.log('📨 Unknown WebSocket message type:', message.type);
    }
  }

  handleWebSocketJoin(ws, message) {
    const { nickname, channel } = message;
    
    // Store client info
    this.connectedClients.set(ws, {
      nickname,
      channels: new Set(),
      type: 'websocket'
    });

    // Add to channel messages
    // Note: msg is undefined in original code, so let's create a join message
    const msg = {
      id: Date.now(),
      nickname,
      content: `${nickname} joined ${channel}`,
      timestamp: new Date(),
      type: 'join'
    };
    this.addMessageToChannel(channel, msg);

    // Broadcast to all clients in channel
    this.broadcastToChannel(channel, {
      type: 'message',
      message: msg
    });
  }

  handleWebSocketMessageSend(ws, message) {
    const client = this.connectedClients.get(ws);
    if (!client) return;
    const { channel, content } = message;
    const msg = {
      id: Date.now(),
      nickname: client.nickname,
      content,
      timestamp: new Date(),
      type: 'user'
    };
    this.addMessageToChannel(channel, msg);
    this.broadcastToChannel(channel, {
      type: 'message',
      message: msg
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

  handleIRCClientRegister(client) {
    const nickname = client.nick;
    
    // Store IRC client info
    this.users.set(nickname, {
      nickname,
      channels: new Set(),
      type: 'irc',
      client
    });

    // Send welcome message
    client.send('001', nickname, 'Welcome to Station V - Virtual Chat Simulator');
    client.send('002', nickname, 'Your host is Station V Server');
    client.send('003', nickname, 'This server was created for Station V');
    client.send('004', nickname, 'Station V Server', '1.0.0', 'i', '');
  }

  handleIRCMessage(client, event) {
    const nickname = client.nick;
    const channel = event.target;
    const content = event.message;

    // Create message object
    const msg = {
      id: Date.now(),
      nickname,
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

  handleIRCJoin(client, event) {
    const nickname = client.nick;
    const channel = event.channel;

    this.joinChannel(nickname, channel);

    // Get current users in the channel
    const channelData = this.channels.get(channel);
    const channelUsers = channelData ? Array.from(channelData.users.values()) : [];

    // Notify other clients with current user list
    this.broadcastToChannel(channel, {
      type: 'user_joined',
      nickname,
      channel,
      channelData: {
        users: channelUsers,
        topic: channelData?.topic || ''
      }
    });
  }

  handleIRCPart(client, event) {
    const nickname = client.nick;
    const channel = event.channel;

    this.partChannel(nickname, channel);

    // Notify other clients
    this.broadcastToChannel(channel, {
      type: 'user_parted',
      nickname,
      channel
    });
  }

  handleIRCQuit(client) {
    const nickname = client.nick;
    this.handleUserQuit(nickname);
  }

  handleIRCDisconnect(client) {
    const nickname = client.nick;
    this.handleUserQuit(nickname);
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
    if (!channel) return;

    // Send to WebSocket clients
    this.connectedClients.forEach((client, ws) => {
      if (client.channels.has(channelName)) {
        try {
          ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('❌ Error sending to WebSocket client:', error);
        }
      }
    });

    // Send to IRC clients
    channel.users.forEach(nickname => {
      const user = this.users.get(nickname);
      if (user && user.type === 'irc' && user.client) {
        try {
          if (message.type === 'message') {
            user.client.say(channelName, `${message.message.nickname}: ${message.message.content}`);
          }
        } catch (error) {
          console.error('❌ Error sending to IRC client:', error);
        }
      }
    });
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

    // Send to all IRC clients
    this.users.forEach(user => {
      if (user.type === 'irc' && user.client) {
        try {
          if (message.type === 'nick_change') {
            user.client.send('NICK', message.newNickname);
          }
        } catch (error) {
          console.error('❌ Error broadcasting to IRC client:', error);
        }
      }
    });
  }
}

// Start the server
const server = new StationVServer();
server.start(8080);
