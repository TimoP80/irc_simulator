interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  userList: string;
  channelList: string;
  chatWindow: string;
  inputArea: string;
  systemMessage: string;
  userMessage: string;
  botMessage: string;
  aiMessage: string;
  border: string;
  hover: string;
}

export interface UITheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  fontFamily: string;
  spacing: {
    compact: boolean;
    messageGap: string;
    padding: string;
  };
  messageStyle: {
    bubbles: boolean;
    timestamp24h: boolean;
    showAvatars: boolean;
    roundedCorners: boolean;
  };
  sidebar: {
    position: 'left' | 'right';
    width: string;
    collapsible: boolean;
  };
}

const predefinedThemes: UITheme[] = [
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'A sleek, modern dark theme with accent colors',
    colors: {
      primary: '#1a1b26',
      secondary: '#24283b',
      background: '#1f2937',
      text: '#ffffff',
      accent: '#7c3aed',
      userList: '#374151',
      channelList: '#374151',
      chatWindow: '#1f2937',
      inputArea: '#374151',
      systemMessage: '#64748b',
      userMessage: '#ffffff',
      botMessage: '#a78bfa',
      aiMessage: '#818cf8',
      border: '#374151',
      hover: '#4b5563'
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    spacing: {
      compact: false,
      messageGap: '1rem',
      padding: '1rem'
    },
    messageStyle: {
      bubbles: true,
      timestamp24h: true,
      showAvatars: true,
      roundedCorners: true
    },
    sidebar: {
      position: 'left',
      width: '16rem',
      collapsible: true
    }
  },
  {
    id: 'classic-irc',
    name: 'Classic IRC',
    description: 'Traditional IRC client look with monospace font',
    colors: {
      primary: '#000000',
      secondary: '#1a1a1a',
      background: '#000000',
      text: '#00ff00',
      accent: '#00ff00',
      userList: '#000000',
      channelList: '#000000',
      chatWindow: '#000000',
      inputArea: '#1a1a1a',
      systemMessage: '#808080',
      userMessage: '#00ff00',
      botMessage: '#00ffff',
      aiMessage: '#ff00ff',
      border: '#333333',
      hover: '#1a1a1a'
    },
    fontFamily: 'Consolas, Monaco, monospace',
    spacing: {
      compact: true,
      messageGap: '0.25rem',
      padding: '0.5rem'
    },
    messageStyle: {
      bubbles: false,
      timestamp24h: true,
      showAvatars: false,
      roundedCorners: false
    },
    sidebar: {
      position: 'right',
      width: '12rem',
      collapsible: false
    }
  },
  {
    id: 'discord-inspired',
    name: 'Discord Inspired',
    description: 'A modern chat interface inspired by Discord',
    colors: {
      primary: '#36393f',
      secondary: '#2f3136',
      background: '#36393f',
      text: '#dcddde',
      accent: '#5865f2',
      userList: '#2f3136',
      channelList: '#2f3136',
      chatWindow: '#36393f',
      inputArea: '#40444b',
      systemMessage: '#72767d',
      userMessage: '#dcddde',
      botMessage: '#5865f2',
      aiMessage: '#5865f2',
      border: '#202225',
      hover: '#32353b'
    },
    fontFamily: 'Whitney, "Helvetica Neue", Helvetica, Arial, sans-serif',
    spacing: {
      compact: false,
      messageGap: '0.5rem',
      padding: '1rem'
    },
    messageStyle: {
      bubbles: false,
      timestamp24h: true,
      showAvatars: true,
      roundedCorners: true
    },
    sidebar: {
      position: 'left',
      width: '15rem',
      collapsible: true
    }
  },
  {
    id: 'light-minimal',
    name: 'Light Minimal',
    description: 'Clean and minimal light theme with focus on readability',
    colors: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
      background: '#ffffff',
      text: '#111827',
      accent: '#3b82f6',
      userList: '#f3f4f6',
      channelList: '#f3f4f6',
      chatWindow: '#ffffff',
      inputArea: '#f9fafb',
      systemMessage: '#6b7280',
      userMessage: '#111827',
      botMessage: '#3b82f6',
      aiMessage: '#6366f1',
      border: '#e5e7eb',
      hover: '#f9fafb'
    },
    fontFamily: 'system-ui, sans-serif',
    spacing: {
      compact: false,
      messageGap: '1rem',
      padding: '1.5rem'
    },
    messageStyle: {
      bubbles: false,
      timestamp24h: false,
      showAvatars: true,
      roundedCorners: true
    },
    sidebar: {
      position: 'left',
      width: '14rem',
      collapsible: true
    }
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    description: 'Retro cyberpunk theme with matrix-style colors',
    colors: {
      primary: '#0c0c0c',
      secondary: '#0f1419',
      background: '#0c0c0c',
      text: '#00ff00',
      accent: '#00ff00',
      userList: '#0f1419',
      channelList: '#0f1419',
      chatWindow: '#0c0c0c',
      inputArea: '#0f1419',
      systemMessage: '#008f00',
      userMessage: '#00ff00',
      botMessage: '#00cc00',
      aiMessage: '#00ff00',
      border: '#003300',
      hover: '#001a00'
    },
    fontFamily: 'Source Code Pro, monospace',
    spacing: {
      compact: true,
      messageGap: '0.5rem',
      padding: '0.75rem'
    },
    messageStyle: {
      bubbles: false,
      timestamp24h: true,
      showAvatars: false,
      roundedCorners: false
    },
    sidebar: {
      position: 'right',
      width: '13rem',
      collapsible: true
    }
  }
];

class UIThemeService {
  private currentTheme: UITheme;
  private styleElement: HTMLStyleElement | null = null;
  private initialized = false;

  constructor() {
    // Initialize with modern-dark theme by default
    this.currentTheme = predefinedThemes.find(t => t.id === 'modern-dark') || predefinedThemes[0];
    this.initializeTheme();
  }

  private initializeTheme() {
    if (this.initialized) return;

    try {
      if (!this.styleElement) {
        this.styleElement = document.createElement('style');
        this.styleElement.id = 'station-v-theme';
        
        // Ensure our theme stylesheet has highest priority
        this.styleElement.setAttribute('data-priority', 'high');
        document.head.appendChild(this.styleElement);
      }

      // Remove any existing theme styles
      const existingStyles = document.querySelectorAll('style[id^="station-v-theme"]');
      existingStyles.forEach(style => {
        if (style !== this.styleElement) {
          style.remove();
        }
      });

      this.applyTheme(this.currentTheme);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize theme:', error);
    }
  }

  getThemes(): UITheme[] {
    return predefinedThemes;
  }

  getCurrentTheme(): UITheme {
    return this.currentTheme;
  }

  setTheme(themeId: string) {
    const theme = predefinedThemes.find(t => t.id === themeId);
    if (!theme) {
      console.error(`Theme not found: ${themeId}`);
      return;
    }

    try {
      // Update current theme
      this.currentTheme = theme;
      
      // Apply the theme changes
      this.applyTheme(theme);
      
      // Force a reflow to ensure theme is applied
      document.body.style.display = 'none';
      document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
      
      // Dispatch a custom event for theme change
      const event = new CustomEvent('themechange', { 
        detail: { themeId: theme.id }
      });
      window.dispatchEvent(event);
      
      console.log(`Theme applied successfully: ${theme.id}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }

  private applyTheme(theme: UITheme) {
    if (!this.styleElement) return;

    const css = `
      :root {
        /* Core Colors */
        --primary: ${theme.colors.primary};
        --secondary: ${theme.colors.secondary};
        --background: ${theme.colors.background};
        --text: ${theme.colors.text};
        --accent: ${theme.colors.accent};
        --border: ${theme.colors.border};
        --hover: ${theme.colors.hover};

        /* Component Colors */
        --user-list-bg: ${theme.colors.userList};
        --channel-list-bg: ${theme.colors.channelList};
        --chat-window-bg: ${theme.colors.chatWindow};
        --input-area-bg: ${theme.colors.inputArea};

        /* Message Colors */
        --system-message-color: ${theme.colors.systemMessage};
        --user-message-color: ${theme.colors.userMessage};
        --bot-message-color: ${theme.colors.botMessage};
        --ai-message-color: ${theme.colors.aiMessage};

        /* Typography */
        --font-family: ${theme.fontFamily};
        --message-gap: ${theme.spacing.messageGap};
        --padding: ${theme.spacing.padding};

        /* Component Specific */
        --sidebar-width: ${theme.sidebar.width};
        --message-border-radius: ${theme.messageStyle.roundedCorners ? '0.5rem' : '0'};
      }

      /* Base Styles */
      body {
        background-color: var(--background);
        color: var(--text);
        font-family: var(--font-family);
      }

      /* Layout Components */
      .app-container {
        background-color: var(--background);
      }

      .sidebar {
        background: var(--secondary);
        width: var(--sidebar-width);
        border-color: var(--border);
      }

      /* Channel List */
      .channel-list {
        background-color: var(--channel-list-bg);
        color: var(--text);
      }

      .channel-item {
        border-color: var(--border);
      }

      .channel-item:hover {
        background-color: var(--hover);
      }

      /* User List */
      .user-list {
        background-color: var(--user-list-bg);
        color: var(--text);
      }

      .user-item {
        border-color: var(--border);
      }

      .user-item:hover {
        background-color: var(--hover);
      }

      /* Chat Window */
      .chat-window {
        background-color: var(--chat-window-bg);
      }

      .message-input {
        background-color: var(--input-area-bg);
        color: var(--text);
        border-color: var(--border);
      }

      /* Messages */
      .message {
        margin-bottom: var(--message-gap);
        ${theme.messageStyle.bubbles ? `
          padding: 0.5rem;
          background: var(--secondary);
          border-radius: var(--message-border-radius);
        ` : ''}
      }

      .message.system {
        color: var(--system-message-color);
      }

      .message.user {
        color: var(--user-message-color);
      }

      .message.bot {
        color: var(--bot-message-color);
      }

      .message.ai {
        color: var(--ai-message-color);
      }

      /* Buttons and Interactive Elements */
      button {
        background-color: var(--accent);
        color: var(--text);
        border-color: var(--border);
      }

      button:hover {
        background-color: var(--hover);
      }

      /* Input Elements */
      input, textarea {
        background-color: var(--input-area-bg);
        color: var(--text);
        border-color: var(--border);
      }

      input:focus, textarea:focus {
        border-color: var(--accent);
      }

      /* Modal Windows */
      .modal {
        background-color: var(--background);
        border-color: var(--border);
      }

      .modal-header {
        background-color: var(--secondary);
      }

      /* Navigation */
      .navigation {
        background-color: var(--secondary);
        border-color: var(--border);
      }

      .nav-item:hover {
        background-color: var(--hover);
      }

      /* Settings Panel */
      .settings-panel {
        background-color: var(--background);
        border-color: var(--border);
      }

      .settings-section {
        border-color: var(--border);
      }

      /* Scrollbars */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--secondary);
      }

      ::-webkit-scrollbar-thumb {
        background: var(--accent);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--hover);
      }
    `;

    this.styleElement.textContent = css;
  }
}

let themeService: UIThemeService | null = null;

export const getUIThemeService = (): UIThemeService => {
  if (!themeService) {
    themeService = new UIThemeService();
  }
  return themeService;
};

export default UIThemeService;