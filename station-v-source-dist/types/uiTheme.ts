export interface ThemeColors {
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