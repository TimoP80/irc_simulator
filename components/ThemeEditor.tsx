import React, { useState, useEffect } from 'react';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  borderPrimary: string;
  borderSecondary: string;
  
  // Accent colors
  accentPrimary: string;
  accentHover: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Special IRC colors
  nickname: string;
  timestamp: string;
  systemMessage: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: ThemeColors;
}

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: CustomTheme) => void;
  currentTheme?: CustomTheme;
}

const DEFAULT_DARK_THEME: ThemeColors = {
  bgPrimary: '#111827',
  bgSecondary: '#1f2937',
  bgTertiary: '#374151',
  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  borderPrimary: '#374151',
  borderSecondary: '#4b5563',
  accentPrimary: '#3b82f6',
  accentHover: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  nickname: '#60a5fa',
  timestamp: '#6b7280',
  systemMessage: '#10b981',
};

const DEFAULT_LIGHT_THEME: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f9fafb',
  bgTertiary: '#f3f4f6',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  borderPrimary: '#e5e7eb',
  borderSecondary: '#d1d5db',
  accentPrimary: '#3b82f6',
  accentHover: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  nickname: '#2563eb',
  timestamp: '#6b7280',
  systemMessage: '#059669',
};

const PRESET_THEMES: CustomTheme[] = [
  { id: 'dark', name: 'Dark (Default)', colors: DEFAULT_DARK_THEME },
  { id: 'light', name: 'Light (Default)', colors: DEFAULT_LIGHT_THEME },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    colors: {
      ...DEFAULT_DARK_THEME,
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgTertiary: '#334155',
      accentPrimary: '#60a5fa',
      accentHover: '#3b82f6',
    },
  },
  {
    id: 'forest',
    name: 'Forest Green',
    colors: {
      ...DEFAULT_DARK_THEME,
      bgPrimary: '#14532d',
      bgSecondary: '#166534',
      bgTertiary: '#15803d',
      accentPrimary: '#22c55e',
      accentHover: '#16a34a',
      nickname: '#86efac',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    colors: {
      ...DEFAULT_DARK_THEME,
      bgPrimary: '#431407',
      bgSecondary: '#7c2d12',
      bgTertiary: '#9a3412',
      accentPrimary: '#fb923c',
      accentHover: '#f97316',
      nickname: '#fdba74',
    },
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    colors: {
      ...DEFAULT_DARK_THEME,
      bgPrimary: '#2e1065',
      bgSecondary: '#4c1d95',
      bgTertiary: '#5b21b6',
      accentPrimary: '#a78bfa',
      accentHover: '#8b5cf6',
      nickname: '#c4b5fd',
    },
  },
];

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ isOpen, onClose, onSave, currentTheme }) => {
  const [themeName, setThemeName] = useState(currentTheme?.name || 'Custom Theme');
  const [colors, setColors] = useState<ThemeColors>(currentTheme?.colors || DEFAULT_DARK_THEME);
  const [selectedPreset, setSelectedPreset] = useState<string>('dark');

  useEffect(() => {
    if (currentTheme) {
      setThemeName(currentTheme.name);
      setColors(currentTheme.colors);
    }
  }, [currentTheme]);

  if (!isOpen) return null;

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (preset: CustomTheme) => {
    setSelectedPreset(preset.id);
    setColors(preset.colors);
    setThemeName(preset.name);
  };

  const handleSave = () => {
    const theme: CustomTheme = {
      id: currentTheme?.id || `custom-${Date.now()}`,
      name: themeName,
      colors,
    };
    onSave(theme);
    onClose();
  };

  const ColorInput = ({ label, colorKey }: { label: string; colorKey: keyof ThemeColors }) => (
    <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
      <label className="text-sm text-gray-300 flex-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={colors[colorKey]}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-12 h-8 rounded cursor-pointer border border-gray-600"
        />
        <input
          type="text"
          value={colors[colorKey]}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-24 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Theme Editor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Theme Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Theme Name</label>
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="My Custom Theme"
                />
              </div>

              {/* Preset Themes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preset Themes</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_THEMES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedPreset === preset.id
                          ? 'border-blue-500 bg-blue-900/20 text-blue-200'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Controls */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Background Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Primary Background" colorKey="bgPrimary" />
                  <ColorInput label="Secondary Background" colorKey="bgSecondary" />
                  <ColorInput label="Tertiary Background" colorKey="bgTertiary" />
                </div>

                <h3 className="text-lg font-semibold text-white mt-4">Text Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Primary Text" colorKey="textPrimary" />
                  <ColorInput label="Secondary Text" colorKey="textSecondary" />
                  <ColorInput label="Muted Text" colorKey="textMuted" />
                </div>

                <h3 className="text-lg font-semibold text-white mt-4">Border Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Primary Border" colorKey="borderPrimary" />
                  <ColorInput label="Secondary Border" colorKey="borderSecondary" />
                </div>

                <h3 className="text-lg font-semibold text-white mt-4">Accent Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Primary Accent" colorKey="accentPrimary" />
                  <ColorInput label="Accent Hover" colorKey="accentHover" />
                </div>

                <h3 className="text-lg font-semibold text-white mt-4">Status Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Success" colorKey="success" />
                  <ColorInput label="Warning" colorKey="warning" />
                  <ColorInput label="Error" colorKey="error" />
                  <ColorInput label="Info" colorKey="info" />
                </div>

                <h3 className="text-lg font-semibold text-white mt-4">IRC-Specific Colors</h3>
                <div className="space-y-2">
                  <ColorInput label="Nickname" colorKey="nickname" />
                  <ColorInput label="Timestamp" colorKey="timestamp" />
                  <ColorInput label="System Message" colorKey="systemMessage" />
                </div>
              </div>
            </div>

            {/* Right Column - Live Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Live Preview</h3>
              <div 
                className="rounded-lg border-2 p-4 space-y-4"
                style={{ 
                  backgroundColor: colors.bgPrimary,
                  borderColor: colors.borderPrimary,
                }}
              >
                {/* Preview Header */}
                <div 
                  className="p-3 rounded-lg border"
                  style={{ 
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.borderSecondary,
                  }}
                >
                  <h4 className="font-semibold" style={{ color: colors.textPrimary }}>
                    #general
                  </h4>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    5 users online
                  </p>
                </div>

                {/* Preview Messages */}
                <div className="space-y-2">
                  <div 
                    className="p-3 rounded border"
                    style={{ 
                      backgroundColor: colors.bgTertiary,
                      borderColor: colors.borderSecondary,
                    }}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold" style={{ color: colors.nickname }}>
                        alice
                      </span>
                      <span className="text-xs" style={{ color: colors.timestamp }}>
                        12:34 PM
                      </span>
                    </div>
                    <p style={{ color: colors.textSecondary }}>
                      Hey everyone! How's it going?
                    </p>
                  </div>

                  <div 
                    className="p-3 rounded border"
                    style={{ 
                      backgroundColor: colors.bgTertiary,
                      borderColor: colors.borderSecondary,
                    }}
                  >
                    <p className="text-sm italic" style={{ color: colors.systemMessage }}>
                      *** bob has joined #general
                    </p>
                  </div>
                </div>

                {/* Preview Buttons */}
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded font-medium transition-colors"
                    style={{ 
                      backgroundColor: colors.accentPrimary,
                      color: colors.textPrimary,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentPrimary}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded font-medium border"
                    style={{ 
                      backgroundColor: colors.bgSecondary,
                      color: colors.textSecondary,
                      borderColor: colors.borderPrimary,
                    }}
                  >
                    Secondary Button
                  </button>
                </div>

                {/* Preview Status Messages */}
                <div className="space-y-2">
                  <div className="p-2 rounded text-sm" style={{ backgroundColor: colors.success + '20', color: colors.success }}>
                    ✓ Success message
                  </div>
                  <div className="p-2 rounded text-sm" style={{ backgroundColor: colors.warning + '20', color: colors.warning }}>
                    ⚠ Warning message
                  </div>
                  <div className="p-2 rounded text-sm" style={{ backgroundColor: colors.error + '20', color: colors.error }}>
                    ✗ Error message
                  </div>
                  <div className="p-2 rounded text-sm" style={{ backgroundColor: colors.info + '20', color: colors.info }}>
                    ℹ Info message
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
};

