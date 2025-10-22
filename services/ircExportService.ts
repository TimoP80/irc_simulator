// IRC Export service using WebSocket proxy approach

export interface IRCExportConfig {
  enabled: boolean;
  server: string;
  port: number;
  nickname: string;
  realname: string;
  channel: string;
  password?: string;
  ssl: boolean;
}

export interface IRCExportStatus {
  connected: boolean;
  server: string;
  channel: string;
  nickname: string;
  lastActivity: Date | null;
  error: string | null;
}

export interface IRCExportMessage {
  type: 'export' | 'import';
  nickname: string;
  content: string;
  timestamp: Date;
  channel: string;
}

class IRCExportService {
  private websocket: WebSocket | null = null;
  private config: IRCExportConfig | null = null;
  private status: IRCExportStatus = {
    connected: false,
    server: '',
    channel: '',
    nickname: '',
    lastActivity: null,
    error: null
  };
  private messageHandlers: ((message: IRCExportMessage) => void)[] = [];
  private proxyUrl = 'ws://localhost:8080/irc-proxy';

  constructor() {
    console.log('[IRC Export] Service initialized with proxy approach');
  }

  async connect(config: IRCExportConfig): Promise<void> {
    console.log('[IRC Export] Connecting via proxy to IRC server:', config.server);
    
    this.config = config;
    this.status = {
      connected: false,
      server: config.server,
      channel: config.channel,
      nickname: config.nickname,
      lastActivity: null,
      error: null
    };

    try {
      // Create WebSocket connection to proxy server
      this.websocket = new WebSocket(this.proxyUrl);
      
      this.websocket.onopen = () => {
        console.log('[IRC Export] Connected to proxy server');
        
        // Send configuration to proxy
        const proxyConfig = {
          type: 'config',
          nickname: config.nickname,
          realname: config.realname,
          channels: [config.channel]
        };
        
        this.websocket!.send(JSON.stringify(proxyConfig));
        console.log('[IRC Export] Configuration sent to proxy');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleProxyMessage(data);
        } catch (error) {
          console.error('[IRC Export] Failed to parse proxy message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('[IRC Export] Proxy connection closed');
        this.status.connected = false;
      };

      this.websocket.onerror = (error) => {
        console.error('[IRC Export] Proxy connection error:', error);
        this.status.error = 'Proxy connection failed';
      };

    } catch (error) {
      console.error('[IRC Export] Connection failed:', error);
      this.status.error = error instanceof Error ? error.message : 'Connection failed';
      throw error;
    }
  }

  private handleProxyMessage(data: any): void {
    console.log('[IRC Export] Received from proxy:', data);
    
    switch (data.type) {
      case 'connecting':
        console.log('[IRC Export] Connecting to IRC server...');
        break;
        
      case 'connected':
        this.status.connected = true;
        this.status.lastActivity = new Date();
        console.log('[IRC Export] IRC connection established');
        break;
        
      case 'joined':
        console.log(`[IRC Export] Joined channel: ${data.channel}`);
        this.status.lastActivity = new Date();
        break;
        
      case 'message':
        // Handle incoming IRC message - only from other users
        if (data.nick && data.nick !== this.config?.nickname) {
          const message: IRCExportMessage = {
            type: 'import',
            nickname: data.nick,
            content: data.message,
            timestamp: new Date(data.timestamp || Date.now()),
            channel: data.channel
          };
          
          this.messageHandlers.forEach(handler => handler(message));
        }
        break;
        
      case 'error':
        console.error('[IRC Export] IRC error:', data.error);
        this.status.error = data.error;
        break;
        
      case 'disconnected':
        this.status.connected = false;
        console.log('[IRC Export] IRC connection lost');
        break;
    }
  }

  async disconnect(): Promise<void> {
    if (this.websocket) {
      console.log('[IRC Export] Disconnecting from proxy');
      
      // Send disconnect message to proxy
      this.websocket.send(JSON.stringify({ type: 'disconnect' }));
      
      // Close WebSocket connection
      this.websocket.close();
      this.websocket = null;
    }
    
    this.status.connected = false;
    this.status.error = null;
  }

  async sendMessage(content: string, nickname: string): Promise<void> {
    if (!this.websocket || !this.status.connected) {
      throw new Error('Not connected to IRC');
    }

    try {
      const message = {
        type: 'message',
        channel: this.config?.channel,
        message: content,
        nickname: nickname
      };
      
      this.websocket.send(JSON.stringify(message));
      this.status.lastActivity = new Date();
      
      console.log(`[IRC Export] Message sent to IRC: ${content}`);
    } catch (error) {
      console.error('[IRC Export] Failed to send message:', error);
      throw error;
    }
  }

  onMessage(handler: (message: IRCExportMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: IRCExportMessage) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  getStatus(): IRCExportStatus {
    return { ...this.status };
  }

  isConnected(): boolean {
    return this.status.connected && this.websocket?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let ircExportService: IRCExportService | null = null;

export const getIRCExportService = (): IRCExportService => {
  if (!ircExportService) {
    ircExportService = new IRCExportService();
  }
  return ircExportService;
};

export const getDefaultIRCExportConfig = (): IRCExportConfig => ({
  enabled: false,
  server: 'irc.libera.chat',
  port: 6667,
  nickname: 'StationV-Export',
  realname: 'Station V IRC Export',
  channel: '#station-v-export',
  ssl: false
});