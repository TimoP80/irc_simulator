# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

## 1.13.17 - 2025-01-23

### Added
- **Primary Language Forcing in User Generator**: Enhanced batch user generation with language control
  - **Force Primary Language**: Checkbox option to force all generated users to have a specific primary language
  - **Language Selection**: Dropdown to choose from all available languages in the trait pools
  - **Native Fluency**: Forced primary language is automatically set to native fluency level
  - **Smart Integration**: Works with existing randomization settings and language generation
  - **UI Enhancement**: Clean, intuitive interface with conditional display of language selector
  - **Flexible Generation**: Users can still have additional languages with random fluency levels

### Fixed
- **User Channel Removal Bug**: Fixed issue where users could not be removed from their first assigned channel
  - **Root Cause**: UserManagement component was not properly propagating channel changes back to the main App state
  - **Solution**: Updated SettingsModal to properly forward channel changes through the onChannelsChange callback
  - **Impact**: Users can now be removed from any channel, including their first assigned channel
- **User List Update Bug**: Fixed issue where user list did not update when users were removed from channels
  - **Root Cause**: React state calculations were not properly memoized, causing stale references
  - **Solution**: Wrapped activeChannel, usersInContext, and messagesInContext calculations in useMemo hooks
  - **Impact**: User list now updates immediately when users are added or removed from channels
- **React Key Collision Bug**: Fixed "Encountered two children with the same key" error when removing users from channels
  - **Root Cause**: Potential duplicate users in channel users array causing React key conflicts
  - **Solution**: Added deduplication logic in usersInContext calculation and improved key generation in UserList
  - **Impact**: Eliminates React warnings and ensures stable component rendering during user management
- **Channel-Specific User Lists**: Fixed user list showing all users globally instead of channel-specific users
  - **Root Cause**: parseChannels function was adding all virtual users to every channel by default
  - **Solution**: Modified parseChannels to start with empty channels (only current user), allowing proper channel-specific user management
  - **Impact**: User lists now correctly show only users assigned to the current channel, enabling proper channel-specific conversations
- **User List Update on Channel Click**: Fixed user list not updating when clicking on different channels
  - **Root Cause**: Existing saved configuration still had old behavior with all users in every channel
  - **Solution**: Added migration function to detect and fix old channel data, resetting to proper channel-specific user assignments
  - **Impact**: User lists now update correctly when switching between channels, showing only relevant users for each channel
- **Channel User Assignments Reset on Save**: Fixed user channel assignments being reset when pressing save in settings
  - **Root Cause**: Save process only stored basic channel info (name, topic) but not user assignments
  - **Solution**: Added channelObjects to AppConfig to store full channel data including user assignments
  - **Impact**: User channel assignments are now preserved when saving and reloading the application
- **Chat Log Viewer UI Buttons Disappearing**: Fixed UI buttons disappearing when clearing a channel in chat log viewer
  - **Root Cause**: `clearChannel` function was completely removing channel metadata, causing channels to disappear from the list
  - **Solution**: Modified `clearChannel` to keep channel metadata but update it to reflect empty state (0 messages)
  - **Impact**: UI buttons remain visible and functional after clearing channels, providing better user experience
- **Chat Log Viewer Buttons Flickering**: Fixed buttons appearing and quickly disappearing when entering chat log viewer
  - **Root Cause**: Race condition during data loading where buttons were briefly enabled before proper channel selection
  - **Solution**: Clear channel selection immediately when loading starts and disable buttons during loading state
  - **Impact**: Buttons now have consistent disabled state during loading, preventing flickering behavior
- **AI Greeting Repetition Bug**: Fixed users repeating greetings after running simulation for a long time
  - **Root Cause**: Repetition detection system was treating greeting phrases as repetitive content, causing AI to avoid them and then generate more greetings
  - **Solution**: Excluded greeting-related messages and phrases from repetition detection in both `detectRepetitivePatterns` and `trackConversationPatterns`
  - **Impact**: Greetings are now properly excluded from anti-repetition logic, preventing the greeting loop bug
- **Missing Join/Part Notifications**: Fixed user join and leave notifications not appearing in channels
  - **Root Cause**: Join/part messages were being added directly to channel messages array instead of using `addMessageToContext` function
  - **Solution**: Modified `handleUsersChange` to use `addMessageToContext` for join/part messages, ensuring proper message handling and chat log saving
  - **Impact**: Join/part notifications now appear correctly in channels and are properly saved to chat logs
- **AI Generating Messages as End User**: Fixed AI system generating messages from the end user when they're the only one on a channel
  - **Root Cause**: Potential edge case where current user filtering wasn't working properly or current user was included in virtual users
  - **Solution**: Added enhanced debugging and additional safety checks to prevent AI generation when only current user is in channel
  - **Impact**: AI will never generate messages from the human user, ensuring proper separation between human and AI interactions
- **Channel Operators Showing 'you'**: Fixed channel operators list showing 'you' as operator instead of actual human username
  - **Root Cause**: Default nickname was set to "you" which appeared in operators list when user hadn't configured a proper nickname
  - **Solution**: Changed default nickname from "you" to "YourNickname" to make it clear this is a placeholder that should be changed
  - **Impact**: Users now see a clear placeholder nickname that encourages them to set their actual nickname
- **Auto-Join Users to Empty Channels**: Added automatic user joining when channels only have the end user
  - **Feature**: Virtual users now automatically join channels that only contain the current user
  - **Implementation**: Added `autoJoinUsersToEmptyChannels` function that runs during simulation
  - **User Selection**: Randomly selects 2-4 users from the available user pool to join empty channels
  - **Channel State Tracking**: Added `assignedChannels` field to User interface to track channel assignments
  - **Persistence**: User channel assignments are saved to localStorage and restored on app restart
  - **Impact**: Channels never stay empty for long, ensuring continuous conversation activity
- **Timestamp Serialization Error**: Fixed "message.timestamp.toISOString is not a function" error when saving channel logs
  - **Root Cause**: Some messages had timestamps that weren't proper Date objects, causing serialization to fail
  - **Solution**: Added safety check in `saveChannelLogs` to handle both Date objects and other timestamp formats
  - **Implementation**: Uses `instanceof Date` check and converts non-Date timestamps to Date objects before serialization
  - **Impact**: Channel logs now save reliably regardless of timestamp format, preventing runtime errors
- **Join Notifications Not Visible**: Fixed join notifications not appearing in the selected channel
  - **Root Cause**: Join messages were being added using stale channel data in `handleUsersChange` function
  - **Solution**: Modified `handleUsersChange` to use updated channels array when adding join messages
  - **Implementation**: Moved join message creation inside the `setChannels` callback to ensure fresh channel data
  - **Debug Logging**: Added console logging to track join message creation and channel updates
  - **Impact**: Join notifications now appear correctly in the selected channel when users are added
- **Enhanced Chat Log Export**: Improved chat log export functionality with multiple formats and better UI
  - **Multiple Export Options**: Added separate buttons for exporting specific channels vs all channels
  - **CSV Export Support**: Added CSV export format for better data analysis and spreadsheet compatibility
  - **Export Formats**: JSON (structured data) and CSV (spreadsheet-friendly) formats available
  - **Improved UI**: Clear button labels and better organization of export options
  - **File Naming**: Exports include channel name and date in filename for easy identification
  - **Impact**: Users can now export chat logs in multiple formats for different use cases
- **Default Nickname Flash Fix**: Fixed default nickname appearing briefly when page loads even with saved configuration
  - **Root Cause**: State was initialized with DEFAULT_NICKNAME before configuration was loaded asynchronously
  - **Solution**: Changed state initialization to load saved configuration synchronously using useState initializer functions
  - **Implementation**: All state variables now check for saved config during initialization instead of after render
  - **Impact**: No more flash of default nickname - saved nickname appears immediately on page load
- **AI Generating Messages from Current User**: Fixed AI generating messages from "YourNickname" when it shouldn't exist
  - **Root Cause**: Channels contained users with old nickname "YourNickname" instead of the actual saved nickname
  - **Solution**: Added useEffect to update current user nickname in all channels when nickname changes
  - **Implementation**: Automatically replaces DEFAULT_NICKNAME and "YourNickname" with actual currentUserNickname in channel users
  - **Debug Logging**: Added console logging to track current user nickname and channel users during simulation
  - **Impact**: AI will never generate messages from the current user, ensuring proper separation between human and AI interactions
- **IRC Commands Support**: Fixed and enhanced common IRC command support
  - **Fixed /me Command**: Moved /me command handling from handleSendMessage to handleCommand for proper structure
  - **Added /join Command**: Join existing channels or create new ones with /join #channelname
  - **Added /part Command**: Leave current channel with optional reason using /part [reason]
  - **Added /nick Command**: Change nickname with /nick newnickname, includes validation and conflict checking
  - **Enhanced /help Command**: Updated help to show all available commands with usage examples
  - **Command Structure**: All commands now properly handled in handleCommand function with consistent error messages
  - **Impact**: Full IRC-like command experience with proper validation and user feedback
- **User List Update Timing**: Fixed user list not updating immediately when users are added/removed
  - **Root Cause**: Join message creation logic was using old channel data instead of updated channel data
  - **Solution**: Fixed handleUsersChange to properly compare old vs new channel state for join messages
  - **Implementation**: Updated join message logic to check if user is now in channel but wasn't before
  - **Debug Logging**: Added comprehensive debug logging to track user list updates and channel changes
  - **Impact**: User list now updates immediately when users are added or removed from channels
- **React Key Collision Error**: Fixed "Encountered two children with the same key" error when opening configuration window
  - **Root Cause**: UserManagement component was receiving duplicate users with same nickname, causing React key collisions
  - **Solution**: Added deduplication logic in UserManagement to filter out duplicate users before rendering
  - **Implementation**: Created uniqueUsers array by filtering duplicates based on nickname, used for display only
  - **Debug Logging**: Added console warnings to detect and log duplicate user issues
  - **Impact**: Configuration window opens without React errors, user list displays correctly without duplicates
- **Simulation User Selection Bug**: Fixed same user generating multiple messages in a row
  - **Root Cause**: User selection logic had low probability (30%) of avoiding recent speakers, allowing same user to be selected repeatedly
  - **Solution**: Improved user selection algorithm with stronger avoidance of recent speakers and last message author
  - **Implementation**: Increased probability to 80% for less active users, added last speaker avoidance, reduced recent speaker window to 3 messages
  - **Debug Logging**: Added comprehensive logging to track user selection patterns and recent speakers
  - **Impact**: More natural conversation flow with better user rotation, prevents single user from dominating the conversation
- **Simulation User Participation Balance**: Fixed issue where only a few users were talking by rebalancing user selection algorithm
  - **Root Cause**: Previous fix was too restrictive (80% probability for less active users), preventing many users from participating
  - **Solution**: Rebalanced user selection with layered approach prioritizing long-term inactive users while allowing all users to participate
  - **Implementation**: Added long-term inactive users filter (last 10 messages), reduced short-term probability to 50%, added 70% priority for long-term inactive users
  - **Debug Logging**: Enhanced logging to show long-term inactive users and selection reasoning
  - **Impact**: More balanced participation with all users getting opportunities to speak while still preventing immediate repetition
- **Chat Log Manager Button Visibility**: Fixed buttons disappearing when chat log window opens
  - **Root Cause**: Buttons were being disabled when no channel was selected or during loading, appearing to "disappear" when grayed out
  - **Solution**: Enhanced button state management and added proper tooltips to explain disabled states
  - **Implementation**: Added debug logging for button rendering, improved disabled state logic, added tooltips for user feedback
  - **Debug Logging**: Added comprehensive logging to track button rendering state and channel selection
  - **Impact**: Buttons remain visible and provide clear feedback about their state, improving user experience
- **Chat Log Manager Button Flashing**: Fixed buttons flashing and disappearing when selecting channels
  - **Root Cause**: `loadMessages` function was setting `isLoading` to true every time a channel was selected, causing buttons to be disabled and appear to flash
  - **Solution**: Removed unnecessary loading state from message loading to prevent button flashing during channel selection
  - **Implementation**: Modified `loadMessages` to not set `isLoading` state, added debug logging to track message loading
  - **Debug Logging**: Enhanced logging to show message loading progress and button state changes
  - **Impact**: Smooth channel selection without button flashing, better user experience
- **Chat Log Manager Button Visibility**: Fixed buttons remaining hidden after initial load
  - **Root Cause**: Buttons were dependent on `isLoading` state which could get stuck or have timing issues, causing buttons to remain disabled
  - **Solution**: Added `isInitialized` state to track when initial data loading is complete, separate from ongoing loading operations
  - **Implementation**: Added `isInitialized` state, updated button disabled logic to use `!isInitialized` instead of `isLoading`, improved tooltips
  - **Debug Logging**: Enhanced logging to show initialization state and button rendering conditions
  - **Impact**: Buttons are visible and functional once data is loaded, better state management
- **Simulation Greeting Spam Bug**: Fixed users getting stuck spamming greetings
  - **Root Cause**: Greeting detection was too restrictive, allowing users to repeatedly generate greeting messages without being caught by repetition detection
  - **Solution**: Enhanced greeting detection with comprehensive patterns and added anti-greeting spam protection
  - **Implementation**: Expanded greeting phrase detection, added user-specific greeting count tracking, implemented anti-greeting spam prompts for both channel activity and reactions
  - **Debug Logging**: Added logging to track user greeting counts and anti-spam activation
  - **Impact**: Prevents users from getting stuck in greeting loops, more natural conversation flow
- **Multilingual Greeting Detection**: Enhanced greeting spam protection to work with multiple languages
  - **Root Cause**: Greeting detection only worked for English greetings, allowing users speaking other languages to spam greetings without detection
  - **Solution**: Added comprehensive multilingual greeting detection covering 16+ languages
  - **Implementation**: Expanded greeting phrase lists and regex patterns for Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Russian, Arabic, Korean, Dutch, Swedish, Norwegian, Danish, and Finnish
  - **Languages Supported**: English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese, Russian, Arabic, Korean, Dutch, Swedish, Norwegian, Danish, Finnish
  - **Impact**: Prevents greeting spam in any supported language, more natural multilingual conversations
- **Enhanced AI Time Awareness**: Made AI more contextually aware of current season, date, month, and year
  - **Root Cause**: AI conversations lacked seasonal and temporal context, making them feel disconnected from real-world timing
  - **Solution**: Enhanced time context system with comprehensive seasonal, date, and holiday awareness
  - **Implementation**: Enhanced `getTimeOfDayContext` function with season detection, date awareness, holiday recognition, and seasonal topic suggestions
  - **Features**: Season-based context (spring, summer, autumn, winter), holiday awareness (Christmas, New Year, Valentine's Day, etc.), seasonal topics, and date-specific social context
  - **Impact**: More realistic and contextually relevant conversations that reflect current time, season, and special occasions

## 1.13.16 - 2025-01-23

### Added
- **Lightweight Chat Log Database**: Complete IndexedDB-based chat log storage system
  - **Persistent Storage**: All channel messages automatically saved to browser database
  - **Chat Log Manager**: Full-featured UI for viewing, managing, and exporting chat logs
  - **Channel Statistics**: Message counts, activity tracking, and storage usage monitoring
  - **Export Functionality**: Export chat logs as JSON files for backup or analysis
  - **Storage Management**: Clear individual channels or all logs with confirmation dialogs
  - **Search & Filter**: Browse messages by channel with pagination and filtering
  - **Mobile Compatible**: Responsive design works on all device sizes
  - **Performance Optimized**: Efficient storage with automatic cleanup and indexing

### Enhanced
- **Mobile Device Browser Compatibility**: Comprehensive mobile responsiveness improvements
  - **Mobile Layout Fix**: Fixed chat window visibility on mobile with proper height constraints
  - **Mobile Channel Selection**: Fixed channel selection on mobile with increased sidebar heights
  - **Compact Sidebars**: Channel list (192px) and user list (128px) use fixed heights on mobile
  - **Mobile-Optimized Buttons**: Smaller, more compact buttons with better touch targets
  - **Chat Window Priority**: Chat window takes up remaining space on mobile for better usability
  - **Touch-Friendly Interface**: Larger touch targets (44px minimum) and improved button spacing
  - **Mobile-Optimized Typography**: Smaller text sizes on mobile with proper scaling
  - **Flexible Panels**: Channel list, chat window, and user list stack vertically on mobile
  - **Improved Input Fields**: Mobile-optimized text inputs with proper font sizing
  - **Touch Interactions**: Added `touch-manipulation` CSS for better touch response
  - **Mobile CSS**: Prevented zoom on input focus and improved scrolling behavior
  - **Responsive Modals**: Settings modal adapts to mobile screens with proper padding
  - **Grid Layouts**: Radio buttons and form elements use responsive grid layouts
  - **Message Display**: Optimized message spacing and text wrapping for mobile screens

## 1.13.15 - 2025-01-21

### Enhanced
- **Mobile Device Browser Compatibility**: Comprehensive mobile responsiveness improvements
  - **Responsive Layout**: Main layout switches from horizontal to vertical on mobile devices
  - **Mobile Layout Fix**: Fixed chat window visibility on mobile with proper height constraints
  - **Mobile Channel Selection**: Fixed channel selection on mobile with increased sidebar heights
  - **Compact Sidebars**: Channel list (192px) and user list (128px) use fixed heights on mobile
  - **Mobile-Optimized Buttons**: Smaller, more compact buttons with better touch targets
  - **Chat Window Priority**: Chat window takes up remaining space on mobile for better usability
  - **Touch-Friendly Interface**: Larger touch targets (44px minimum) and improved button spacing
  - **Mobile-Optimized Typography**: Smaller text sizes on mobile with proper scaling
  - **Flexible Panels**: Channel list, chat window, and user list stack vertically on mobile
  - **Improved Input Fields**: Mobile-optimized text inputs with proper font sizing
  - **Touch Interactions**: Added `touch-manipulation` CSS for better touch response
  - **Mobile CSS**: Prevented zoom on input focus and improved scrolling behavior
  - **Responsive Modals**: Settings modal adapts to mobile screens with proper padding
  - **Grid Layouts**: Radio buttons and form elements use responsive grid layouts
  - **Message Display**: Optimized message spacing and text wrapping for mobile screens

## 1.13.14 - 2025-01-21

### Added
- **IRC Topic Command Support**: Complete `/topic` command implementation
  - **Topic Management**: `/topic` to view current topic, `/topic <new topic>` to change it
  - **Operator Permissions**: Only channel operators can change topics (realistic IRC behavior)
  - **Auto-Operator Assignment**: Current user automatically becomes operator of all channels
  - **AI Reactions**: Virtual users react to topic changes with contextual responses
  - **Help Command**: Added `/help` command showing available commands
  - **Visual Feedback**: Topic changes display as purple "Topic changed by..." messages

### Fixed
- **User Management UI Alignment**: Fixed accent field misalignment in user cards
  - **Consistent Grid Layout**: Accent field now always appears in same position (bottom-left)
  - **Always Visible**: Shows "None" when no accents instead of hiding the field
  - **Perfect Alignment**: All user cards now have identical 2x2 field layout
  - **Better UX**: Predictable field positions regardless of data presence

- **Very Terse Message Truncation**: Fixed AI messages being cut off for terse users
  - **Increased Token Limits**: Doubled token limits for all verbosity levels
    - `very_terse`: 50 → 100 tokens
    - `terse`: 75 → 150 tokens  
    - `neutral`: 100 → 200 tokens
    - `verbose`: 300 → 400 tokens
    - `very_verbose`: 500 → 600 tokens
  - **Improved Prompts**: Enhanced AI instructions for complete but brief messages
  - **Better Balance**: Ensures terse users generate complete, meaningful responses

- **Mass Add Users Language Skills Display**: Fixed "object Object" showing in language skills
  - **Format Conversion**: Fixed legacy format to per-language format conversion in batch generation
  - **Template Compatibility**: All personality templates now use correct per-language format
  - **Randomization Fix**: Language and accent randomization now uses proper format structure
  - **Type Safety**: Added proper type guards and format detection
  - **Display Accuracy**: Language skills now show correctly (e.g., "English (native), Finnish (intermediate)")

- **React Key Collision Error**: Fixed duplicate message IDs when adding users dynamically
  - **Unique ID Generator**: Implemented counter-based unique message ID generation
  - **Collision Prevention**: Eliminated duplicate keys that caused React runtime errors
  - **Join/Part Messages**: Fixed ID generation for user join and part messages
  - **Thread Safety**: Used useRef for consistent counter state across renders
  - **React Compliance**: All message keys now guaranteed unique for proper component identity

- **Build Configuration Error**: Fixed missing file reference in vite.config.ts
  - **Removed Invalid Reference**: Removed reference to non-existent `ircCommands.ts` file
  - **Build Success**: Production builds now complete without errors
  - **Chunk Optimization**: Maintained proper code splitting configuration

### Enhanced
- **Chat Simulation Anti-Repetition System**: Comprehensive conversation diversity improvements
  - **Repetition Detection**: Automatically detects repetitive 2-4 word phrases in recent messages
  - **Enhanced Diversity Prompts**: Increased from 50% to 90% chance of diversity prompts
  - **7 New Prompt Types**: New topics, questions, stories, observations, mood changes, humor, natural conversation
  - **Repetition Avoidance**: AI receives explicit instructions to avoid detected repetitive phrases
  - **Topic Evolution Warnings**: AI warned when conversations become stale or repetitive
  - **Conversation State Tracking**: System tracks patterns and suggests topic changes when needed
  - **Extended Message History**: Increased context from 15 to 20 messages for better AI understanding
  - **Smart Topic Suggestions**: System messages suggest fresh topics when conversations get repetitive

- **Dynamic User Management**: Real-time user addition without simulation interruption
  - **No Simulation Reset**: Users can be added/removed while simulation continues running
  - **Automatic Channel Joining**: New users automatically join all channels when created
  - **Join/Part Messages**: Real-time join and part messages when users are added/removed
  - **AI Greetings**: Existing users automatically welcome new users with contextual greetings
  - **State Synchronization**: Virtual users and channel users stay perfectly synchronized
  - **Visual Feedback**: Users see join/part activity in real-time
  - **Seamless Integration**: New users immediately start participating in conversations

### Technical Improvements
- **Command System**: Robust IRC command parsing with proper argument handling
- **Topic Persistence**: Channel topics are saved and displayed in channel headers
- **Error Handling**: Clear error messages for invalid command usage
- **AI Integration**: Topic changes trigger natural AI reactions with random delays
- **UI Consistency**: Fixed grid layout issues for better visual alignment
- **Conversation Analysis**: Real-time phrase pattern detection and repetition prevention
- **Diversity Injection**: Enhanced AI prompt system with higher variety rates

## 1.13.13 - 2025-01-21

### Fixed
- **Message Count Preservation**: Fixed conversation reset mechanism that was too aggressive
  - **Reset Frequency**: Changed from every 10-15 minutes to every 2-3 hours
  - **Message Retention**: Increased from 3 messages to 100 messages during reset
  - **Long-term Simulation**: Messages now persist much longer during extended simulation runs
  - **Better Balance**: Maintains conversation diversity while preserving message history

### Technical Improvements
- **Conversation Reset Logic**: Much less frequent and more conservative message trimming
- **Debug Logging**: Enhanced logging for conversation reset decisions
- **Performance**: Reduced unnecessary message clearing operations

## 1.13.12 - 2025-01-21

### Added
- **Time-of-Day Synchronization**: Complete time-based simulation behavior
  - **Real-time Context**: AI prompts now include current time, day of week, and social context
  - **Time-Appropriate Topics**: Conversations adapt to time of day (morning coffee, evening plans, late-night thoughts)
  - **Energy Level Matching**: Message tone and energy match the time period
  - **Weekend Awareness**: Different behavior patterns for weekends vs weekdays
  - **Smart User Selection**: Time-based user filtering (energetic users in morning, introspective at night)
  - **Dynamic Simulation Frequency**: More active during peak hours (17-21), quieter at night
  - **5 Time Periods**: Morning (6-12), Afternoon (12-17), Evening (17-21), Late Evening (21-24), Late Night (0-6)

### Technical Improvements
- **Time Context Generation**: Automatic detection of time periods and social contexts
- **User Activity Patterns**: Personality-based user selection for different times of day
- **Frequency Adjustment**: Simulation speed adapts to natural human activity patterns
- **Debug Logging**: Comprehensive time-based decision tracking
- **Performance Optimized**: Minimal overhead for time calculations

## 1.13.11 - 2025-01-21

### Fixed
- **User List Personality Display**: Fixed settings modal not showing correct personality settings
  - **State Synchronization**: Added useEffect to update user list when currentUsers prop changes
  - **Real-time Updates**: Settings modal now reflects current app state immediately
  - **Data Flow**: Improved user data flow between main app and settings modal

- **Import/Export Writing Styles**: Fixed writing style settings not being imported correctly
  - **CSV Format**: Updated to handle new per-language format for language skills
  - **JSON Import**: Enhanced to detect and preserve Station V format vs World Editor format
  - **Format Compatibility**: Added backward compatibility for legacy data formats
  - **Writing Style Preservation**: All humor, emoji usage, formality, and verbosity settings now persist

- **Very Verbose Message Cutoffs**: Fixed very verbose users getting cut off messages
  - **Token Limits**: Increased very_verbose from 300 to 500 tokens, verbose from 200 to 300 tokens
  - **Enhanced Prompts**: Added explicit instructions for message length expectations
  - **Cutoff Prevention**: Added "Do not cut off the message" warnings for verbose users
  - **Debug Logging**: Added token limit tracking for better debugging

### Added
- **Channel Log Export UI**: Added prominent channel log export functionality
  - **Export Button**: Added green "Export Logs" button in channel management section
  - **Cross-Component Integration**: Channel management button opens user management export modal
  - **Modal Improvements**: Enhanced export modal title and description for clarity
  - **Multiple Export Options**: Export all channels or individual channels as HTML files

### Technical Improvements
- **Token Limit Optimization**: Dynamic token limits based on user verbosity settings
- **Prompt Engineering**: Enhanced AI prompts with explicit length and style instructions
- **Event System**: Custom event system for cross-component communication
- **Debug Logging**: Added comprehensive logging for token limits and user selection

## 1.13.10 - 2025-01-21

### Fixed
- **User Language Editing Persistence**: Fixed hand-edited user language changes not being saved
  - **Configuration System**: Added userObjects field to AppConfig for full user data persistence
  - **Settings Modal**: Enhanced to save both text format and full user objects
  - **Backward Compatibility**: Maintained support for existing text-based configurations
  - **Language Skills**: All user language skills, fluency levels, and accents now persist properly
  - **Writing Styles**: User writing style preferences are preserved across sessions

### Added
- **Channel Dominant Language Setting**: Added ability to set explicit dominant language for channels
  - **UI Controls**: Added dominant language dropdown to channel management interface
  - **Channel Creation**: Added dominant language field to channel creation modal
  - **Language Override**: Channels can override automatic language detection with explicit settings
  - **Configuration Persistence**: Channel dominant language settings persist across page reloads

- **Language Selector Dropdown**: Enhanced user editor with comprehensive language selection
  - **25+ Languages**: Added dropdown with Finnish, English, Spanish, French, German, and many more
  - **User-Friendly Interface**: Replaced text input with easy-to-use dropdown selector
  - **Custom Languages**: Added "Other" option for languages not in the list
  - **Smart Placeholders**: Dynamic placeholder text based on language selection
  - **Default Values**: New languages default to English for better user experience

### Technical Improvements
- **AI Language Compliance**: Enhanced AI service to respect explicit channel language settings
- **Language-Aware User Selection**: AI prioritizes users whose primary language matches channel's dominant language
- **Enhanced Prompts**: Added explicit language instructions to all AI generation functions
- **Configuration Format**: Extended text format to support dominant language: `"#channel, topic | language"`
- **Data Persistence**: Full user objects stored alongside text format for complete data preservation

## 1.13.9 - 2025-01-21

### Fixed
- **AI Language Simulation Issues**: Fixed AI users not respecting their configured language settings
  - **Language Compliance**: AI now properly responds in user's primary language (e.g., Finnish users speak Finnish)
  - **System Instructions**: Enhanced base system instructions with explicit language requirements
  - **Prompt Enhancement**: Added "CRITICAL: Respond ONLY in [language]" instructions to all AI prompts
  - **Channel Language Context**: Added analysis of channel's dominant language for better context
  - **Multilingual Support**: Improved support for users with multiple languages by using primary language
  - **Consistency Across Interactions**: Applied language constraints to channel activity, reactions, and private messages

### Technical Improvements
- **Language Detection**: Enhanced primary language detection from user language skills
- **Channel Analysis**: Added dominant language analysis for better AI context
- **Prompt Engineering**: Improved AI prompt structure with explicit language constraints
- **Realistic Simulation**: More authentic multilingual chat experiences

## 1.13.8 - 2025-01-21

### Fixed
- **Production Build Randomization Issues**: Fixed multiple critical issues with "Randomize World" functionality in production builds
  - **Response Structure Parsing**: Fixed parsing of new Gemini API response format (candidates[0].content.parts[0].text)
  - **JSON Truncation Handling**: Increased token limits from 1000 to 4000 and added JSON repair logic for truncated responses
  - **Channel List Refresh**: Fixed channel list not updating after randomization due to state synchronization issues
  - **Undefined Property Errors**: Added null checks for channel.users property access in UserManagement component
  - **Channel Initialization**: Properly initialize randomized channels with required users, messages, and operators properties
  - **Fallback Configuration**: Enhanced fallback system to provide working configuration when AI service fails
  - **Error Handling**: Added comprehensive error handling and debugging logs for production troubleshooting

### Technical Improvements
- **API Compatibility**: Updated to handle both old and new Google GenAI response formats
- **Data Structure Validation**: Ensured all randomized data structures match application expectations
- **State Management**: Fixed component state synchronization between SettingsModal and main application
- **Debug Logging**: Added detailed logging for production debugging and error diagnosis

## 1.13.7 - 2025-01-20

### Fixed
- **Settings Save Issue**: Fixed operator assignments being reset when pressing "Save" in settings
  - **Config Preservation**: Settings save now preserves current channels with operator assignments
  - **Operator Persistence**: Added localStorage persistence for operator assignments across app restarts
  - **Real-time Updates**: Operator changes are immediately visible and persist when settings are saved
  - **No More Reset**: Pressing "Save" no longer resets operator status to regular users

## 1.13.6 - 2025-01-20

### Fixed
- **Real-time Operator Updates**: Fixed channel operator assignments not being reflected immediately in the user list
  - **Live Updates**: Channel operator changes in settings now update the main app in real-time
  - **State Synchronization**: Added callback to sync channel changes between settings modal and main app
  - **Active Context Preservation**: Settings save now preserves active channel context when possible
  - **Immediate Feedback**: Operator status changes are now visible immediately without needing to save settings

## 1.13.5 - 2025-01-20

### Fixed
- **UserList Import Error**: Fixed "isChannelOperator is not defined" error when clicking on channels
  - **Import Fix**: Changed from type import to function import for isChannelOperator
  - **Function vs Type**: isChannelOperator is a utility function, not a type

## 1.13.4 - 2025-01-20

### Fixed
- **Operator Utility Functions**: Fixed "can't access property 'includes', channel.operators is undefined" error in operator utility functions
  - **isChannelOperator**: Now safely handles undefined operators property
  - **addChannelOperator**: Uses fallback for undefined operators
  - **removeChannelOperator**: Uses fallback for undefined operators
  - **canUserPerformAction**: Inherits safe behavior from isChannelOperator

## 1.13.3 - 2025-01-20

### Fixed
- **Channel Operators Error**: Fixed "can't access property 'length', channel.operators is undefined" error
  - **Backward Compatibility**: Added migration for existing channels without operators property
  - **Defensive Programming**: Added null checks for operators property in all components
  - **Safe Access**: All operator-related code now uses `(channel.operators || [])` pattern

## 1.13.2 - 2025-01-20

### Added
- **Channel Operator Management**: Added comprehensive operator management in the settings/channel management interface
  - **Visual Operator Display**: See all channel operators with @nickname badges
  - **Add Operators**: Dropdown to assign any user as a channel operator
  - **Remove Operators**: Click × button to remove operator privileges
  - **Operator Count**: Shows number of operators per channel
  - **Per-Channel Management**: Each channel can have different operators

## 1.13.1 - 2025-01-20

### Fixed
- **User Management Display**: Fixed language skills display showing "[object Object]" instead of proper language names
- **Per-Language Format**: Enhanced user management to properly display per-language fluency levels and accents
- **Data Migration**: Improved handling of malformed language skills data during import/export

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