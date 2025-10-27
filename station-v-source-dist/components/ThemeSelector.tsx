import React, { useState, useEffect } from 'react';
import { getUIThemeService, UITheme } from '../services/uiThemeService';

interface ThemeCardProps {
  theme: UITheme;
  isSelected: boolean;
  onSelect: (themeId: string) => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isSelected, onSelect }) => {
  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-2 border-accent shadow-lg scale-105'
          : 'border border-gray-700 hover:border-accent hover:scale-102'
      }`}
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
      onClick={() => onSelect(theme.id)}
    >
      <h3 className="text-lg font-semibold mb-2">{theme.name}</h3>
      <p className="text-sm opacity-80 mb-4">{theme.description}</p>
      
      {/* Theme Preview */}
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div
            className="w-8 h-8 rounded"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>
        
        {/* Message Preview */}
        <div
          className="p-2 rounded mt-2"
          style={{ backgroundColor: theme.colors.chatWindow }}
        >
          <div className="text-xs" style={{ color: theme.colors.systemMessage }}>
            System Message
          </div>
          <div className="text-xs" style={{ color: theme.colors.userMessage }}>
            User Message
          </div>
          <div className="text-xs" style={{ color: theme.colors.botMessage }}>
            Bot Message
          </div>
        </div>

        {/* Features */}
        <div className="text-xs mt-2 space-y-1">
          <div>✓ {theme.messageStyle.bubbles ? 'Message Bubbles' : 'Flat Messages'}</div>
          <div>✓ {theme.messageStyle.showAvatars ? 'Shows Avatars' : 'No Avatars'}</div>
          <div>✓ {theme.spacing.compact ? 'Compact View' : 'Comfortable View'}</div>
        </div>
      </div>
    </div>
  );
};

export const ThemeSelector: React.FC = () => {
  const [themes, setThemes] = useState<UITheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  
  useEffect(() => {
    const themeService = getUIThemeService();
    setThemes(themeService.getThemes());
    setSelectedTheme(themeService.getCurrentTheme().id);
  }, []);

  const handleThemeSelect = (themeId: string) => {
    const themeService = getUIThemeService();
    themeService.setTheme(themeId);
    setSelectedTheme(themeId);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">UI Theme</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            onSelect={handleThemeSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;