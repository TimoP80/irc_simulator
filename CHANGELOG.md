# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

## 1.13.0 - 2025-01-20

### Added
- **Per-Language Fluency Configuration**: Enhanced language skills system for more realistic user profiles
  - **Individual Language Fluency**: Each language can now have its own fluency level (beginner, intermediate, advanced, native)
  - **Per-Language Accents**: Optional accent/dialect settings for each language
  - **Multi-Language Support**: Users can speak multiple languages with different proficiency levels
  - **Enhanced User Interface**: Redesigned language skills section with individual language cards
  - **AI Integration**: AI-generated messages now respect per-language fluency settings
  - **World Editor Compatibility**: Full support for World Editor's per-language format
  - **Backward Compatibility**: Automatic conversion from legacy global fluency format

### Enhanced
- **User Management Interface**: Completely redesigned language skills configuration
  - **Language Cards**: Each language gets its own configuration card with fluency and accent settings
  - **Dynamic Language Management**: Add/remove languages with individual settings
  - **Improved UX**: More intuitive interface for managing complex language profiles

## 1.12.0 - 2025-01-20

### Added
- **Channel Assignment System**: Complete user-channel assignment functionality for realistic IRC simulation
  - **Visual Channel Assignments**: Each user card now displays which channels they're assigned to with colored badges
  - **Assignment Controls**: Dropdown selector to assign users to channels and remove buttons to unassign
  - **Real-time Updates**: Channel assignments update immediately in the user interface
  - **World Editor Integration**: Seamlessly integrated into the existing user management interface
  - **Assignment Status**: Clear indication when users are not assigned to any channels
  - **Flexible Management**: Easy assign/unassign functionality for better user organization

### Enhanced
- **User Management Interface**: Enhanced user cards with dedicated channel assignment section
  - **Channel Badges**: Indigo-colored badges showing current channel assignments
  - **Assignment Dropdown**: Smart dropdown showing only channels where user is not yet assigned
  - **Visual Hierarchy**: Clean separation between user details and channel assignments
  - **Intuitive Controls**: Easy-to-use interface for managing user-channel relationships
- **Simulation Realism**: AI simulation now only uses users assigned to the current channel
  - **Channel-Specific Activity**: Background simulation respects channel assignments
  - **Realistic Behavior**: Users only appear in channels they're assigned to
  - **Better Organization**: Clear separation of users across different channels

### Technical Changes
- **UserManagement Component**: Added `onChannelsChange` prop and channel assignment functions
- **SettingsModal Integration**: Updated to pass channel change handler to user management
- **Assignment Logic**: Functions to assign/unassign users from channels with proper state management
- **Visual Components**: Enhanced user display with channel assignment section and controls

## 1.11.3 - 2025-01-20

### Fixed
- **Message Persistence & Export System**: Completely resolved critical issue where chat messages were not being saved or exported properly
  - **Root Cause**: Export modal was receiving stale channel data from SettingsModal instead of live channel state from App.tsx
  - **State Management**: Fixed disconnect between simulation-generated messages and export functionality
  - **SettingsModal Integration**: Updated SettingsModal to receive current channel state with messages via `currentChannels` prop
  - **Message Persistence**: Messages generated during simulation now properly persist and appear in exports
  - **Export Functionality**: Both individual channel and all-channels export now show actual messages instead of 0

### Enhanced
- **HTML Export Formatting**: Completely redesigned HTML export with professional, beautiful formatting
  - **Professional Design**: Dark theme with IRC-style colors, responsive layout, and modern UI
  - **Rich Message Formatting**: Proper timestamps, message type color coding, and current user highlighting
  - **Message Type Support**: Full support for all IRC message types (action, system, join, part, quit, kick, ban, topic, notice, PM)
  - **Visual Enhancements**: Gradient headers, card-based information display, custom scrollbars, and hover effects
  - **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
  - **Technical Improvements**: Proper HTML5 structure, CSS Grid/Flexbox layouts, and error handling
  - **Export Statistics**: Comprehensive channel information, user statistics, and export metadata

### Technical Changes
- **SettingsModal Interface**: Added `currentChannels?: Channel[]` prop to receive live channel state
- **App.tsx Integration**: Updated SettingsModal call to pass current channels state
- **Message Processing**: Enhanced message formatting with proper timestamp handling and type classification
- **Error Handling**: Improved error handling for malformed messages and edge cases
- **State Synchronization**: Fixed race conditions between simulation and export functionality

## 1.11.2 - 2025-01-20

### Fixed
- **Export Window Error**: Resolved critical bug where export window would show "an error occurred while opening export window" message
  - **TypeScript Errors**: Fixed multiple TypeScript compilation errors that were preventing React components from rendering properly
  - **BatchUserModal**: Fixed `usedNicknames` type from `Set<unknown>` to `Set<string>` for proper type safety
  - **GeminiService**: Added missing `User` type import that was causing compilation failures
  - **UsernameGeneration**: Fixed invalid style type `'abstract'` to `'mixed'` in username generation options
  - **Component Rendering**: All modal components now render correctly without falling back to error boundaries
  - **Export Functionality**: Users can now successfully access and use all export features (CSV, JSON, HTML)
- **Typing Indicator Bug**: Fixed issue where typing indicator sometimes showed "AI is typing" instead of specific nickname
  - **Duplicate Indicators**: Removed generic "AI is typing" message that conflicted with specific nickname indicators
  - **Nickname Validation**: Enhanced nickname parsing to properly validate non-empty nicknames
  - **Consistent Behavior**: All message types now use consistent nickname validation logic
  - **Better Error Handling**: Invalid AI responses no longer cause incorrect typing indicators
- **Hydration Error**: Fixed React hydration error caused by invalid HTML structure in AI model selector
  - **Invalid HTML**: Removed `<span>` element inside `<option>` element in model selector
  - **Valid Structure**: Replaced with template literal for proper HTML compliance

### Enhanced
- **Type Safety**: Improved overall TypeScript type safety across the application
- **Error Prevention**: Proactive fixing of compilation errors prevents UI failures
- **User Experience**: Export functionality now works reliably without error messages
- **Build Optimization**: Resolved all build warnings and implemented code splitting for better performance
  - **Mixed Import Warning**: Fixed dynamic/static import conflicts in usernameGeneration module
  - **Bundle Size Warning**: Implemented manual chunking to split 516KB bundle into optimized chunks
  - **Code Splitting**: Separated vendor libraries, AI services, utilities, and components into logical chunks
  - **Clean Build**: Production build now completes without any warnings

## 1.11.1 - 2025-01-20

### Fixed
- **Settings Modal Blank Screen Bug**: Resolved critical issue where the screen would go blank when trying to access settings during background simulation
  - **Simulation Pause**: Background simulation now automatically pauses when settings modal is opened
  - **Immediate Stop**: Added immediate simulation stop when opening settings to prevent interference
  - **Safety Checks**: Added multiple safety checks to prevent simulation from running during modal operations
  - **Error Boundaries**: Added error handling to SettingsModal and ImportExportModal to prevent crashes
  - **Graceful Recovery**: If modal rendering fails, users now see a helpful error message instead of blank screen
  - **Simulation Resume**: Simulation automatically resumes when settings modal is closed (unless manually disabled)

### Enhanced
- **Modal Stability**: Improved overall stability of modal interfaces during active simulation
- **Error Handling**: Better error reporting and recovery mechanisms for UI components
- **User Experience**: Users can now safely access settings and export functionality during simulation

## 1.11.0 - 2025-01-20

### Added
- **HTML Chat Log Export**: Export chat logs in beautiful HTML format for better readability and sharing
  - **Individual Channel Export**: Export any single channel as a standalone HTML file with full styling
  - **All Channels Export**: Export all channels in one comprehensive HTML file with chronological message ordering
  - **Professional Styling**: Dark theme with IRC-style colors, proper typography, and responsive design
  - **Message Type Support**: Full support for all IRC message types (system, action, notice, topic, join, part, quit, kick, ban, PM)
  - **Rich Formatting**: Preserves all message formatting, colors, and visual styling from the original chat
  - **Channel Information**: Displays channel name, topic, message count, and user list in the exported HTML
  - **User Highlighting**: Current user messages are highlighted in green, other users in blue
  - **Timestamps**: Properly formatted timestamps for all messages
  - **Mobile Responsive**: HTML files work perfectly on desktop and mobile devices
  - **Easy Sharing**: Generated HTML files can be shared, archived, or viewed in any web browser
  - **Export Integration**: Added to Import/Export modal with intuitive UI for both individual and bulk exports

### Enhanced
- **Import/Export Modal**: Expanded to include chat log export functionality alongside user data export
- **Export Options**: Now supports CSV, JSON, and HTML export formats for different use cases
- **User Experience**: Clear visual distinction between user data export and chat log export sections

## 1.10.2 - 2025-01-20

### Fixed
- **AI Model ID Validation**: Resolved critical API errors caused by invalid model names
  - **Model ID Extraction**: Added intelligent model ID validation that extracts proper model IDs from display names
  - **Display Name Handling**: Fixed issue where model selector was passing display names instead of model IDs to API
  - **Regex Pattern Matching**: Implemented robust pattern matching to extract `gemini-2.5-flash` from complex display names
  - **Fallback System**: Added automatic fallback to `gemini-2.5-flash` when model ID cannot be determined
  - **Enhanced Debugging**: Added comprehensive logging to track model ID validation process
  - **API Call Validation**: Applied model ID validation to all AI generation functions:
    - `generateChannelActivity()`
    - `generateReactionToMessage()`
    - `generatePrivateMessageResponse()`
    - `generateBatchUsers()`
    - `generateRandomWorldConfiguration()`
  - **Settings UI Debugging**: Added model ID display in Settings modal for troubleshooting

### Fixed
- **Build Asset Reference**: Removed incorrect reference to non-existent `/index.css` in built HTML files
  - **Root Cause**: `index.html` contained a link to `/index.css` which is not generated by the build process
  - **Impact**: Eliminated 404 errors and MIME type issues when serving the built application
  - **Files Updated**: Both `index.html` and `dist/index.html` cleaned up
  - **Result**: Cleaner build output without missing asset references

### Enhanced
- **Error Prevention**: Proactive validation prevents "unexpected model name format" API errors
- **Developer Experience**: Better debugging information for model selection issues
- **API Reliability**: More robust handling of dynamic model loading and selection

## 1.10.1 - 2025-01-20

### Fixed
- **API Rate Limit Issues**: Addressed frequent API errors caused by typing delays
  - **Increased Simulation Intervals**: Made background simulation more API-friendly
    - Fast: 3s → 5s (67% less frequent)
    - Normal: 6s → 10s (67% less frequent) 
    - Slow: 12s → 20s (67% less frequent)
  - **Better Error Handling**: Reduced error message frequency from every 2 minutes to every 5 minutes
  - **Automatic Recovery**: Simulation pauses for 30 seconds after API errors to prevent rapid retries
  - **Clearer Error Messages**: More helpful error messages that guide users to solutions
  - **Conservative Defaults**: New intervals are much safer for free-tier API keys

### Enhanced
- **API Resilience**: Improved handling of rate limit errors with automatic backoff
- **User Experience**: Less spammy error messages and better guidance when issues occur
- **Documentation**: Updated README with new, more conservative simulation intervals

## 1.10.0 - 2025-01-20

### Added
- **Realistic Typing Delays**: Enhanced AI message simulation with human-like typing behavior
  - **Smart Delay Calculation**: Delay based on message length - longer messages take more time to "type"
  - **Random Variation**: Natural randomness in typing speed to avoid robotic patterns
  - **Configurable Settings**: Full control over typing delay behavior in Settings
  - **Visual Typing Indicators**: Animated dots showing when AI users are "typing"
  - **Multiple User Support**: Shows typing indicators for multiple users simultaneously
  - **Realistic Timing**: Base delay (200ms-3s) + length factor + random variation, capped at maximum delay
  - **Disable Option**: Can be completely disabled for instant responses
  - **Persistent Configuration**: Settings saved and restored between sessions

### Enhanced
- **AI Message Simulation**: All AI responses now include realistic typing delays
  - **Channel Messages**: Background simulation includes typing delays
  - **Reaction Messages**: AI responses to user messages include delays
  - **Greeting Messages**: Welcome messages include typing delays
  - **Burst Mode**: Even rapid-fire messages include appropriate delays
  - **Private Messages**: One-on-one conversations include typing delays
- **User Experience**: More immersive and realistic chat simulation
  - **Typing Indicators**: Visual feedback with animated bouncing dots
  - **Multiple Users**: Shows when multiple AI users are typing simultaneously
  - **Natural Flow**: Conversations feel more human and less robotic
  - **Configurable Timing**: Users can adjust delay settings to their preference

### Technical Changes
- **New Configuration**: Added `typingDelay` settings to `AppConfig` interface
- **Delay Algorithm**: Smart calculation based on message length and random factors
- **State Management**: Added `typingUsers` state to track who is currently typing
- **Settings UI**: New "Typing Delay Settings" section in SettingsModal
- **Visual Components**: Enhanced ChatWindow with animated typing indicators
- **Configuration Persistence**: Typing delay settings saved to localStorage

## 1.9.0 - 2025-01-20

### Added
- **Dynamic AI Model Listing**: Real-time model discovery and selection
  - **API Integration**: Fetches available models directly from Google's Gemini API using `https://generativelanguage.googleapis.com/v1beta/models`
  - **Live Model Discovery**: Automatically discovers new models as they become available
  - **Model Information Display**: Shows detailed model information including token limits, capabilities, and descriptions
  - **Fallback System**: Gracefully falls back to static models if API is unavailable
  - **Loading States**: Visual feedback during model fetching with loading indicators
  - **Error Handling**: Displays error messages when model fetching fails
  - **Enhanced UI**: Updated model selector with token limits and real-time information
  - **TypeScript Support**: Full type safety with `GeminiModel` and `ModelsListResponse` interfaces

### Enhanced
- **AI Model Selector**: Now displays live model information from the API
  - **Token Limits**: Shows input token limits for each model (e.g., "Input: 1000k tokens")
  - **Model Count**: Displays total number of available models found
  - **Real-time Updates**: Models are fetched fresh each time settings are opened
  - **Better Descriptions**: Uses official model descriptions from Google's API
  - **Improved UX**: Loading states and error handling for better user experience

### Technical Changes
- **New API Functions**: Added `listAvailableModels()` and `getModelInfo()` to `geminiService.ts`
- **Type Definitions**: Added `GeminiModel` and `ModelsListResponse` interfaces to `types.ts`
- **Constants Update**: Renamed `AI_MODELS` to `FALLBACK_AI_MODELS` for clarity
- **Dynamic Model Support**: `AppConfig.aiModel` now supports any model ID from the API
- **Error Resilience**: Graceful handling of API failures with fallback to static models

## 1.8.0 - 2025-01-20

### Added
- **Username Randomization in User Management**: Enhanced user creation and editing experience
  - **Randomize Button**: Purple "Randomize" button next to nickname input field
  - **AI-Powered Generation**: Uses the same AI username generation system as batch creation
  - **Loading States**: Visual feedback with spinner and "Generating..." text during AI generation
  - **Fallback System**: Automatic fallback to simple random nickname if AI fails
  - **Error Handling**: Clears nickname validation errors when generating new names
  - **Enhanced UX**: Improved user experience with intuitive randomize functionality
  - **Consistent Design**: Matches the existing UI design language and color scheme

- **Comprehensive Debug Logging System**: Enhanced troubleshooting and monitoring capabilities
  - **AI Message Generation Logging**: Detailed logs for channel activity, reactions, and private message generation
  - **Username Generation Logging**: Complete logging for AI-powered username generation with fallback tracking
  - **Simulation Debug Logging**: Comprehensive simulation flow logging including burst mode and channel selection
  - **Error Context Logging**: Structured error logging with stack traces, context data, and error categorization
  - **Performance Monitoring**: Logging of API response times, retry attempts, and rate limiting
  - **Configuration Loading Logging**: Detailed logs for configuration loading, merging, and validation
  - **Debug Prefixes**: All debug logs use `[AI Debug]`, `[Simulation Debug]`, `[Config Debug]` prefixes for easy filtering
  - **Debug Logger Utility**: Centralized debug logging system with configurable categories and log levels
  - **Persistent Configuration**: Debug settings saved to localStorage for consistent debugging experience
  - **Category-Based Logging**: Separate loggers for AI, simulation, config, and username generation
  - **Log Level Control**: Debug, info, warn, and error levels with filtering capabilities
  - **Debug Control Panel**: User-friendly interface in settings modal to control debug logging
  - **Real-time Configuration**: Debug settings can be changed without restarting the application

- **AI Model Selector**: Configurable AI model selection for message generation
  - **Model Options**: Choose between Gemini 2.5 Flash, 1.5 Flash, and 1.5 Pro models
  - **Cost Information**: Clear cost indicators (Low/High) for each model option
  - **Performance Descriptions**: Detailed descriptions of speed vs quality trade-offs
  - **Persistent Configuration**: AI model selection saved to localStorage
  - **Real-time Switching**: Model changes apply immediately to new AI messages
  - **Service Integration**: All AI functions (channel activity, reactions, batch generation) use selected model

### Enhanced
- **User Creation Workflow**: Much easier to create users with creative usernames
- **AI Integration**: Seamless integration of AI username generation in individual user creation
- **Form Validation**: Smart error handling that clears when generating new usernames
- **Visual Feedback**: Clear loading states and intuitive button design
- **Error Troubleshooting**: Much easier to diagnose and fix AI-related issues
- **Development Experience**: Comprehensive logging for debugging and monitoring

## 1.7.0 - 2025-10-20

### Added
- **Batch User Generation System**: Complete mass user creation system with multiple generation methods
  - **Personality Templates**: 8 predefined personality archetypes (Chatterbox, Polite Academic, Sarcastic Gamer, etc.)
  - **Trait Pools**: Comprehensive randomization pools for personalities, interests, languages, and accents
  - **AI-Assisted Generation**: Let Gemini AI create unique, creative personalities automatically
  - **Randomization Engine**: Smart random generation with unique nicknames and varied attributes
  - **Mass Add Interface**: Generate 1-50 users at once with live preview functionality
  - **Template Customization**: Mix templates with randomization for perfect control
- **Import/Export System**: Full data portability for user management
  - **CSV Support**: Export/import users in spreadsheet format with proper column mapping
  - **JSON Support**: Export/import complete user objects with all attributes
  - **File Validation**: Automatic format detection and error handling
  - **Backup & Sharing**: Easy data backup and community sharing capabilities
- **Enhanced User Management Interface**: 
  - **Mass Add Button**: Purple button for batch user generation
  - **Import/Export Button**: Orange button for file operations
  - **Improved Workflow**: Streamlined user creation and management process
- **Persistent Channel Logs**: Complete message history persistence system
  - **Automatic Log Saving**: Channel messages are automatically saved to localStorage
  - **Log Persistence**: Channel history persists across browser sessions and page reloads
  - **Log Management**: "Clear Logs" button to remove all message history while keeping channels
  - **Message Count Display**: Visual indicators showing number of messages in each channel
  - **Log Storage Functions**: Comprehensive localStorage functions for saving/loading channel logs
- **Advanced IRC Commands**: Complete IRC command support for realistic simulation
  - **Action Messages**: `/me` command for action messages (e.g., `/me waves`)
  - **Channel Management**: `/join`, `/part`, `/quit` commands for channel navigation
  - **User Management**: `/kick`, `/ban`, `/unban` commands for user moderation
  - **Channel Control**: `/topic` command to view and change channel topics
  - **Communication**: `/notice` command for private notices to users
  - **Information**: `/who`, `/help` commands for user lists and command help
  - **Command Parser**: Robust command parsing with proper argument handling
  - **Visual Display**: Color-coded message types with proper IRC formatting
- **Enhanced Autonomous Messaging**: Improved AI responsiveness and conversation flow
  - **Faster Response Times**: Reduced simulation intervals (3s fast, 6s normal, 12s slow)
  - **Active Channel Priority**: Simulation focuses on the channel the user is currently viewing
  - **Burst Mode**: Additional AI messages generated when user is actively chatting
  - **Action Command Reactions**: Virtual users now react to `/me` action commands
  - **Improved AI Context**: Better understanding of action messages vs regular messages
  - **Dynamic Activity**: More responsive conversation flow with burst mode after user messages
- **AI-Powered Username Generation**: Revolutionary username creation system
  - **Creative AI Names**: AI generates unique, creative usernames instead of random combinations
  - **Style Categories**: 6 different username styles (Tech, Gaming, Creative, Realistic, Abstract, Mixed)
  - **Personality-Based Names**: Usernames generated based on user personality traits
  - **Batch Generation**: AI creates multiple unique usernames at once for batch user creation
  - **Fallback System**: Traditional generation as backup when AI is unavailable
  - **Style Selection UI**: Visual interface for choosing username generation style
  - **Enhanced Variety**: Much more diverse and interesting usernames than before
- **Configuration Loading Fixes**: Resolved critical bugs in configuration persistence
  - **Fixed Channel Loading**: Configured channels now load correctly instead of default channels
  - **Fixed User Loading**: All configured virtual users now appear in the virtual world
  - **Smart Log Merging**: Saved channel logs are merged with current configuration
  - **Configuration Validation**: Proper validation of saved vs configured channels
  - **Debug Logging**: Added console logging to help identify configuration issues
  - **User Assignment**: All configured users are now properly assigned to channels

### Enhanced
- **User Generation Efficiency**: Create 50 users in seconds instead of hours
- **Personality Diversity**: AI and randomization ensure unique, interesting characters
- **Data Management**: Complete import/export system for user data portability
- **Channel Persistence**: Messages now persist across sessions for realistic IRC experience
- **Channel Management**: Enhanced UI with message count display and log management controls
- **IRC Authenticity**: Full IRC command support makes the simulation feel like real IRC
- **Message Variety**: Rich message types with proper formatting and color coding
- **Conversation Flow**: Much more responsive AI that reacts quickly to user messages
- **Dynamic Activity**: Burst mode creates lively conversations when users are actively chatting
- **Username Quality**: AI-generated usernames are much more creative and realistic
- **User Diversity**: Better variety in usernames with style-based generation
- **Configuration Reliability**: Fixed critical bugs ensuring configured users and channels load correctly
- **Data Persistence**: Improved configuration loading with smart merging of saved logs and current config
- **Scalability**: Build massive virtual communities quickly and easily

### Technical Improvements
- **Randomization Algorithms**: Smart nickname generation and attribute variation
- **AI Integration**: Enhanced Gemini API usage for creative personality generation
- **File Processing**: Robust CSV/JSON parsing with error handling
- **UI/UX**: Intuitive modal interfaces with clear visual feedback

## 1.6.0 - 2025-10-20

### Added
- **Advanced User Customization Interface**: Complete overhaul of user management with detailed personality and writing style controls
  - **Language Skills Configuration**: 
    - Fluency levels (Beginner, Intermediate, Advanced, Native)
    - Multiple language support with add/remove functionality
    - Optional accent/dialect descriptions
  - **Writing Style Controls**:
    - Formality levels (Casual, Formal, Mixed)
    - Verbosity settings (Concise, Moderate, Verbose)
    - Humor levels (None, Light, Heavy)
    - Emoji usage frequency (None, Minimal, Frequent)
    - Punctuation styles (Minimal, Standard, Excessive)
  - **Enhanced User Display**: User cards now show fluency badges and detailed attribute information
  - **Dynamic Language Management**: Add and remove multiple languages for each user
  - **Comprehensive Form Validation**: Real-time validation for all new user attributes

### Enhanced
- **AI Message Generation**: All AI functions now consider user's writing style and language skills for more realistic responses
- **Character Consistency**: AI users now maintain consistent writing styles across all interactions
- **User Interface**: Larger, more organized modals with better visual hierarchy and scrollable content
- **Random World Generation**: AI now generates users with varied language skills and writing styles

### Changed
- **User Type Structure**: Updated User interface to include languageSkills and writingStyle objects
- **Default Users**: All default virtual users now have defined language skills and writing styles
- **AI Prompting**: Enhanced prompts to include detailed user characteristics for better response generation

## 1.5.0 - 2025-10-20

### Added
- **Manual Channel Joining**: Users now must manually join channels using `/join #channelname` command instead of being automatically joined to channels
- **Virtual User Greetings**: AI users now automatically greet new users when they join a channel for the first time:
  - **Contextual Greetings**: Greetings are generated based on the channel topic and existing users' personalities
  - **In-Character Responses**: Each greeting matches the personality of the virtual user who is greeting
  - **Warm Welcome**: Creates a more welcoming and realistic IRC experience
- **Enhanced IRC Authenticity**: More realistic IRC behavior where users must actively join channels

### Changed
- **Default Starting State**: Application now starts with no channels joined - users see "No channel selected" until they join a channel
- **Channel Joining Logic**: Enhanced `/join` command to check if user is already in channel and only generate greetings for new joins
- **Type System**: Updated `ActiveContext` type to allow `null` values for better handling of no-channel state
- **User Experience**: More authentic IRC workflow where users must manually join channels to participate

### Technical Improvements
- **Null Safety**: All components now properly handle cases where no channel is selected
- **Enhanced Error Handling**: Better handling of channel joining edge cases
- **AI Integration**: Leveraged existing AI service for generating contextual greetings
- **State Management**: Improved state handling for channel membership and active context

## 1.4.1 - 2025-10-20

### Added
- **Clear All Functionality**: Added clear buttons for both users and channels to enable easy customization:
  - **Clear All Users**: Red button with trash icon to remove all virtual users at once
  - **Clear All Channels**: Red button with trash icon to remove all channels at once
  - **Smart Visibility**: Clear buttons only appear when there are items to clear
  - **Confirmation Dialogs**: Safety prompts showing exact count of items being cleared
  - **Warning Messages**: Clear indication that actions cannot be undone

### Changed
- **Enhanced User Experience**: Improved workflow for building custom virtual worlds:
  - Users can now easily start fresh by clearing defaults
  - Streamlined process for creating completely custom simulations
  - Better visual hierarchy with red clear buttons vs blue add buttons
- **Button Layout**: Reorganized button groups to show Clear All buttons alongside Add buttons for better workflow

### Fixed
- **Modal Form Conflicts**: Resolved issue where Add User/Channel buttons were closing the settings window:
  - Removed form wrapper that was causing submission conflicts
  - Restructured SettingsModal to use button-based actions instead of form submission
  - Fixed z-index layering for proper modal stacking
  - Simplified event handling for better reliability

## 1.4.0 - 2025-10-20

### Added
- **Advanced User Management Interface**: Complete overhaul of virtual user management with a dedicated interface featuring:
  - Individual user cards with visual preview of personalities
  - Add/Edit/Delete functionality with dedicated modals
  - Real-time form validation with helpful error messages
  - Duplicate nickname prevention and format validation
  - Empty state with helpful guidance for new users
- **Advanced Channel Management Interface**: Complete overhaul of channel management with a dedicated interface featuring:
  - Individual channel cards with visual preview of topics
  - Add/Edit/Delete functionality with dedicated modals
  - Real-time form validation for channel names and topics
  - Duplicate channel prevention and format validation
  - Color-coded channel names and status badges
- **Enhanced Form Validation**: Comprehensive validation for both users and channels:
  - Nickname validation: 2-20 characters, alphanumeric + underscores/hyphens only
  - Channel name validation: Must start with #, 2-30 characters, proper format
  - Personality/Topic validation: Minimum length requirements and character limits
- **Keyboard Shortcuts**: Escape key support for all modals
- **Visual Status Badges**: "AI User" and "Channel" badges for better visual distinction

### Changed
- **Settings Modal Redesign**: Completely redesigned the settings modal with:
  - Larger modal size (max-w-4xl) to accommodate new interfaces
  - Scrollable content for better UX with many items
  - Modern card-based layout replacing text areas
  - Professional styling with hover effects and transitions
- **Improved User Experience**: Enhanced the overall configuration experience with:
  - Intuitive add/edit/delete buttons with icons
  - Confirmation dialogs for destructive actions
  - Better visual hierarchy and spacing
  - Responsive design for different screen sizes

### Technical Improvements
- **Component Architecture**: Created reusable modal and management components:
  - `AddUserModal` and `AddChannelModal` for form handling
  - `UserManagement` and `ChannelManagement` for list management
  - Proper separation of concerns and reusable patterns
- **Data Format Compatibility**: Maintained backward compatibility with existing text-based storage while providing modern UI
- **Form State Management**: Improved form handling with proper validation and error states

## 1.3.0 - 2025-10-20

### Added
- **Cancel Button in Settings Modal**: Added a "Cancel" button to the configuration window, allowing users to view and explore AI world settings without applying changes. Users can now browse the settings and exit without committing to modifications.
- **Keyboard Shortcut Support**: Added Escape key support to close the settings modal, providing a more intuitive user experience.

### Changed
- **More Frequent Autonomous Messages**: Significantly increased the frequency of autonomous AI messages across all simulation speeds:
  - Fast: 15 seconds → 5 seconds (3x more frequent)
  - Normal: 30 seconds → 10 seconds (3x more frequent)  
  - Slow: 60 seconds → 20 seconds (3x more frequent)
- **Enhanced Settings Modal UX**: Improved the settings modal with better button layout and consistent styling for the new cancel functionality.

## 1.2.0 - 2025-10-20

### Changed
- **Enhanced API Resilience**: Implemented an automatic retry mechanism with exponential backoff for all API calls. The application will now gracefully handle temporary API rate limit errors (`429 RESOURCE_EXHAUSTED`) by retrying the request a few times before failing, significantly reducing visible errors and improving the simulation's stability.
- **Smarter Error Feedback**: If the background simulation repeatedly fails even after retries, a single, non-spammy system message will now appear in the affected channel to inform the user. This prevents silent failures without flooding the chat with error messages.

## 1.1.0 - 2025-10-19

### Added
- **Simulation Speed Control**: Users can now adjust the speed of background AI chatter ('Fast', 'Normal', 'Slow') or turn it 'Off' completely via the Settings modal. This provides granular control over API usage.

### Changed
- **Improved API Quota Management**: The simulation now automatically pauses when the application's browser tab is not visible. This, combined with the speed controls, significantly reduces the likelihood of hitting per-minute API rate limits and helps conserve overall quota.
- **Default Simulation Speed**: The default 'Normal' simulation interval has been increased to 30 seconds to lower the default rate of API requests.

## 1.0.0 - 2025-10-19

### Initial Release

This is the first public release of Station V - Virtual IRC Simulator, a fully AI-driven chat environment.

### Features

#### 🚀 Core Simulation
- **AI-Driven Environment**: Simulates a classic IRC experience where all channel activity and user interactions are generated by AI.
- **Multiple Channels**: Join and participate in pre-configured or custom-defined channels, each with its own topic.
- **Private Messaging**: Initiate one-on-one private conversations with any of the AI virtual users.

#### 🧠 AI-Powered Interactions
- **Autonomous Channel Activity**: AI users generate continuous, in-character conversations in channels, creating a lively and believable atmosphere even when you're not typing.
- **Context-Aware Reactions**: AI users react realistically to your messages in both public channels and private messages, taking into account their defined personalities, the channel topic, and recent conversation history.
- **Distinct Personalities**: Each virtual user has a unique personality that guides their behavior, from a curious tech expert to a chaotic prankster.

#### 🎨 User Interface & Experience
- **Classic IRC Layout**: A familiar three-panel interface displaying channels/PMs, the main chat window, and the user list for the current context.
- **Seamless Context Switching**: Easily navigate between channels and private message conversations.
- **Visual Feedback**: An "AI is typing..." indicator provides feedback while waiting for a response.
- **Color-Coded Nicknames**: Unique colors are assigned to user nicknames in the chat window for improved readability.

#### 🛠️ Customization & Persistence
- **Onboarding Settings Modal**: First-time users are greeted with a settings modal to configure their experience from the start.
- **Persistent Configuration**: All your settings—nickname, custom virtual users, and channels—are saved in your browser's local storage for a consistent experience across sessions.
- **Customizable Environment**:
  - Set your own **nickname**.
  - Define the entire cast of **virtual users** and their unique personalities.
  - Create your own **channels** with custom names and topics.

#### ✨ IRC Command Support
- **`/nick <new_name>`**: Change your display nickname on the fly.
- **`/join <#channel>`**: Switch to an existing channel.
- **`/who`**: List all users currently in your active channel.