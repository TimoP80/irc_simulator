import type { CustomTheme } from '../components/ThemeEditor';

/**
 * Apply custom theme colors to the document root as CSS variables
 */
export const applyCustomTheme = (theme: CustomTheme | undefined) => {
  if (!theme) {
    // Remove custom theme variables
    removeCustomTheme();
    return;
  }

  const root = document.documentElement;
  const { colors } = theme;

  // Apply all custom colors as CSS variables
  root.style.setProperty('--custom-bg-primary', colors.bgPrimary);
  root.style.setProperty('--custom-bg-secondary', colors.bgSecondary);
  root.style.setProperty('--custom-bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--custom-text-primary', colors.textPrimary);
  root.style.setProperty('--custom-text-secondary', colors.textSecondary);
  root.style.setProperty('--custom-text-muted', colors.textMuted);
  root.style.setProperty('--custom-border-primary', colors.borderPrimary);
  root.style.setProperty('--custom-border-secondary', colors.borderSecondary);
  root.style.setProperty('--custom-accent-primary', colors.accentPrimary);
  root.style.setProperty('--custom-accent-hover', colors.accentHover);
  root.style.setProperty('--custom-success', colors.success);
  root.style.setProperty('--custom-warning', colors.warning);
  root.style.setProperty('--custom-error', colors.error);
  root.style.setProperty('--custom-info', colors.info);
  root.style.setProperty('--custom-nickname', colors.nickname);
  root.style.setProperty('--custom-timestamp', colors.timestamp);
  root.style.setProperty('--custom-system-message', colors.systemMessage);

  // Add custom theme class to body
  root.classList.add('custom-theme');
};

/**
 * Remove custom theme CSS variables
 */
export const removeCustomTheme = () => {
  const root = document.documentElement;

  // Remove all custom theme variables
  root.style.removeProperty('--custom-bg-primary');
  root.style.removeProperty('--custom-bg-secondary');
  root.style.removeProperty('--custom-bg-tertiary');
  root.style.removeProperty('--custom-text-primary');
  root.style.removeProperty('--custom-text-secondary');
  root.style.removeProperty('--custom-text-muted');
  root.style.removeProperty('--custom-border-primary');
  root.style.removeProperty('--custom-border-secondary');
  root.style.removeProperty('--custom-accent-primary');
  root.style.removeProperty('--custom-accent-hover');
  root.style.removeProperty('--custom-success');
  root.style.removeProperty('--custom-warning');
  root.style.removeProperty('--custom-error');
  root.style.removeProperty('--custom-info');
  root.style.removeProperty('--custom-nickname');
  root.style.removeProperty('--custom-timestamp');
  root.style.removeProperty('--custom-system-message');

  // Remove custom theme class
  root.classList.remove('custom-theme');
};

/**
 * Get the current theme type and custom theme if applicable
 */
export const getCurrentTheme = (): { type: 'dark' | 'light' | 'custom'; customTheme?: CustomTheme } => {
  const savedConfig = localStorage.getItem('irc-simulator-config');
  if (!savedConfig) {
    return { type: 'dark' };
  }

  try {
    const config = JSON.parse(savedConfig);
    return {
      type: config.theme || 'dark',
      customTheme: config.customTheme,
    };
  } catch {
    return { type: 'dark' };
  }
};

