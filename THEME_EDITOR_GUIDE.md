# Visual Theme Editor - User Guide

## Overview

The Visual Theme Editor allows you to create custom color themes for the IRC Simulator with a live preview. You can customize every aspect of the UI colors and save your custom themes for later use.

## Features

### 🎨 **Visual Color Picker**
- Interactive color pickers for all UI elements
- Hex color code input for precise control
- Live preview of changes as you edit

### 🖼️ **Live Preview**
- Real-time preview of your theme
- See how colors look on actual UI components
- Preview includes:
  - Channel headers
  - Messages and nicknames
  - Buttons (primary and secondary)
  - Status messages (success, warning, error, info)
  - Input fields and borders

### 📦 **Preset Themes**
Six built-in preset themes to get you started:
1. **Dark (Default)** - Classic dark theme
2. **Light (Default)** - Clean light theme
3. **Midnight Blue** - Deep blue dark theme
4. **Forest Green** - Nature-inspired green theme
5. **Sunset Orange** - Warm orange theme
6. **Purple Haze** - Vibrant purple theme

### 💾 **Save & Apply**
- Save custom themes to your configuration
- Themes persist across sessions
- Easy switching between themes

## How to Use

### Opening the Theme Editor

1. Open **Settings** (gear icon or Settings button)
2. Scroll to the **Theme** section
3. Click the **🎨 Customize** button

### Creating a Custom Theme

1. **Choose a Starting Point**
   - Select a preset theme as your base
   - Or start from scratch with the current theme

2. **Customize Colors**
   The editor is organized into sections:

   **Background Colors:**
   - Primary Background - Main app background
   - Secondary Background - Panels and cards
   - Tertiary Background - Input fields and buttons

   **Text Colors:**
   - Primary Text - Main text color
   - Secondary Text - Less prominent text
   - Muted Text - Timestamps and hints

   **Border Colors:**
   - Primary Border - Main borders
   - Secondary Border - Subtle dividers

   **Accent Colors:**
   - Primary Accent - Buttons and highlights
   - Accent Hover - Hover state for interactive elements

   **Status Colors:**
   - Success - Positive messages
   - Warning - Caution messages
   - Error - Error messages
   - Info - Informational messages

   **IRC-Specific Colors:**
   - Nickname - User nicknames in chat
   - Timestamp - Message timestamps
   - System Message - System notifications

3. **Preview Your Changes**
   - The right panel shows a live preview
   - See your colors on real UI components
   - Test hover states on buttons

4. **Name Your Theme**
   - Enter a descriptive name in the "Theme Name" field
   - Example: "My Dark Blue Theme"

5. **Save Your Theme**
   - Click **Save Theme** to apply and save
   - Your theme is now available in Settings

### Applying a Custom Theme

1. Open **Settings**
2. In the **Theme** dropdown, select **Custom**
3. Your saved custom theme will be applied
4. The theme name will be displayed below the dropdown

### Editing an Existing Custom Theme

1. Open **Settings**
2. Make sure **Custom** is selected in the Theme dropdown
3. Click **🎨 Customize**
4. Your current custom theme will load in the editor
5. Make changes and click **Save Theme**

## Color Customization Tips

### Creating a Cohesive Theme

1. **Start with a Base Color**
   - Choose your primary background color first
   - Build other colors around it

2. **Maintain Contrast**
   - Ensure text is readable on backgrounds
   - Use lighter text on dark backgrounds
   - Use darker text on light backgrounds

3. **Use Color Relationships**
   - Secondary background should be slightly different from primary
   - Tertiary background should be distinct but harmonious
   - Borders should be subtle but visible

4. **Test Readability**
   - Check the live preview for readability
   - Make sure nicknames stand out
   - Ensure timestamps are visible but not distracting

5. **Accent Colors**
   - Choose an accent color that pops
   - Make hover states slightly darker/lighter
   - Ensure buttons are clearly clickable

### Color Scheme Ideas

**Dark Themes:**
- Use dark grays (#1a1a1a - #2a2a2a) for backgrounds
- Light grays (#e0e0e0 - #ffffff) for text
- Bright accent colors for highlights

**Light Themes:**
- Use light grays (#f5f5f5 - #ffffff) for backgrounds
- Dark grays (#1a1a1a - #4a4a4a) for text
- Saturated accent colors for highlights

**Monochromatic:**
- Use variations of a single hue
- Adjust lightness/darkness for hierarchy
- Add one contrasting accent color

**Complementary:**
- Use opposite colors on the color wheel
- Example: Blue backgrounds with orange accents
- Creates high contrast and visual interest

## Technical Details

### Where Themes Are Stored

Custom themes are saved in your browser's localStorage under the key `irc-simulator-config`. The theme data includes:

```json
{
  "theme": "custom",
  "customTheme": {
    "id": "custom-1234567890",
    "name": "My Custom Theme",
    "colors": {
      "bgPrimary": "#111827",
      "bgSecondary": "#1f2937",
      // ... all other colors
    }
  }
}
```

### CSS Variables

When a custom theme is active, CSS variables are applied to the document root:

- `--custom-bg-primary`
- `--custom-bg-secondary`
- `--custom-bg-tertiary`
- `--custom-text-primary`
- `--custom-text-secondary`
- `--custom-text-muted`
- `--custom-border-primary`
- `--custom-border-secondary`
- `--custom-accent-primary`
- `--custom-accent-hover`
- `--custom-success`
- `--custom-warning`
- `--custom-error`
- `--custom-info`
- `--custom-nickname`
- `--custom-timestamp`
- `--custom-system-message`

### Affected Components

The custom theme affects:
- Channel headers and lists
- Message display
- User lists
- Input fields
- Buttons (all types)
- Modals and dialogs
- Forms and labels
- Status indicators
- Borders and dividers

## Troubleshooting

### Theme Not Applying

1. Make sure "Custom" is selected in the Theme dropdown
2. Try refreshing the page
3. Check that you saved the theme (not just closed the editor)

### Colors Look Wrong

1. Check contrast ratios for readability
2. Verify hex color codes are valid (#RRGGBB format)
3. Try a preset theme to reset

### Theme Lost After Refresh

1. Make sure you clicked "Save Theme" in the editor
2. Check that you saved settings in the Settings modal
3. Verify browser localStorage is enabled

### Preview Doesn't Match App

1. The preview shows a simplified version
2. Some components may have additional styling
3. Try applying the theme to see the full effect

## Exporting and Sharing Themes

Currently, themes are stored locally. To share a theme:

1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. Find `irc-simulator-config`
4. Copy the `customTheme` object
5. Share the JSON with others

To import a shared theme:
1. Paste the theme JSON into the localStorage
2. Refresh the page
3. Select "Custom" in Theme settings

## Future Enhancements

Planned features for future versions:
- Import/Export theme files
- Theme gallery with community themes
- More preset themes
- Font customization
- Animation speed controls
- Per-channel themes

## Support

If you encounter issues with the theme editor:
1. Check this guide for solutions
2. Try resetting to a default theme
3. Clear browser cache and localStorage
4. Report bugs with screenshots and theme JSON

---

**Enjoy customizing your IRC Simulator experience!** 🎨

