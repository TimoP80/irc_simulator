import { WebSocketServer } from 'ws';
import { Client } from 'irc-framework';

/**
 * IRC Proxy Server to handle WebSocket to IRC connections.
 */
class IRCProxyServer {
  /**
   * Creates an instance of IRCProxyServer.
   */
  constructor() {
    this.wss = null;
    this.ircClients = new Map(); // Map WebSocket connections to IRC clients
    this.activeNicks = new Set(); // Track active nicknames to prevent conflicts
  }

  /**
   * Starts the IRC Proxy Server.
   * @param {number} [port=8080] - The port to listen on.
   */
  start(port = 8080) {
    this.wss = new WebSocketServer({
      port,
      path: '/irc-proxy'
    });

    console.log('🚀 IRC Proxy Server started on port', port);
    console.log('📡 WebSocket endpoint: ws://localhost:' + port + '/irc-proxy');
    console.log('🎯 IRC Proxy Server for Station V');
    console.log('📋 Usage:');
    console.log('1. Start this server: node irc-proxy-server.js');
    console.log('2. Configure Station V to use: ws://localhost:' + port + '/irc-proxy');
    console.log('3. The proxy will handle IRC connections server-side');

    this.wss.on('connection', (ws) => {
      console.log('🔌 New WebSocket connection');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received raw data:', data.toString());
          console.log('📨 Parsed message:', message);
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
          console.error('❌ Raw data:', data.toString());
        }
      });

      ws.on('close', (code, reason) => {
        console.log('🔌 WebSocket connection closed with code:', code, 'reason:', reason.toString());
        this.cleanupIRCClient(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.cleanupIRCClient(ws);
      });
    });
  }

  /**
   * Handles incoming WebSocket messages.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The parsed message object.
   */
  handleWebSocketMessage(ws, message) {
    console.log('📨 Handling message type:', message.type);
    
    switch (message.type) {
      case 'config':
        this.setupIRCClient(ws, message);
        break;
      case 'disconnect':
        this.cleanupIRCClient(ws);
        break;
      case 'message':
        this.handleMessage(ws, message);
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  /**
   * Sets up a new IRC client for a WebSocket connection.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} config - The IRC client configuration.
   */
  setupIRCClient(ws, config) {
    console.log('🔧 Setting up IRC client for', config.nickname);
    
    // Clean up any existing IRC client for this WebSocket
    this.cleanupIRCClient(ws);
    
    // Check if nickname is already in use
    if (this.activeNicks.has(config.nickname)) {
      console.log('⚠️ Nickname', config.nickname, 'is already in use, generating unique nickname');
      config.nickname = config.nickname + '_' + Date.now();
      console.log('🔄 Using nickname:', config.nickname);
    }
    
    // Add nickname to active set
    this.activeNicks.add(config.nickname);
    
    try {
      const ircClient = new Client();
      
      // Set up IRC event handlers
      ircClient.on('registered', () => {
        console.log('✅ IRC client registered');
        
      // Notify WebSocket client that we're connected
      console.log('📤 Sending connected message to WebSocket client');
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'connected'
        }));
      }
        
        // Join channels after registration
        if (config.channels && config.channels.length > 0) {
          console.log('📢 Attempting to join', config.channels.length, 'channels after registration...');
          config.channels.forEach(channel => {
            console.log('📢 Joining channel:', channel);
            ircClient.join(channel);
          });
        }
      });

      ircClient.on('join', (event) => {
        console.log('📢 Successfully joined channel:', event.channel);
        console.log('📢 Join event details:', event);
        
        // Notify WebSocket client
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'joined',
            channel: event.channel
          }));
        }
      });

      ircClient.on('message', (event) => {
        console.log('📨 IRC message from', event.nick, 'in', event.channel, ':', event.message);
        
        // Only forward messages from other users (not system messages)
        if (event.nick && event.nick !== config.nickname && ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'message',
            nick: event.nick,
            channel: event.channel,
            message: event.message,
            timestamp: new Date().toISOString()
          }));
        }
      });

      ircClient.on('error', (error) => {
        console.error('❌ IRC client error:', error);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      });

      ircClient.on('close', () => {
        console.log('🔌 IRC connection closed');
        this.activeNicks.delete(config.nickname);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'disconnected'
          }));
        }
      });

      ircClient.on('raw', (event) => {
        // Log raw IRC events for debugging
        if (event.command === 'ERROR' || event.command === 'QUIT') {
          console.log('📨 Raw IRC event:', event.command, event.params);
        }
      });

      // Store the IRC client for this WebSocket
      this.ircClients.set(ws, ircClient);

      // Connect to IRC server
      console.log('🔗 Attempting IRC connection...');
      ircClient.connect({
        host: 'irc.libera.chat',
        port: 6667,
        nick: config.nickname,
        username: config.nickname,
        realname: config.realname || 'Station V Bot',
        auto_reconnect: false,
        ssl: false
      });
      
      console.log('🔗 IRC connection initiated');
      
      // Notify WebSocket client that connection is being attempted
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'connecting'
        }));
      }
      
    } catch (error) {
      console.error('❌ Failed to setup IRC client:', error);
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    }
  }

  /**
   * Handles a 'message' from a WebSocket client and sends it to the IRC server.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   * @param {object} message - The message object.
   */
  handleMessage(ws, message) {
    const ircClient = this.ircClients.get(ws);
    if (ircClient) {
      console.log('📤 Sending message to IRC:', message.message);
      ircClient.say(message.channel, message.message);
    } else {
      console.log('❌ No IRC client found for WebSocket');
    }
  }

  /**
   * Cleans up the IRC client associated with a WebSocket connection.
   * @param {import('ws').WebSocket} ws - The WebSocket connection.
   */
  cleanupIRCClient(ws) {
    const ircClient = this.ircClients.get(ws);
    if (ircClient) {
      console.log('🧹 Cleaning up IRC client');
      try {
        ircClient.quit('Station V Export ending');
      } catch (error) {
        console.log('❌ Error during IRC cleanup:', error);
      }
      
      // Remove nickname from active set
      const nickname = ircClient.nick || 'unknown';
      this.activeNicks.delete(nickname);
      console.log('🗑️ Removed nickname from active set:', nickname);
      
      this.ircClients.delete(ws);
    }
  }
}

// Start the server
const server = new IRCProxyServer();
server.start(8080);
