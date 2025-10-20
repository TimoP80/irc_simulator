# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

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