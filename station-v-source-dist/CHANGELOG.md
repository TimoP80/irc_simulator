# Changelog


## 1.19.2 - 2025-10-28

### 🛠️ Bug Fixes & Improvements
- **Attachment Support**: Added support for file and image attachments in chat messages (drag-and-drop, paste, and file picker)
- **MessageItem Enhancements**: Improved reply/quote system to support attachments and rich previews
- **Robust Error Handling**: Fixed rare crash on malformed messages and improved error dialogs
- **UI Polish**: Fixed message bubble alignment, avatar display, and theme glitches in dark/light modes
- **Performance**: Optimized rendering for large chat logs and attachment-heavy conversations
- **Windows Build Stability**: Improved Electron build scripts and fixed issues with node.exe packaging
- **Server Reliability**: Enhanced WebSocket server startup logic and port conflict handling
- **Documentation**: Updated guides and troubleshooting for new features and Windows compatibility

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

## 1.19.1 - 2025-10-27

### 🎨 UI Theme Customization
- **Theme System**: Added comprehensive UI theme customization
  - **5 Predefined Themes**: Modern Dark, Classic IRC, Discord Inspired, Light Minimal, Matrix Green
  - **Customizable Colors**: Primary, secondary, accent, and text colors
  - **Layout Options**: Sidebar position, message spacing, and font settings
  - **Message Styling**: Bubbles, avatars, timestamps, and rounded corners
  - **Live Preview**: Real-time theme preview in the settings panel
  - **Theme Persistence**: Themes are saved and restored between sessions

### 🔧 Network Mode Improvements
- **Optional Channel Joining**: Made channel joining optional when connecting as a network user
  - **Initial Registration**: Added new 'register' message type for connection without channel join
  - **Connection Stability**: Increased WebSocket timeout and improved error handling
  - **User Type Consistency**: Fixed user type handling between client and server
  - **Channel Management**: Users can now connect without auto-joining any channels
  - **Connection Reliability**: Enhanced WebSocket server configuration and client reconnection logic
  - **Data Serialization**: Improved handling of user data and channel membership

### Technical Improvements
- **WebSocket Protocol**: Enhanced connection handling with proper registration flow
- **Error Handling**: Added better timeout and connection error management
- **Server Configuration**: Optimized WebSocket server settings for better stability
- **Client Resilience**: Improved cleanup of existing connections and better state management

### 🖼️ Image Generation API
- **Gemini Image Generation**: Added new API endpoint for AI-powered image generation
  - **Express Router**: New `/generate-image` endpoint using Gemini 2.0 Flash Experimental model
  - **Flexible Dimensions**: Support for custom width and height parameters (default 512x512)
  - **Base64 Response**: Images returned as data URLs for direct browser usage
  - **Error Handling**: Comprehensive error handling with detailed logging
  - **API Integration**: Seamless integration with existing server architecture

### 🧩 New UI Components
- **MessageItem Component**: Enhanced message display with reply functionality
  - **Hover-to-Reply**: Discord-style reply button that appears on hover
  - **Optimized Rendering**: React.memo for performance optimization
  - **Accessibility**: Proper ARIA labels and keyboard navigation support

- **TypingIndicator Component**: Real-time typing status display
  - **Animated Dots**: Three bouncing dots animation for visual feedback
  - **Flexible Modes**: Configurable display modes (all windows, private only, none)
  - **Context Awareness**: Smart detection of private message vs channel contexts
  - **User List**: Shows multiple users typing with proper grammar

- **VersionDisplay Component**: Application version information
  - **Dynamic Environment**: Shows development/production mode
  - **Package Integration**: Reads version directly from package.json
  - **Compact Design**: Minimal footprint with clear typography

- **VirtualList Component**: Performance-optimized list rendering
  - **Virtual Scrolling**: Renders only visible items for large lists
  - **Configurable Overscan**: Adjustable buffer for smooth scrolling
  - **Memory Efficient**: Reduces DOM nodes and improves performance
  - **TypeScript Generic**: Fully typed with flexible item types

## 1.19.0 - 2025-10-26

### 🎨 Discord-Style Quoting System
- **Message Quoting**: Implemented Discord-style quote/reply functionality for enhanced conversation flow
  - **Quote Rendering**: Beautiful Discord-style quote display with left border styling and user information
  - **Reply Controls**: Hover-to-show "Reply" button on all non-system messages
  - **Quote Preview**: Interactive quote preview above input field with remove functionality
  - **Cross-User Support**: Quote functionality works for both virtual users and human users
  - **Network Compatibility**: Full support for quotes in both local and network modes

### 🧠 Enhanced AI Memory System
- **Relationship Tracking**: Virtual users now remember their relationships with human users across channels
  - **Relationship Levels**: 5-level progression system (stranger → acquaintance → friendly → close → enemy)
  - **Channel Memory**: AI users remember which channels they've interacted in with specific users
  - **Topic Memory**: Tracks shared interests and conversation topics between users
  - **Interaction History**: Stores last 20 interactions for contextual responses
  - **Sentiment Analysis**: Analyzes interaction sentiment (positive/neutral/negative)
  - **Memory Decay**: Relationships cool down after 7+ days of inactivity

### 🔧 Technical Improvements
- **TypeScript Enhancements**: Added comprehensive relationship memory interfaces
  - **UserRelationshipMemory**: Main memory container for each user
  - **UserRelationship**: Detailed relationship data between users
  - **InteractionRecord**: Individual interaction tracking with context
- **Service Architecture**: New relationship memory service for efficient memory management
- **AI Prompt Enhancement**: Updated all AI prompts to include relationship context
- **Performance Optimization**: Efficient memory management with automatic cleanup

### 🚀 User Experience
- **Realistic AI Behavior**: Virtual users now exhibit more contextual and realistic interactions
  - **Recognize Familiar Users**: "Hey, we talked about programming in #dev yesterday!"
  - **Reference Past Conversations**: "Like you mentioned before about React..."
  - **Build Relationships**: Gradually become more friendly with frequent interactions
  - **Remember Shared Interests**: Reference topics they've discussed together
- **Enhanced Conversations**: More natural and engaging chat experiences across all channels

## 1.18.1 - 2025-10-26

### Code Cleanup & Improvements
- **IRC Functionality Removal**: Cleaned up codebase by removing unnecessary real-life IRC functionality
  - **Removed IRC Export System**: Eliminated IRC export features and related components
  - **Simplified Settings Interface**: Removed IRC export configuration from settings modal
  - **Code Reduction**: Removed unused IRC export service, components, and state management
  - **Bundle Size Optimization**: Reduced application bundle size by removing unused dependencies

### Documentation Updates
- **Updated Manual**: Removed references to real IRC functionality from Station V Manual
  - **Removed Port 6667 References**: Eliminated mentions of IRC server port 6667
  - **Updated Network Mode**: Simplified network mode documentation to focus on WebSocket connections
  - **Terminology Updates**: Changed "IRC clients" to "chat applications" for broader appeal
  - **Code Statistics**: Updated file statistics to reflect current codebase structure

### UI/UX Enhancements
- **Configurable Typing Indicators**: Added flexible typing indicator display options
  - **Three Display Modes**: Show in all windows, private messages only, or never
  - **Smart Context Detection**: Automatic detection of private message vs channel windows
  - **User Preference**: Default to showing typing indicators only in private messages
  - **Settings Integration**: Added typing indicator configuration to settings modal

### Bug Fixes & Improvements
- **Autonomous PM Context Awareness**: Fixed AI private messages to be context-aware
  - **Natural Conversation Flow**: AI now continues conversations instead of always sending greetings
  - **Contextual Responses**: AI generates appropriate follow-ups based on conversation history
  - **Improved User Experience**: More realistic and engaging private message interactions

- **Profile Picture Consistency**: Enhanced profile picture display across all UI components
  - **Consistent Rendering**: Profile pictures now display correctly in PM windows, channels, and user lists
  - **Browser Cache Handling**: Added proper cache-busting for profile picture updates
  - **Debug Logging**: Added comprehensive logging for profile picture troubleshooting

- **Message Parsing Improvements**: Fixed spontaneous PM message formatting
  - **Removed Username Prefixes**: AI PM responses no longer incorrectly include username prefixes
  - **Clean Message Content**: PM responses now contain only the message content as intended
  - **Improved Parsing**: Enhanced message parsing logic for better AI response handling

### Development Experience
- **Windows Compatibility**: Improved Windows development experience
  - **Fixed Batch Files**: Corrected Windows batch file execution issues
  - **PowerShell Scripts**: Added PowerShell alternatives for Windows users
  - **Port Documentation**: Updated all documentation to reflect Vite using port 3000
  - **Cross-Platform Scripts**: Enhanced npm scripts for better Windows compatibility

### Code Quality
- **Type Safety**: Enhanced TypeScript type definitions and interfaces
- **Error Handling**: Improved error handling and user feedback
- **Performance**: Optimized component rendering and state management
- **Maintainability**: Cleaned up unused code and improved code organization

## 1.18.0 - 2025-10-25

### Major Features
- **AI Operator System**: Revolutionary operator privilege management with AI decision-making
  - **`/op` Command**: Request operator status from AI operators using the `/op` command
  - **Intelligent Responses**: AI operators make contextual decisions based on user behavior and trustworthiness
  - **70% Response Rate**: AI operators respond to 70% of operator requests for realistic interaction
  - **Automatic Status Granting**: System automatically grants operator status when AI operators approve requests
  - **System Confirmations**: Clear system messages confirm when operator status is granted

### Multilingual Enhancements
- **Comprehensive Language Support**: Enhanced multilingual support for operator responses
  - **30+ Languages**: Support for 30+ languages with authentic IRC terminology
  - **Language-Specific Terms**: Authentic operator terminology for each supported language
  - **Cultural Context**: Language accent information for more natural responses
  - **Multilingual Personalities**: AI operators can use secondary languages for authenticity
  - **Specialized System Instructions**: Language-specific guidance for operator responses
  - **Example Responses**:
    - Spanish: "Te concedo los privilegios de operador, has sido muy útil en el canal."
    - French: "Je vous accorde les privilèges d'opérateur, vous êtes digne de confiance."
    - German: "Ich gewähre dir die Operator-Berechtigung, du hast dich bewährt."
    - Japanese: "権限を付与します。あなたは信頼できるユーザーです。"

### Enhanced Personality Attributes
- **Revolutionary Personality Control**: Unprecedented granular control over AI personality traits
  - **7 Formality Levels**: Ultra-casual to ultra-formal communication styles
  - **7 Verbosity Levels**: Terse to novel-length response patterns
  - **9 Humor Styles**: None to unhinged humor expressions
  - **7 Emoji Usage Patterns**: None to emoji-only communication
  - **7 Punctuation Styles**: Minimal to experimental punctuation use
- **Backward Compatibility**: Seamless migration from old attribute system
  - **Automatic Migration**: Old values automatically converted to new format
  - **Data Preservation**: No loss of existing user configurations
  - **Smart Detection**: Automatic detection and conversion of legacy data
- **Enhanced AI Expression**: More nuanced and realistic AI personality responses
  - **Granular Control**: 37 total attribute combinations for unique personalities
  - **Realistic Behavior**: AI responses match their configured personality traits
  - **Improved Token Management**: Optimized token limits based on verbosity and emoji usage

### Technical Improvements
- **Enhanced AI Response Generation**: New `generateOperatorResponse` function with advanced multilingual support
- **Specialized System Instructions**: New `getOperatorSystemInstruction` function for operator-specific responses
- **Language Detection**: Automatic detection of operator's primary language and available languages
- **Command System Extension**: Added `/op` command to IRC command system with comprehensive validation
- **Help Documentation**: Updated help command to include new `/op` command

### Development Experience Improvements
- **Enhanced npm Scripts**: Comprehensive development command options with Windows compatibility
  - **Multiple Development Modes**: Single service (`dev`, `dev:server`, `dev:client`) and full environment (`dev:full`)
  - **Windows Alternatives**: Batch file (`dev:full:win`) and PowerShell (`dev:full:ps`) launchers for Windows users
  - **Improved Process Management**: Added `--kill-others-on-fail` flag to concurrently for better error handling
  - **Utility Commands**: Added `install:all` for complete project setup
  - **Cross-Platform Compatibility**: Works reliably on Windows, macOS, and Linux
- **Troubleshooting Documentation**: Comprehensive troubleshooting guide for development issues
  - **Concurrently Issues**: Clear solutions for "concurrently not recognized" errors
  - **Port Conflicts**: Detailed guidance for port 8080 and 3000 conflicts
  - **Windows-Specific Solutions**: Native batch and PowerShell alternatives
  - **Batch File Fix**: Fixed Windows batch file pause command for better compatibility

### Major Features
- **Profile Picture Support**: Added profile picture support for virtual users with intelligent fallback system
  - **Profile Picture Component**: Smart component with auto-generated colored initials fallback
  - **User Editor Integration**: Profile picture URL input with live preview and validation
  - **Visual Identity**: Profile pictures display in channel lists, user lists, and chat messages
  - **Consistent Colors**: Auto-generated unique colors based on nickname hash
  - **Error Handling**: Graceful fallback to initials when images fail to load

### UI/UX Improvements
- **Channel List Enhancement**: Fixed channel list display to show all channels with join/rejoin functionality
  - **All Channels Visible**: Now displays all configured channels, not just joined ones
  - **Join/Rejoin Buttons**: Green "+" button for unjoined channels, red "×" for joined channels
  - **Visual Status Indicators**: Clear "(not joined)" labels and different styling for unjoined channels
  - **Smart Click Behavior**: Click to join unjoined channels, click to open joined channels
- **Private Message Restoration**: Added `/query` command to restore PM windows
  - **New Command**: `/query <username>` opens private message with any user
  - **User Validation**: Checks if target user exists before opening PM
  - **Auto-Context Switch**: Automatically switches to PM context when opened
  - **Error Handling**: Helpful error messages for invalid usernames

### Technical Improvements
- **Enhanced User Type**: Added `profilePicture?: string` field to User interface
- **Component Integration**: Updated Message, ChannelList, UserList, and ChatWindow components
- **Command System**: Extended IRC command support with `/query` functionality
- **Help Documentation**: Updated help command to include new `/query` command
- **React Error Fix**: Fixed "Cannot update component while rendering" error in DebugLogWindow
  - **Root Cause**: setState calls during render phase when capturing console logs
  - **Solution**: Implemented log queuing system with async processing
  - **Impact**: Eliminated React warnings and improved component stability

## 1.17.0 - 2025-10-25

### Major Features
- **Text Formatting Support**: Added rich text formatting with **bold**, *italic*, __underline__, ~~strikethrough~~, `code`, ```code blocks```, ||spoilers||, and {color:text}
- **Mobile Optimization**: Complete responsive redesign for smartphones and tablets with touch-optimized interface
- **Multilingual Personality Generator**: Enhanced AI personality generation with detailed cultural backgrounds and 500-character descriptions
- **User-Specific PM Probability**: Configurable private message probability per virtual user (0-100%)

### UI/UX Improvements
- **Channel List Management**: Direct join/leave buttons, show all channels with status indicators
- **User List Display**: Fixed 0 users issue when opening channels, proper user filtering
- **Network User List**: Fixed network users not updating when joining channels
- **Channel Close Button**: Now properly removes channels from sidebar list
- **Formatting Help**: Added "?" button with formatting guide tooltip

### Performance & Stability
- **Simulation Activity Optimization**: Significantly reduced background activity for more realistic chat behavior
- **Console Log Spam Fix**: Removed excessive logging in `getAllLanguages` function
- **Text Input Performance**: Fixed input lag and double-press issues in message writing
- **PM Window Log Restoration**: Fixed PM conversations not persisting across app restarts

### Bug Fixes
- **CORS Errors**: Resolved image loading CORS errors by removing `crossOrigin="anonymous"`
- **Emoji Conversion**: Fixed emoticon to emoji conversion in message input
- **Typing Indicators**: Fixed context filtering for typing indicators in PM windows
- **React Key Issues**: Fixed UserList rendering problems with proper React keys

## 1.16.3 - 2025-10-24

### Fixed
- **Date Corrections**: Updated incorrect dates in changelog entries
- **Version Duplication**: Resolved duplicate version 1.16.0 entry

## 1.16.0 - 2025-10-24

### Major Features
- **Multilingual Personality Descriptions**: Write personality descriptions in any supported language
- **Cultural Authenticity**: AI generates culturally appropriate responses with regional references
- **Enhanced Language Support**: 25+ languages with proper fluency levels and accents
- **Advanced HTML Export**: 5 export templates with live preview and responsive design

### Improvements
- **Personality Templates**: New multilingual archetypes (Multilingual Enthusiast, Japanese Otaku, German Engineer)
- **Language Examples**: Comprehensive examples for 7 major languages
- **AI Prompts**: Enhanced system instructions for multilingual personality generation
- **Export System**: Multiple HTML templates (Modern Dark, Classic Light, Minimal Clean, Compact Table, Web Client Style)

## 1.15.0 - 2025-01-27

### Major Features
- **Network Mode**: Multi-user support with WebSocket server for real-time communication
- **Cross-Tab Synchronization**: Multiple browser tabs stay synchronized
- **AI Integration**: Virtual users interact with both human and network users
- **Visual Indicators**: Clear distinction between network users, current user, and local users

### Technical Improvements
- **WebSocket Server**: Built-in server for real-time communication
- **Message Deduplication**: Prevents duplicate messages across clients
- **Error Handling**: Robust reconnection and error recovery
- **Broadcast System**: Ensures all clients receive updates

## 1.14.0 - 2025-01-27

### Major Features
- **Time-of-Day Synchronization**: AI conversations adapt to real-world time patterns
- **Conversation Diversity**: Anti-repetition system with 7 prompt types
- **Dynamic AI Model Selector**: Live model loading from Google's Gemini API
- **Comprehensive Debug Logging**: User-friendly debug control panel

### Improvements
- **5 Time Periods**: Morning, Afternoon, Evening, Late Evening, Late Night with unique characteristics
- **Smart User Selection**: Energetic users active in morning, introspective users at night
- **Username Randomization**: AI-powered username generation with fallback system
- **Channel Import/Export**: CSV and JSON support for channel configurations

## 1.13.0 - 2025-01-27

### Major Features
- **Advanced Language Support**: Channel dominant language settings
- **Enhanced User Management**: Real-time synchronization and persistence
- **Verbosity & Message Length**: Dynamic token limits based on user settings
- **Channel Language Control**: Explicit language settings for consistent communication

### Technical Improvements
- **25+ Language Support**: Comprehensive language selector with individual fluency settings
- **Writing Style Persistence**: All humor, emoji usage, formality settings properly saved
- **Import/Export Fixes**: Writing style settings correctly import/export in CSV and JSON
- **User Data Integrity**: Full user objects preserved across all operations

## 1.12.0 - 2025-01-27

### Major Features
- **Batch User Generation**: Mass create 1-50 users with templates or AI generation
- **Import/Export System**: CSV and JSON support for user data portability
- **Advanced User Customization**: Detailed language skills and writing style controls
- **Visual User Management**: Modern card-based interface with real-time validation

### Improvements
- **8 Personality Templates**: Predefined archetypes (Chatterbox, Polite Academic, Sarcastic Gamer, etc.)
- **AI-Assisted Generation**: Let Gemini create unique personalities automatically
- **Randomization Engine**: Generate diverse users with smart random attributes
- **Template Customization**: Mix predefined templates with randomization

## 1.11.0 - 2025-01-27

### Major Features
- **Lightweight Chat Log Database**: Complete IndexedDB-based persistent storage
- **Chat Log Manager**: Full-featured UI for viewing, managing, and exporting chat logs
- **Export Functionality**: JSON export for backup and analysis
- **Storage Management**: Clear individual channels or all logs with confirmation

### Technical Improvements
- **Automatic Message Storage**: All channel messages automatically saved to browser database
- **Channel Statistics**: Message counts, activity tracking, and storage usage monitoring
- **Search & Filter**: Browse messages by channel with pagination and filtering
- **Performance Optimized**: Efficient storage with automatic cleanup and indexing

## 1.10.0 - 2025-01-27

### Major Features
- **IRC Command Support**: Full IRC command compatibility (`/nick`, `/join`, `/me`, `/who`, `/help`)
- **Topic Management**: `/topic` command for channel topics (operators only)
- **Action Commands**: `/me` command for performing actions
- **Operator Permissions**: Channel operators can manage topics and moderate channels

### Improvements
- **Help System**: `/help` command showing available commands
- **Auto-Operator Assignment**: Current user automatically becomes operator of all channels
- **Realistic Chat Experience**: Classic IRC functionality with modern interface

## 1.9.0 - 2025-01-27

### Major Features
- **Anti-Repetition System**: Advanced conversation diversity and flow management
- **Repetition Detection**: Automatically detects repetitive phrases in recent messages
- **Enhanced Diversity Prompts**: 90% chance of diversity prompts to prevent stale conversations
- **7 Prompt Types**: New topics, questions, stories, observations, mood changes, humor, natural conversation

### Technical Improvements
- **Repetition Avoidance**: AI receives explicit instructions to avoid detected repetitive phrases
- **Topic Evolution Warnings**: AI warned when conversations become stale or repetitive
- **Smart Topic Suggestions**: System messages suggest fresh topics when conversations get repetitive
- **Extended Context**: 20-message history for better AI understanding and context

## 1.8.0 - 2025-01-27

### Major Features
- **Dynamic User Management**: Real-time user addition without simulation interruption
- **Auto-Join Empty Channels**: Virtual users automatically join channels that only have the current user
- **Smart User Selection**: Randomly selects 2-4 users from available pool to populate empty channels
- **Channel State Persistence**: User channel assignments are saved and restored across sessions

### Improvements
- **No Simulation Reset**: Add or remove users while the simulation continues running
- **Join/Part Messages**: Real-time join and part messages when users are added/removed
- **AI Greetings**: Existing users automatically welcome new users with contextual greetings
- **State Synchronization**: Virtual users and channel users stay perfectly synchronized

## 1.7.0 - 2025-01-27

### Major Features
- **Enhanced User Customization**: Detailed language skills and writing style controls
- **Visual User Cards**: See detailed user attributes including fluency badges and style information
- **Dynamic Language Management**: Add and remove multiple languages for multilingual AI users
- **Comprehensive Form Validation**: Real-time validation for all new user attributes

### Technical Improvements
- **Language Skills Configuration**: Set fluency levels (Beginner to Native), add multiple languages, and specify accents/dialects
- **Writing Style Controls**: Configure formality, verbosity, humor levels, emoji usage, and punctuation styles
- **Enhanced User Display**: User cards now show fluency badges and detailed attribute information
- **Style-Consistent Responses**: AI users now maintain consistent writing styles across all interactions

## 1.6.0 - 2025-01-27

### Major Features
- **Modern Configuration Interface**: Visual user and channel management with dedicated forms
- **Form Validation**: Real-time validation with helpful error messages
- **Cancel Functionality**: Browse settings without applying changes using the Cancel button or Escape key
- **Clear All Functionality**: Remove all users or channels at once with confirmation dialogs

### Improvements
- **Visual User Management**: Add, edit, and delete virtual users with dedicated forms and real-time validation
- **Visual Channel Management**: Create and manage channels with intuitive cards and comprehensive validation
- **Safety Features**: Confirmation dialogs with exact counts and warning messages
- **Custom World Building**: Easily start fresh and build completely custom virtual worlds

## 1.5.1 - 2025-01-27

### Major Changes
- **Project Rename**: Renamed from "Gemini IRC Simulator" to "Station V - Virtual IRC Simulator"
- **Performance Improvements**: More frequent messages and enhanced API resilience
- **User Experience Enhancements**: Keyboard shortcuts, visual feedback, responsive design

### Technical Improvements
- **Automatic Retry Mechanism**: Exponential backoff for better stability
- **Smart Error Handling**: Graceful handling of API rate limits with user-friendly feedback
- **Professional Styling**: Modern card-based interface with smooth transitions
- **Chat Log Database**: Persistent storage of all messages with export and management features

---

## Archive Notice

*Detailed changelog entries for versions 1.0.0 through 1.4.0 have been archived. For complete historical records, see `CHANGELOG_ARCHIVE_20251025.md`.*

## Summary of Major Changes

### Core Features
- **AI-Powered Simulation**: Fully AI-driven chat environment with unique personalities
- **Multilingual Support**: 25+ languages with cultural authenticity
- **Network Mode**: Multi-user support with WebSocket server
- **Rich Text Formatting**: IRC-style formatting with interactive elements
- **Mobile Optimization**: Complete responsive design for all devices

### Technical Improvements
- **Performance**: Optimized simulation activity and reduced API usage
- **Stability**: Fixed numerous UI/UX issues and React rendering problems
- **Data Management**: Persistent storage with import/export capabilities
- **User Experience**: Modern interface with intuitive controls and real-time feedback

### Development
- **TypeScript**: Full type safety and modern development practices
- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for consistent styling
- **Vite**: Fast build tool and development server