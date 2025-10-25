# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

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