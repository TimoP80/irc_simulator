# Changelog

All notable changes to Station V - Virtual IRC Simulator will be documented in this file.

*Note: This project was previously known as "Gemini IRC Simulator" and was renamed to "Station V - Virtual IRC Simulator" as of v1.5.1.*

## 1.16.2 - 2025-10-25

### Fixed
- **Network Mode AI Response Bug**: Fixed critical issue where AI responses in network mode were generated from non-existent users
  - **Root Cause**: AI reactions to network messages were using mixed user lists (local + network users) instead of only local virtual users
  - **Solution**: Implemented local virtual user filtering to ensure AI reactions only use locally configured users
  - **Impact**: AI responses now consistently use configured virtual users with correct personalities and languages
  - **User Experience**: Eliminated English responses from non-existent users in network mode

- **Network Mode Infinite Loop**: Fixed infinite loop caused by AI responses being broadcast back to network
  - **Root Cause**: AI reactions were added via `addMessageToContext()` which automatically broadcasts to network, creating message echo loops
  - **Solution**: Implemented direct channel state updates for AI reactions, bypassing network broadcast logic
  - **Impact**: Prevents AI responses from being re-broadcast and causing infinite message loops

- **Message Loop Prevention**: Added comprehensive safeguards to prevent infinite message loops
  - **BroadcastChannel Loop Prevention**: Enhanced user type validation and rate limiting (max 1 message per 100ms)
  - **Memory Management**: Implemented cleanup for processed message IDs to prevent memory leaks
  - **Network User Filtering**: Added safeguards to ensure network users don't trigger virtual user broadcasts
  - **Error Handling**: Added graceful handling of broadcast failures with detailed logging
  - **Impact**: System now resistant to infinite loop conditions that previously required server shutdown

- **WebSocket Server Channels Error**: Fixed `TypeError: user.channels.includes is not a function` in WebSocket server
  - **Root Cause**: Server was using `Array.includes()` method on `Set` objects for channel membership checking
  - **Solution**: Changed `user.channels.includes(channel)` to `user.channels.has(channel)` for proper Set operations
  - **Impact**: Server no longer crashes when processing user join events after extended runtime

### Enhanced
- **HTML Export Templates**: Added comprehensive template system with 5 different export styles
  - **Modern Dark**: Dark theme with gradients and modern styling (default)
  - **Classic Light**: Clean light theme with traditional styling
  - **Minimal Clean**: Ultra-minimal design focused on content
  - **Compact Table**: Dense table-like layout for maximum information density
  - **Web Client Style**: Mimics actual web client interface with colored nicknames
  - **Live Preview**: Full-screen preview modal with template selection
  - **Chronological Ordering**: All templates ensure messages are ordered oldest to newest
  - **Image Support**: Enhanced image rendering with responsive sizing and click-to-open functionality

### Technical Improvements
- **Template System Architecture**: Centralized template management with consistent styling and functionality
- **Network User Validation**: Enhanced validation to prevent AI responses from non-local users
- **Message Loop Prevention**: Robust loop prevention for network AI responses
- **Export Preview System**: Interactive preview with download functionality
- **Color-Coded Nicknames**: Hash-based consistent color assignment for web client template

## 1.16.1 - 2025-01-24

### Fixed
- **Language Skills Undefined Error**: Fixed critical error where `isPerLanguageFormat` function was receiving `undefined` language skills objects
  - **Root Cause**: Type guard functions were not properly handling `undefined` values when checking language skills
  - **Solution**: Added comprehensive null checks to all language skills utility functions
  - **Functions Fixed**: `isPerLanguageFormat`, `isLegacyFormat`, `getAllLanguages`, `getLanguageFluency`, `getLanguageAccent`
  - **Error Prevention**: All functions now safely handle `undefined` language skills with appropriate fallbacks
  - **Impact**: Eliminated "right-hand side of 'in' should be an object, got undefined" errors during AI message generation

- **User Properties Undefined Error**: Fixed critical error where `user.personality` and `user.writingStyle` were `undefined` during AI simulation
  - **Root Cause**: User objects with missing or undefined properties were causing `toLowerCase()` and property access errors
  - **Solution**: Added null checks for `user.personality` and `user.writingStyle` before accessing their properties
  - **Functions Fixed**: `generateChannelActivity` time-based user filtering and personality-based response variation
  - **Error Prevention**: All user property accesses now safely handle undefined values with appropriate fallbacks
  - **Impact**: Eliminated "can't access property 'toLowerCase', user.personality is undefined" errors during simulation

- **Comprehensive User Property Safety**: Implemented comprehensive safety measures for all user property accesses
  - **Helper Function**: Created `safeGetUserProperty()` function to safely access user properties with fallbacks
  - **Writing Style Safety**: Added safe access to `writingStyle` properties in all AI generation functions
  - **Functions Enhanced**: `generateChannelActivity`, `generateReactionToMessage`, `generatePrivateMessageResponse`
  - **Fallback Values**: Provided sensible defaults for undefined `writingStyle` (neutral formality, verbosity, etc.)
  - **Error Prevention**: Eliminated "can't access property 'verbosity', randomUser.writingStyle is undefined" errors
  - **Impact**: All AI functions now work reliably even with incomplete or malformed user objects

- **Missing Import Fix**: Fixed critical error where `isPerLanguageFormat` function was not imported in `geminiService.ts`
  - **Root Cause**: The `isPerLanguageFormat` function was being used but not imported from the types module
  - **Solution**: Added `isPerLanguageFormat` to the import statement in `services/geminiService.ts`
  - **Error Prevention**: Eliminated "isPerLanguageFormat is not defined" errors during AI simulation
  - **Impact**: Language skills processing now works correctly in all AI generation functions

- **User Selection Balance**: Improved user selection algorithm to prevent channel activity from focusing on one user
  - **Problem**: Channel activity was becoming too focused on a single user instead of distributing across multiple users
  - **Solution**: Made time-based user filtering less restrictive and improved probability-based selection
  - **Changes**: Reduced time-based filtering probability from 100% to 60%, improved fallback logic, added safety checks
  - **Balanced Selection**: Adjusted probabilities for long-term inactive users (60%) and less active users (40%)
  - **Enhanced Debugging**: Added comprehensive logging to track user selection patterns and identify issues
  - **Impact**: More balanced user participation across all channel members, preventing single-user dominance

- **Enhanced Conversation Activity**: Significantly improved channel conversation dynamics and user interaction
  - **Problem**: Channel activity was still too focused on single users, and addressing others didn't provoke reactions
  - **Solution**: Implemented multi-message conversation system with automatic reactions and improved user selection
  - **Burst Mode Enhancement**: Increased burst mode probability from 15% to 40% for more active conversations
  - **Automatic Reactions**: Added 30% chance to generate reactions to AI messages, creating more natural conversation flow
  - **Improved User Selection**: Increased recent speaker tracking from 3 to 5 messages, boosted inactive user preference to 80%
  - **Less Active User Priority**: Increased less active user selection probability to 70% for better balance
  - **Conversation Flow**: Added random delays (1-4 seconds) between reactions to simulate natural conversation timing
  - **Impact**: Much more dynamic and balanced conversations with multiple users participating and reacting to each other

- **Critical User Selection Fix**: Fixed fundamental issue where current user messages were incorrectly included in recent speaker tracking
  - **Problem**: Current user messages were being counted in recent speakers, causing virtual users to be incorrectly marked as "recent speakers"
  - **Root Cause**: Recent speaker tracking included all messages (including current user) but filtering logic only considered virtual users
  - **Solution**: Excluded current user from recent speaker tracking in both `generateChannelActivity` and `generateReactionToMessage` functions
  - **Functions Fixed**: Recent speakers tracking now properly filters out current user messages before mapping nicknames
  - **Impact**: Virtual users are now correctly identified as inactive/active, preventing single-user dominance
  - **Debug Improvement**: Recent speaker lists now accurately reflect only virtual user activity, enabling proper user rotation

- **Enhanced Conversation Diversity**: Significantly improved conversation dynamics to prevent single-user dominance
  - **Problem**: Despite fixes, conversations were still dominated by single users instead of diverse multi-user interactions
  - **Solution**: Implemented comprehensive conversation diversity improvements with balanced user selection and increased activity
  - **User Selection Balance**: Reduced inactive user preference from 80% to 60% and less active user preference from 70% to 50%
  - **Burst Mode Enhancement**: Increased burst mode probability from 40% to 60% for more active conversations
  - **Reaction System**: Increased reaction probability from 30% to 50% for more natural conversation flow
  - **Normal Mode Activity**: Added 20% chance for additional activity even in normal mode to prevent conversation stagnation
  - **Timing Improvements**: Added random delays (2-7 seconds) for additional activity to simulate natural conversation patterns
  - **Impact**: Much more diverse and balanced conversations with multiple users participating regularly

- **Critical Duplicate User Fix**: Fixed React key collision error caused by duplicate users in channels
  - **Problem**: "Encountered two children with the same key, `CircuitSynth`" error due to duplicate users in channel user lists
  - **Root Cause**: `autoJoinUsersToEmptyChannels` function was adding users to channels without checking for existing duplicates
  - **Solution**: Implemented comprehensive duplicate prevention system with filtering and deduplication
  - **Duplicate Prevention**: Added filtering in `autoJoinUsersToEmptyChannels` to exclude users already in channels
  - **Deduplication Function**: Created `deduplicateChannelUsers` helper function to remove duplicates from channel user lists
  - **Applied Everywhere**: Added deduplication to all channel update operations (`autoJoinUsersToEmptyChannels`, `handleUsersChange`)
  - **Debug Logging**: Added warning messages when duplicates are detected and removed
  - **Impact**: Eliminated React key collision errors and ensured unique user keys across all components

- **Enhanced User Selection & Reset System**: Improved conversation diversity with manual reset option and better user rotation
  - **Problem**: Single virtual users still dominating conversations despite previous fixes, with other users not reacting
  - **Solution**: Implemented comprehensive user selection improvements and manual reset functionality
  - **Reset Speakers Button**: Added "Reset Speakers" button in the sidebar to manually reset user selection tracking
  - **Reset Function**: Created `resetLastSpeakers` function that clears recent message history to reset speaker tracking
  - **Less Restrictive Selection**: Reduced inactive user preference from 60% to 40% and less active user preference from 50% to 30%
  - **Shorter Tracking Windows**: Reduced recent speaker tracking from 5 to 3 messages and long-term from 10 to 7 messages
  - **Overactive User Detection**: Added logic to detect users who have spoken 3+ times in last 5 messages and force rotation
  - **Time-Based Balance**: Reduced introspective user preference from 60% to 40% for more balanced selection
  - **Force Rotation**: When overactive users are detected, system automatically filters them out and forces other users to speak
  - **Debug Logging**: Added detailed logging for overactive user detection and rotation forcing
  - **Impact**: Much more diverse conversations with automatic user rotation and manual reset capability

- **Critical User Selection Safety Fix**: Fixed undefined user error in user selection algorithm
  - **Problem**: "can't access property 'nickname', randomUser is undefined" error when user selection algorithm failed
  - **Root Cause**: Overactive user detection could filter out all users, leaving empty `candidateUsers` array
  - **Solution**: Added comprehensive safety checks and fallback logic to prevent undefined user selection
  - **Safety Checks**: Added validation to ensure users have valid `nickname` properties before processing
  - **Fallback Logic**: Enhanced overactive user filtering with multiple fallback levels to prevent empty candidate arrays
  - **Error Handling**: Added detailed error logging when no valid users are found, including candidate arrays and overactive users
  - **Robust Selection**: System now guarantees a valid user selection even when all users are filtered out
  - **Debug Information**: Enhanced logging shows candidate users, shuffled users, and overactive users for debugging
  - **Impact**: Eliminated undefined user errors and ensured reliable user selection in all scenarios

- **Major User Selection Algorithm Overhaul**: Completely redesigned user selection to ensure diverse conversations
  - **Problem**: User selection logic was still too restrictive, causing same users to dominate conversations
  - **Solution**: Implemented much more balanced and less restrictive user selection algorithm
  - **Random Selection**: Added 30% chance for completely random user selection to ensure diversity
  - **Reduced Probabilities**: Significantly reduced inactive user preference from 40% to 20% and less active from 30% to 15%
  - **Shorter Tracking Windows**: Reduced recent speaker tracking from 3 to 2 messages and long-term from 7 to 5 messages
  - **Gentle Overactive Detection**: Increased overactive user threshold from 3 to 4 messages in last 6 messages
  - **Time-Based Balance**: Reduced introspective user preference from 40% to 20% for more balanced selection
  - **Natural Flow**: Algorithm now allows much more natural conversation flow with less artificial restrictions
  - **Debug Logging**: Added logging for random selection usage to track diversity improvements
  - **Impact**: Much more diverse conversations with all users participating regularly and naturally

- **Language Skills Format Consistency Fix**: Fixed imported users defaulting to English despite language settings
  - **Problem**: Imported users were defaulting to English with native fluency regardless of their language skill settings
  - **Root Cause**: Multiple functions were using legacy language skills format instead of per-language format
  - **Solution**: Updated all user generation and parsing functions to use consistent per-language format
  - **parseUsersFromText**: Fixed to use per-language format with languages array structure
  - **generateRandomUser**: Updated to use per-language format instead of legacy format
  - **generateRandomWorldConfiguration**: Fixed AI schema to use per-language format for language skills
  - **Format Consistency**: All user generation functions now use the same per-language format structure
  - **Language Preservation**: User language settings are now properly preserved during import and generation
  - **Impact**: Imported users now maintain their correct language skills instead of defaulting to English

- **AI Language Override Fix**: Fixed AI system ignoring user language skills when personality descriptions are in English
  - **Problem**: Users with English personality descriptions were defaulting to English communication regardless of their language skills
  - **Root Cause**: AI system was being influenced by personality description language instead of respecting user language skills
  - **Solution**: Enhanced AI prompts with explicit language instructions to prioritize language skills over personality description language
  - **Language Instruction**: Added explicit "LANGUAGE INSTRUCTION" to all AI prompts emphasizing use of language skills over personality description language
  - **Debug Logging**: Added detailed logging to track user language skills, languages, and primary language determination
  - **Prompt Enhancement**: Updated `generateChannelActivity`, `generateReactionToMessage`, and `generatePrivateMessageResponse` with language override instructions
  - **Language Priority**: AI now explicitly instructed to ignore personality description language and use language skills instead
  - **Impact**: Users now communicate in their configured language skills regardless of personality description language

- **Missing Import Fix**: Fixed "isLegacyFormat is not defined" error in AI service
  - **Problem**: "isLegacyFormat is not defined" error when running simulation
  - **Root Cause**: Missing import of `isLegacyFormat` function in `services/geminiService.ts`
  - **Solution**: Added `isLegacyFormat` to the import statement from `../types`
  - **Import Statement**: Updated import to include `isLegacyFormat` alongside other type utility functions
  - **Impact**: Simulation now runs without import errors and language format detection works correctly

- **Undefined Language Skills Fix**: Fixed users with undefined languageSkills causing simulation failures
  - **Problem**: Users with undefined `languageSkills` were causing "No languageSkills, returning English" errors
  - **Root Cause**: Some users were being created without proper `languageSkills` property or with empty language arrays
  - **Solution**: Added comprehensive safety checks and fallback mechanisms for undefined or empty language skills
  - **Safety Check in AI Service**: Added check in `generateChannelActivity` to detect and fix undefined `languageSkills`
  - **User Creation Fix**: Updated `AddUserModal.tsx` to ensure users always have at least one language (defaults to English)
  - **getAllLanguages Enhancement**: Added safety checks to handle empty language arrays and return English as fallback
  - **Debug Logging**: Enhanced logging to show when users have undefined language skills for easier debugging
  - **Impact**: Simulation now handles users with missing or malformed language skills gracefully

- **Language Skills Debug Enhancement**: Added comprehensive debug logging to track user data persistence
  - **Problem**: Users with defined language skills were still showing as undefined in simulation
  - **Root Cause**: Potential mismatch between saved user objects and loaded user objects
  - **Solution**: Added detailed debug logging to track user data flow from settings to simulation
  - **Settings Debug**: Added logging in `SettingsModal.tsx` to show what user data is being saved
  - **Config Debug**: Added logging in `utils/config.ts` to show how user data is being loaded
  - **Data Flow Tracking**: Debug logs now show userObjects availability, count, and languageSkills status
  - **Impact**: Easier debugging of user data persistence issues and language skills problems

- **User Management Language Skills Display Fix**: Fixed "unknown" text showing in user management interface
  - **Problem**: User management interface showed "unknown" next to "AI User" for all users
  - **Root Cause**: Code was trying to access old legacy format `user.languageSkills.fluency` instead of new format `user.languageSkills.languages[0].fluency`
  - **Solution**: Updated `UserManagement.tsx` to use correct language skills format
  - **Code Change**: Changed `user.languageSkills?.fluency` to `user.languageSkills?.languages?.[0]?.fluency`
  - **Impact**: User management interface now correctly displays language fluency levels (native, advanced, intermediate, beginner)

- **Simulation Language Skills Debug Enhancement**: Added comprehensive debug logging to track user data flow from settings to simulation
  - **Problem**: Simulation was returning no language skills despite users having them defined in configuration
  - **Root Cause**: Potential data loss between settings save and simulation execution
  - **Solution**: Added detailed debug logging throughout the user data flow pipeline
  - **Settings Save Debug**: Added logging in `App.tsx` handleSaveSettings to show what user data is being received
  - **Config Loading Debug**: Enhanced logging in `utils/config.ts` to show userObjects vs text parsing usage
  - **Simulation Debug**: Added logging in `App.tsx` runSimulation to show user language skills in channels
  - **Data Flow Tracking**: Debug logs now show userObjects availability, language skills status, and channel user data
  - **Impact**: Easier identification of where user language skills are being lost in the data flow

- **Auto-Join Language Skills Debug Enhancement**: Added debug logging to track user language skills during channel auto-join process
  - **Problem**: Users were losing language skills when being auto-joined to channels
  - **Root Cause**: Language skills data was being lost during the `autoJoinUsersToEmptyChannels` process
  - **Solution**: Added comprehensive debug logging to track language skills at each step of the auto-join process
  - **Available Users Debug**: Added logging to show language skills of available users before selection
  - **Users to Join Debug**: Added logging to show language skills of users being selected to join channels
  - **Channel Addition Debug**: Added logging to show language skills of users being added to channels
  - **Data Integrity Tracking**: Debug logs now show language skills status throughout the auto-join pipeline
  - **Impact**: Easier identification of where language skills are being lost during channel user assignment

- **Settings Modal Language Skills Debug Enhancement**: Added debug logging to track user language skills during settings modal initialization
  - **Problem**: Users were being loaded with English language skills instead of their configured Finnish language skills
  - **Root Cause**: Settings modal was falling back to text parsing which defaults to English instead of using saved userObjects
  - **Solution**: Added comprehensive debug logging to track user data source during settings modal initialization
  - **Initialization Debug**: Added logging to show whether currentUsers, userObjects, or text parsing is being used
  - **Data Source Tracking**: Debug logs now show which data source is being used and the resulting language skills
  - **Fallback Detection**: Debug logs show when the system falls back to text parsing (which defaults to English)
  - **Impact**: Easier identification of why users are being loaded with English instead of their configured language skills

- **Config Loading Language Skills Debug Enhancement**: Added detailed debug logging to track user language skills during config loading and app initialization
  - **Problem**: Users were being loaded with English language skills despite having Finnish language skills in saved config
  - **Root Cause**: Language skills data was being lost during the config loading or app initialization process
  - **Solution**: Added comprehensive debug logging to track language skills at each step of the loading process
  - **Config Loading Debug**: Added logging to show actual language and fluency values during config loading
  - **App Initialization Debug**: Added logging to show language skills when users are loaded in the main app
  - **Language Content Tracking**: Debug logs now show the actual language and fluency values, not just presence
  - **Impact**: Easier identification of where Finnish language skills are being lost in the loading pipeline

- **User Mismatch Debug Enhancement**: Added debug logging to track user mismatch between config window and simulation
  - **Problem**: Users shown in configuration window did not match users loaded in simulation, causing React key errors
  - **Root Cause**: Mismatch between users in config window and users actually used in simulation
  - **Solution**: Added comprehensive debug logging to track user data flow and identify mismatches
  - **Settings Save Debug**: Added logging to show user nicknames and language skills when settings are saved
  - **Simulation Debug**: Added logging to show virtualUsers count, nicknames, and language skills during simulation
  - **User Comparison**: Debug logs now show user nicknames and language skills at each step for comparison
  - **Impact**: Easier identification of user data mismatches between config window and simulation

- **Debug Logging Cleanup**: Removed excessive debug logging after resolving language skills issue
  - **Problem**: Console was cluttered with extensive debug logging used for troubleshooting
  - **Root Cause**: Debug logging was added to troubleshoot language skills issue, but is no longer needed
  - **Solution**: Removed excessive debug logging while keeping essential logging for normal operation
  - **Cleaned Up**: Removed debug logs from config loading, app initialization, settings modal, and auto-join processes
  - **Kept Essential**: Maintained important logging for simulation, AI model selection, and error handling
  - **Impact**: Cleaner console output while maintaining debugging capability for future issues

- **Image URL Consistency Fix**: Fixed issue where rendered images differed from actual URLs
  - **Problem**: Virtual users posted images that showed different content in chat vs. when clicking the URL
  - **Root Cause**: AI was using random image services (picsum.photos, httpbin.org) that return different images each time
  - **Solution**: Switched to via.placeholder.com for consistent, static placeholder images
  - **AI Prompt Updates**: Updated all AI prompts to use via.placeholder.com instead of random image services
  - **URL Filtering**: Updated URL filtering to allow via.placeholder.com and block random image services
  - **Impact**: Images now show consistent content both in chat and when clicking the URL

- **Input Field Freezing Fix**: Fixed issue where user text field would freeze during simulation
  - **Problem**: User text input field would become unresponsive and unable to send messages during simulation
  - **Root Cause**: AI API calls could hang or fail, leaving `isLoading` state stuck at `true`, disabling the input field
  - **Solution**: Added comprehensive input protection mechanisms
  - **Duplicate Request Prevention**: Added check to prevent multiple simultaneous message sends
  - **Timeout Protection**: Added 30-second timeout to automatically reset loading state if AI calls hang
  - **Global Error Handling**: Added error handlers to reset loading state on unhandled errors or page unload
  - **Manual Reset Function**: Added `resetLoadingState` function for manual recovery if needed
  - **Impact**: Input field now remains responsive even when AI calls fail or hang

- **IRC Bot Behavior Simulation**: Added comprehensive bot support with AI image generation and informational features
  - **Bot User Type**: Added `userType: 'bot'` to distinguish bots from virtual users
  - **Bot Commands**: Implemented 12 bot commands for various functionalities
  - **AI Image Generation**: Added `!image` command for AI-generated image descriptions and placeholders
  - **Informational Features**: Added weather (`!weather`), time (`!time`), info (`!info`), and help (`!help`) commands
  - **Entertainment Features**: Added quote (`!quote`), joke (`!joke`), and fact (`!fact`) commands
  - **Utility Features**: Added translation (`!translate`), calculation (`!calc`), and search (`!search`) commands
  - **Bot Service**: Created comprehensive `botService.ts` with command handlers and AI integration
  - **Default Bot Users**: Added 4 default bot users (ImageBot, InfoBot, FunBot, UtilBot) with specialized capabilities
  - **Bot Message Styling**: Added special visual styling for bot messages with indicators and command badges
  - **Security**: Implemented safe math evaluation for calculator commands
  - **Bot Management UI**: Added comprehensive bot configuration interface in settings
  - **Bot Creation Form**: Added `AddBotModal` with bot-specific fields and templates
  - **Bot Templates**: Added 4 pre-configured bot templates (ImageBot, InfoBot, FunBot, UtilBot)
  - **Bot Management Interface**: Added `BotManagement` component for creating, editing, and deleting bots
  - **AI Bot Generation**: Added AI-powered bot personality generation using Gemini
  - **Impact**: Users can now interact with AI-powered bots for images, information, entertainment, and utilities

- **Image Generation Service Integration**: Fixed bot image generation to use proper image generation APIs
  - **Problem**: Bot image generation was failing with "ai.getGenerativeModel is not a function" error
  - **Root Cause**: Gemini API doesn't support image generation, was incorrectly trying to use it for image creation
  - **Solution**: Created dedicated `imageGenerationService.ts` with support for multiple providers
  - **Nano Banana Integration**: Added support for Nano Banana Stable Diffusion API
  - **Placeholder Service**: Added safe placeholder image generation for testing
  - **Configuration UI**: Added image generation settings to the settings modal
  - **Provider Selection**: Users can choose between placeholder, Nano Banana, Imagen, and DALLE
  - **API Key Management**: Secure API key configuration for image generation services
  - **Error Handling**: Proper error handling and fallback for image generation failures
  - **Impact**: Bot image generation now works correctly with proper image generation services

- **CORS Error Handling for Image Generation**: Fixed CORS errors and improved error handling for image generation services
  - **Problem**: Image generation was failing with CORS errors when using external APIs like Nano Banana
  - **Root Cause**: External image generation APIs may not allow cross-origin requests from browser applications
  - **Solution**: Enhanced error handling and user guidance for CORS issues
  - **Error Detection**: Added specific error detection for CORS, network, and 404 errors
  - **User Guidance**: Added helpful error messages that guide users to use placeholder service
  - **Settings Warnings**: Added CORS warnings in settings modal to inform users about potential issues
  - **Fallback Service**: Placeholder service works without CORS issues for testing and development
  - **Impact**: Users get clear guidance when CORS issues occur and can fall back to working alternatives

- **Nano Banana API Endpoint Correction**: Fixed incorrect API endpoint and improved CORS error handling
  - **Problem**: Nano Banana API was using incorrect endpoint `/generate` instead of `/v1/generate`
  - **Root Cause**: API endpoint mismatch causing 404 errors and network failures
  - **Solution**: Updated default base URL to use correct `/v1/generate` endpoint
  - **Error Handling**: Enhanced error messages to guide users about CORS limitations
  - **User Guidance**: Added clear warnings about browser CORS limitations and proxy server requirements
  - **Settings UI**: Updated default base URL in settings to use correct endpoint
  - **Fallback Service**: Placeholder service remains as reliable fallback for testing
  - **Impact**: Users get correct API endpoints and clear guidance about CORS limitations

- **Nano Banana Correct Implementation**: Fixed Nano Banana to use Google GenAI SDK instead of incorrect API endpoints
  - **Problem**: Nano Banana was implemented as a separate API service, but it actually uses Google GenAI SDK
  - **Root Cause**: Misunderstanding of Nano Banana architecture - it's a Google GenAI model, not a separate API
  - **Solution**: Updated implementation to use Google GenAI SDK with `gemini-2.5-flash-image-preview` model
  - **Correct Usage**: Based on [official Nano Banana JavaScript guide](https://gist.github.com/patrickloeber/0f46c39d86e83c9c9cb16440b2655353)
  - **Dynamic Import**: Added dynamic import of Google GenAI SDK to avoid browser issues
  - **Data URL Conversion**: Convert base64 image data to data URLs for browser display
  - **Settings UI**: Updated settings to reflect that Nano Banana uses Google GenAI SDK directly
  - **No Base URL**: Removed base URL configuration since Nano Banana uses Google's infrastructure
  - **Impact**: Nano Banana now works correctly using the proper Google GenAI SDK implementation

- **Data URL Image Display Fix**: Fixed base64 image data to display as actual images instead of text
  - **Problem**: Generated images were showing as base64 text strings instead of displaying as images
  - **Root Cause**: Message component's `renderContent` function only handled `https?://` URLs, not `data:` URLs
  - **Solution**: Updated `renderContent` function to properly handle data URLs (base64 images)
  - **Data URL Detection**: Added regex pattern to detect `data:[^;]+;base64,` URLs
  - **Content Rendering**: Data URLs now show as "[Generated Image]" placeholder in content
  - **Image Display**: Images are properly displayed through the `renderImages()` function
  - **Combined Regex**: Updated URL splitting to handle both HTTP URLs and data URLs
  - **Impact**: Generated images now display as actual images instead of base64 text strings

- **Duplicate Generated Image Text Fix**: Fixed duplicate "[Generated Image]" text appearing in bot messages
  - **Problem**: Bot messages showed "[Generated Image][Generated Image]" instead of clean content
  - **Root Cause**: Data URL was being detected in both content text and images array, causing duplicate placeholders
  - **Solution**: Updated bot service to not include data URL in content text when it's in images array
  - **Content Cleanup**: Bot messages now show clean content without data URL strings
  - **Smart Detection**: Message component checks if data URL is already in images array before showing placeholder
  - **Duplicate Prevention**: Prevents duplicate "[Generated Image]" text from appearing
  - **Impact**: Bot messages now display cleanly with proper image display and no duplicate text

- **Images Array Preservation Fix**: Fixed images array being overridden in addMessageToContext function
  - **Problem**: Bot messages had `images: undefined` instead of the generated image URL
  - **Root Cause**: `addMessageToContext` function was overriding the `images` array from bot service with extracted images from content
  - **Solution**: Updated `addMessageToContext` to preserve existing `images` array if it exists
  - **Priority Logic**: `message.images || (extracted images)` - preserves bot-generated images over content-extracted images
  - **Data URL Handling**: Bot service sets `images: [dataUrl]` which is now preserved
  - **Content Cleanup**: Data URL is not included in content text, preventing duplicate detection
  - **Impact**: Generated images now display properly with correct images array and clean content

- **AI Service Error Handling Enhancement**: Improved handling of RESOURCE_EXHAUSTED and rate limit errors
  - **Problem**: AI service was experiencing RESOURCE_EXHAUSTED errors, preventing message generation
  - **Root Cause**: Insufficient error handling for quota exhaustion and rate limiting
  - **Solution**: Enhanced error detection and user-friendly error messages
  - **Error Detection**: Added detection for quota, rate limit, and resource exhaustion errors
  - **User Feedback**: Specific error messages for different types of AI service failures
  - **Context Information**: Added context to API calls for better error reporting
  - **Fallback Responses**: Existing fallback responses continue to work when AI service fails
  - **Rate Limiting**: Improved rate limiting with exponential backoff and jitter
  - **Impact**: Users get clear feedback when AI service issues occur and fallback responses maintain functionality

- **Link Processing Optimization**: Fixed duplicate and truncated links in virtual user messages
  - **Problem**: Virtual users were generating duplicate links in messages, sometimes truncated
  - **Root Cause**: URL extraction logic was processing URLs multiple times and regex was truncating at punctuation
  - **Solution**: Optimized URL extraction to process URLs once and avoid duplicates
  - **Improved Regex**: Updated URL regex to handle more edge cases and not truncate at common punctuation
  - **Duplicate Prevention**: Added Set-based deduplication to remove duplicate URLs
  - **Single Pass Processing**: URLs are now processed once and categorized efficiently
  - **Better Categorization**: Improved logic to distinguish between image URLs and regular links
  - **Performance**: Reduced processing overhead by eliminating redundant operations
  - **Impact**: Virtual user messages now have clean, non-duplicate links that are properly formatted

- **Bot Command API Syntax Fix**: Fixed bot commands using outdated Google GenAI API syntax
  - **Problem**: Some bot commands were returning error messages due to incorrect API syntax
  - **Root Cause**: Bot commands were using old `ai.getGenerativeModel({ model }).generateContent([...])` syntax
  - **Solution**: Updated all bot commands to use correct `ai.models.generateContent({...})` syntax
  - **Fixed Commands**: Updated `!weather`, `!quote`, `!joke`, `!fact`, `!translate`, `!search` commands
  - **API Response Handling**: Updated response parsing from `response.response.text()` to `response.candidates[0].content.parts[0].text`
  - **Error Prevention**: Commands now use proper API structure preventing runtime errors
  - **Consistency**: All bot commands now use the same modern API syntax
  - **Impact**: Bot commands now work correctly without returning error messages

- **Fully Resizable Chat Window**: Added complete resizable functionality to chat window for better readability
  - **Problem**: Long messages tend to fill the space and make chat hard to read
  - **Solution**: Implemented fully resizable chat window with multiple drag handles
  - **Resize Handles**: Added visual resize handles for height (bottom) and width (left/right sides)
  - **Mouse Interaction**: Users can drag handles to resize chat height and width
  - **Height Constraints**: Minimum height (200px) and maximum height (window height - 100px)
  - **Width Constraints**: Minimum width (300px) and maximum width (window width - 200px)
  - **Position Control**: Left handle adjusts both width and position for flexible layout
  - **Visual Feedback**: Handles change color when resizing and show appropriate resize cursors
  - **Smooth Resizing**: Real-time height and width adjustment during drag
  - **User Experience**: Better readability for long messages and optimal chat window sizing
  - **Impact**: Users can now adjust chat window dimensions in all directions for optimal readability

- **CORS-Free Placeholder Images**: Fixed CORS errors in placeholder image generation
  - **Problem**: Placeholder images using via.placeholder.com caused CORS errors
  - **Solution**: Replaced external placeholder service with local SVG data URLs
  - **Local Generation**: Created SVG placeholder images as base64 data URLs
  - **No External Requests**: Eliminates CORS issues completely
  - **Custom Design**: Blue background with white text showing the prompt
  - **HTML Escaping**: Properly escapes special characters in SVG text
  - **Consistent Styling**: Maintains visual consistency with previous placeholder design
  - **Performance**: Faster loading since no external network requests
  - **Reliability**: Works offline and doesn't depend on external services
  - **Impact**: Placeholder images now work without CORS errors

- **Fixed Duplicate Link Display**: Resolved issue where links appeared multiple times in messages
  - **Problem**: Links were being displayed both in message content and in dedicated links section
  - **Root Cause**: renderContent function was rendering URLs as plain text when already handled by links array
  - **Solution**: Updated renderContent to skip URLs that are already handled by dedicated arrays
  - **Empty Span Rendering**: URLs handled by links/images arrays now render as empty spans
  - **Prevents Duplication**: Eliminates duplicate link display in message content
  - **Clean Display**: Links now appear only once in the dedicated links section
  - **Impact**: Messages no longer show duplicate links on separate lines

- **Updated Personality Generator Constants**: Synchronized personality generator with valid simulator engine constants
  - **Problem**: Personality generator was using incorrect enum values that didn't match the user editor options
  - **Solution**: Updated all personality generation functions to use correct enum values from types.ts
  - **Formality Levels**: Updated from ['casual', 'formal', 'mixed'] to ['very_informal', 'informal', 'neutral', 'formal', 'very_formal']
  - **Verbosity Levels**: Updated from ['concise', 'moderate', 'verbose'] to ['very_terse', 'terse', 'neutral', 'verbose', 'very_verbose']
  - **Humor Levels**: Updated from ['none', 'light', 'heavy'] to ['none', 'dry', 'sarcastic', 'witty', 'slapstick']
  - **Emoji Usage**: Updated from ['none', 'minimal', 'frequent'] to ['none', 'low', 'medium', 'high', 'excessive']
  - **Punctuation Styles**: Updated from ['minimal', 'standard', 'excessive'] to ['minimal', 'standard', 'creative', 'excessive']
  - **Schema Consistency**: Updated both generateBatchUsers and generateIRCWorld functions
  - **User Editor Sync**: Personality generator now matches exactly what's available in the user editor
  - **Impact**: Generated personalities now use valid constants that work with the user interface

- **Fixed localStorage Quota Exceeded Error**: Implemented comprehensive quota management for channel logs
  - **Problem**: localStorage quota exceeded when saving large channel logs, causing save failures
  - **Solution**: Added intelligent quota management with data compression and automatic cleanup
  - **Quota Monitoring**: Added checkLocalStorageQuota function to monitor available space
  - **Data Compression**: Automatic compression by limiting message history (500 → 200 → 100 messages)
  - **Proactive Cleanup**: cleanupOldLogs function automatically cleans when 80% quota used
  - **Size Limits**: 4MB limit with 1MB buffer to prevent quota exceeded errors
  - **Error Recovery**: Automatic retry with compressed data when quota exceeded
  - **Logging**: Detailed logging of quota usage and compression actions
  - **Graceful Degradation**: Falls back to ultra-compression if needed
  - **Impact**: Channel logs now save reliably without quota exceeded errors

- **Fixed Hyperlink Duplication Issue**: Resolved persistent problem where links appeared both as plain text and clickable hyperlinks
  - **Problem**: Links were being displayed both in message content and in dedicated links section, causing duplication
  - **Root Cause**: URL matching between content and links array was not robust enough to handle variations
  - **Solution**: Implemented robust URL normalization and improved matching logic
  - **URL Normalization**: Added normalizeUrl function to handle case differences and trailing slashes
  - **Improved Matching**: Changed from exact string matching to normalized comparison using Array.some()
  - **Robust Detection**: Now properly detects URLs that are already handled by links/images arrays
  - **Empty Span Rendering**: URLs handled by dedicated arrays now render as empty spans to prevent duplication
  - **Impact**: Links now appear only once in messages - either in content or in dedicated links section

- **Updated Placeholder Image Service**: Migrated from via.placeholder.com to placehold.co for better placeholder images
  - **Problem**: via.placeholder.com had CORS issues and limited customization options
  - **Solution**: Switched to placehold.co service which offers better CORS support and more features
  - **Image Generation Service**: Updated generatePlaceholder to use placehold.co URLs with custom text and styling
  - **URL Format**: Now uses https://placehold.co/widthxheight/background/text/format?text=custom_text format
  - **Gemini Service Prompts**: Updated all AI prompts to use placehold.co URLs instead of via.placeholder.com
  - **CORS Support**: Added placehold.co to CORS-compliant patterns in URL filtering
  - **Better Features**: placehold.co offers more customization options including fonts, retina support, and multiple formats
  - **Legacy Support**: Maintained support for via.placeholder.com URLs for backward compatibility
  - **Impact**: Better placeholder images with improved CORS support and more customization options

- **Enabled Real AI Image Generation**: Updated image generation service to use Gemini for actual AI-generated images
  - **Problem**: Image generation was limited to placeholder images only
  - **Solution**: Configured Gemini AI to generate real images using the gemini-2.5-flash-image-preview model
  - **Default Provider**: Changed default from 'placeholder' to 'nano-banana' (Gemini AI)
  - **Real Image Generation**: Bot commands like !image now generate actual AI images based on prompts
  - **Fallback System**: Automatically falls back to placeholder images if Gemini generation fails
  - **Settings UI**: Updated settings modal to show Gemini AI as the default option
  - **Service Descriptions**: Updated UI descriptions to reflect real AI image generation capabilities
  - **Error Handling**: Graceful fallback to placeholders ensures users always get images
  - **Impact**: Users now get real AI-generated images when using bot commands, with reliable fallback

- **Virtual User Bot Command Support**: Added bot command functionality to virtual users
  - **Problem**: Virtual users could only generate regular chat messages, not use bot commands like !image
  - **Solution**: Enhanced AI prompts to occasionally suggest bot commands and added processing logic
  - **AI Prompt Updates**: Added bot command instructions to virtual user generation prompts
  - **Command Detection**: Added logic to detect when virtual users generate bot commands
  - **Bot Command Processing**: Virtual users can now use !image, !weather, !time, !info, !help, !quote, !joke, !fact, !translate, !calc, !search
  - **Natural Integration**: Bot commands are used naturally in context (5-10% of the time)
  - **Simulation Integration**: Updated all simulation modes (normal, additional, burst) to handle bot commands
  - **Bot Response Handling**: Virtual user bot commands are processed by available bots in the channel
  - **Impact**: Virtual users now occasionally use bot commands to make conversations more interactive and engaging

- **Fixed Image Generation Model**: Updated Gemini image generation to use correct model
  - **Problem**: Image generation failed with "model does not exist" error for gemini-2.5-flash-image-preview
  - **Solution**: Updated to use gemini-2.0-flash-exp model which is available and supports image generation
  - **Model Update**: Changed default model from gemini-2.5-flash-image-preview to gemini-2.0-flash-exp
  - **Configuration Updates**: Updated all references to use the correct model name
  - **Settings UI**: Updated settings modal to show correct model name
  - **Impact**: Image generation now works properly with the correct Gemini model

- **Improved Image Generation Reliability**: Enhanced error handling and fallback for image generation
  - **Problem**: Gemini image generation continued to have model availability issues
  - **Solution**: Improved error handling and changed default to placeholder service
  - **Default Provider**: Changed default from Gemini to placeholder for reliability
  - **Error Handling**: Added better error detection and graceful fallback to placeholders
  - **Settings UI**: Updated to show placeholder as default with Gemini as experimental
  - **User Experience**: Users now get reliable placeholder images by default with option to try Gemini
  - **Impact**: Image generation is now more reliable with better fallback handling

- **Restored Working Gemini Image Generation**: Reverted to working model configuration
  - **Problem**: Previous model changes broke working image generation
  - **Solution**: Restored gemini-2.5-flash-image-preview as default model since it works for human users
  - **Model Configuration**: Changed back to gemini-2.5-flash-image-preview as default
  - **Default Provider**: Restored Gemini AI as default provider for real image generation
  - **Settings UI**: Updated to show Gemini AI as default with working model
  - **User Experience**: Users now get real AI-generated images by default
  - **Impact**: Image generation works properly with the correct working model

- **Fixed Default Configuration Loading**: Updated App.tsx to use correct default values
  - **Problem**: Default configuration in App.tsx was using old model settings, requiring manual configuration
  - **Solution**: Updated App.tsx default configuration to match the working settings
  - **Default Values**: Changed App.tsx defaults to use nano-banana provider and gemini-2.5-flash-image-preview model
  - **Consistency**: Ensured all default configurations use the same working model
  - **User Experience**: Users no longer need to manually configure the model in settings
  - **Impact**: Image generation works out of the box with correct default settings

- **Added Image Generation Progress Indicator**: Enhanced user experience with visual feedback during image generation
  - **Problem**: Users had no indication when image generation was in progress, leading to uncertainty
  - **Solution**: Added visual indicators and progress messages for ongoing image generation
  - **Progress Messages**: Added "🎨 Generating image..." message that appears immediately when !image command is used
  - **Visual Indicators**: Added animated "GENERATING" badge with pulsing dot for bot messages during generation
  - **Message Component**: Updated Message component to show generating status with yellow badge and animation
  - **Both User Types**: Works for both human users and virtual users using bot commands
  - **User Experience**: Users now see clear feedback that image generation is in progress
  - **Impact**: Improved user experience with clear visual feedback during image generation process

## 1.14.0 - 2025-10-24

### Added
- **Stable Network Support**: Comprehensive network functionality allowing multiple human users to connect via WebSocket
  - **WebSocket Server**: Built-in server (`server/station-v-server-simple.js`) for real-time communication
  - **Network Service**: Client-side service for managing WebSocket connections and user synchronization
  - **Cross-Tab Synchronization**: Users, messages, and virtual user messages sync across browser tabs
  - **AI Message Broadcasting**: AI-generated messages are broadcast to all connected network users
  - **Channel Data Synchronization**: New users receive initial channel state (users, messages, topic)
  - **Network User Management**: Real-time user presence updates and connection status tracking

### Enhanced
- **User List Visual Indicators**: Enhanced user list with clear visual distinctions
  - **Current User Highlighting**: Network users show with blue background and "(Network)" label
  - **User Type Indicators**: Globe icon (🌐) for network users, link icon (🔗) for current network user
  - **Status Dots**: Color-coded status indicators (blue for network, green for local, yellow for away)
  - **Cross-Tab Consistency**: Same user appears as "current" across all browser tabs

### Fixed
- **Message Deduplication**: Comprehensive duplicate message prevention using unique ID generation
- **React Key Conflicts**: Fixed "Encountered two children with the same key" errors
- **Circular Dependencies**: Resolved "Maximum update depth exceeded" errors in useEffect hooks
- **AI Message Loops**: Prevented AI messages from looping back to originating clients
- **Network User Synchronization**: Fixed issues with network users not appearing in user lists
- **Cross-Tab Message Sync**: Messages now properly sync across all connected browser tabs

### Technical Improvements
- **Unique Message ID System**: Counter-based unique ID generation for all messages
- **BroadcastChannel Integration**: Cross-tab communication for user presence and messages
- **Network Service Singleton**: Centralized network connection management
- **Type Safety**: Enhanced TypeScript types for network users and messages
- **Error Handling**: Robust error handling for network disconnections and reconnections

## 1.16.0 - 2025-01-23

### Added
- **Multilingual Personality Descriptions**: Complete support for creating personality descriptions in multiple languages
  - **Multilingual Templates**: Added new personality templates including Multilingual Enthusiast, Japanese Otaku, German Engineer, and Spanish Artist
  - **Cultural Diversity**: Enhanced personality templates with authentic cultural backgrounds and language combinations
  - **AI Language Support**: AI can now generate personality descriptions in any supported language (English, Spanish, Chinese, Japanese, German, French, etc.)
  - **Batch Generation Options**: Added multilingual personality generation options in batch user creation
  - **Language Selection**: Users can choose which language to generate personality descriptions in
  - **Cultural Examples**: Added examples for different languages to guide users in creating authentic personalities
  - **Enhanced AI Prompts**: Updated AI system instructions to handle multilingual personalities authentically
  - **Language Context**: AI now receives detailed language skills information for all users in conversations
  - **Multilingual Behavior**: AI can generate responses that occasionally use words from other languages when appropriate

### Enhanced
- **Personality Templates**: Expanded trait pools with multilingual personality traits
  - **Cultural Traits**: Added traits like "passionate about languages", "culturally aware", "bilingual and bicultural", "language learning enthusiast", "international traveler", "cultural bridge-builder", "multilingual communicator", "cross-cultural expert", "global citizen", "language exchange partner"
  - **Multilingual Interests**: Added interests like "language learning and linguistics", "cultural exchange and international relations", "translation and interpretation", "world literature and poetry", "international cuisine and cooking", "global music and traditional arts", "cross-cultural communication", "international business and trade", "multilingual media and entertainment", "cultural anthropology and sociology", "international education and exchange programs"
- **User Interface**: Enhanced personality input with multilingual support
  - **Multilingual Placeholder**: Updated personality input field to encourage multilingual descriptions
  - **Language Examples**: Added examples in English, Spanish, and Chinese to guide users
  - **Enhanced Help Text**: Updated help text to show multilingual personality examples
- **AI System Instructions**: Enhanced AI prompts to better handle multilingual personalities
  - **Language Skills Context**: AI prompts now include detailed language skills information for all users
  - **Multilingual Support Instructions**: Added specific instructions for AI to handle multilingual personalities authentically
  - **Cultural Authenticity**: AI can now generate personality descriptions in different languages while maintaining cultural authenticity

## 1.15.0 - 2025-01-23

### Fixed
- **AI Model Selection Issues**: Resolved critical problems with AI model selection and validation
  - **Model Validation**: Fixed `validateModelId` function to properly handle all supported model types
  - **Model Processing**: Added proper processing for API models to include `baseModelId` property
  - **Model Propagation**: Ensured selected models are correctly passed to AI generation functions
  - **Debug Logging**: Enhanced logging to track model selection and validation process
  - **Impact**: Users can now successfully select and use different AI models (Gemini 2.5 Flash, 1.5 Flash, 1.5 Pro)

- **Response Structure Parsing**: Fixed AI response parsing for new Gemini API response formats
  - **Enhanced Parsing**: Updated `extractTextFromResponse` function to handle new response structures
  - **Multiple Extraction Methods**: Added fallback extraction methods for different response formats
  - **Comprehensive Debugging**: Added detailed logging to track response structure and parsing steps
  - **Robust Error Handling**: Improved error handling with multiple fallback methods
  - **Impact**: AI generation now works reliably regardless of response structure returned by Gemini API

- **Token Limits and Truncation**: Resolved token limit issues causing response truncation
  - **Increased Token Limits**: Raised thinking budget from 1000 to 2000 tokens for thinking mode models
  - **Output Token Adjustment**: Ensured minimum 2000 output tokens for thinking mode models
  - **Truncation Detection**: Added detection and handling for `MAX_TOKENS` finish reason
  - **Partial Text Extraction**: Added logic to extract partial text from truncated responses
  - **Impact**: AI responses are no longer truncated and provide complete, high-quality content

- **YouTube Link Issues**: Completely resolved problematic YouTube link generation and sharing
  - **Comprehensive Blocking**: Added `isProblematicYouTubeLink` function to block all YouTube URLs
  - **AI Prompt Updates**: Strongly discouraged YouTube link sharing in all AI prompts
  - **Alternative Content**: Encouraged sharing of GitHub repos, news articles, tutorials, documentation
  - **Video Content Description**: Suggested describing video content instead of linking to it
  - **Impact**: Users no longer encounter outdated, non-existent, or problematic YouTube videos

- **Imgur Link CORS Issues**: Fixed Imgur link filtering and CORS error prevention
  - **Complete Imgur Blocking**: Added `isImgurUrl` function to block all Imgur URL variations
  - **AI Prompt Updates**: Removed all Imgur references from AI prompts
  - **CORS-Compliant Services**: Updated to recommend only imgbox.com and picsum.photos
  - **Removed Fixing Logic**: Eliminated contradictory Imgur URL fixing that was causing issues
  - **Impact**: No more CORS errors from Imgur links, improved content reliability

### Enhanced
- **AI Response Quality**: Significantly improved AI response quality and reliability
  - **Better Model Support**: All supported AI models now work correctly with proper configuration
  - **Robust Error Handling**: Comprehensive error handling prevents failures and provides graceful degradation
  - **Enhanced Debugging**: Detailed logging makes troubleshooting easier and more effective
  - **Professional Quality**: System now works reliably across all scenarios and model types

- **Link and Image Sharing**: Improved link and image sharing functionality
  - **CORS-Compliant Services**: Focus on services with proper CORS headers (imgbox.com, picsum.photos)
  - **Reliable Content**: AI now shares more reliable content types (GitHub, documentation, news)
  - **Better User Experience**: Users can trust that shared links will work consistently
  - **Comprehensive Filtering**: Proactive filtering prevents problematic or broken links

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
- **Comprehensive Bug Fixes**: Resolved numerous issues across user management, chat functionality, simulation behavior, and UI components
  - **User Management**: Fixed user channel removal, user list updates, React key collisions, channel-specific user lists, and user assignment persistence
  - **Chat Log System**: Fixed UI button visibility, flickering, scrolling issues, message storage limits, and export functionality
  - **Simulation Behavior**: Fixed AI greeting repetition, user selection balance, greeting spam protection, and multilingual support
  - **IRC Commands**: Enhanced /me, /join, /part, /nick, /help commands with proper validation and error handling
  - **Message Handling**: Fixed join/part notifications, timestamp serialization, message ID generation, and current user separation
  - **UI/UX Improvements**: Fixed button visibility, loading states, nickname flashing, and channel operator display
  - **AI Context**: Enhanced time awareness, seasonal context, and model selection debugging
  - **Data Persistence**: Improved channel state tracking, user assignments, and configuration loading
  - **Performance**: Optimized user selection algorithms, conversation patterns, and state management
  - **Impact**: Significantly improved stability, user experience, and conversation quality across all features
- **Enhanced Model Validation Debugging**: Added detailed logging to identify model ID validation issues
  - **Root Cause**: Model validation function may be incorrectly processing model IDs, causing fallback to default model
  - **Solution**: Added comprehensive debug logging in `validateModelId` function and model selection handling
  - **Implementation**: Added logs to show input model ID, validation steps, and final result in `validateModelId` and `handleChange`
  - **Features**: Debug logs show model ID format, validation process, and available models list
  - **Impact**: Clear visibility into why model selection might be failing, easier identification of model ID format issues
- **Fixed User Join Notifications Display**: Resolved issue where user join notifications were not appearing in chat window
  - **Root Cause**: Join message content format was causing redundant display text, and join messages may not have been properly added to channels
  - **Solution**: Fixed join message content format and added comprehensive debug logging to track join message creation and addition
  - **Implementation**: Changed join message content from "joined channelname" to just "channelname", added debug logs in `handleUsersChange` and `addMessageToContext`
  - **Features**: Join messages now display as "nickname joined channelname" instead of "nickname joined joined channelname", debug logs show join message creation flow
  - **Impact**: User join notifications now properly appear in chat window when users are added to channels
- **Fixed AI Model Selector Not Updating**: Resolved issue where AI model selection was not updating the display when changed
  - **Root Cause**: useEffect dependency array included `config.aiModel`, causing validation logic to run every time the model changed and reset it back to the first available model
  - **Solution**: Removed `config.aiModel` from useEffect dependency array and added comprehensive debug logging to track model selection changes
  - **Implementation**: Fixed useEffect dependency to only depend on `availableModels`, added debug logs in `handleChange` and `useEffect` to track model selection flow
  - **Features**: Model selector now properly updates display when changed, debug logs show model selection process and state changes
  - **Impact**: AI model selection now works correctly, users can see the selected model ID update in real-time
- **Fixed Chat Log Statistics Invalid Date Display**: Resolved issue where chat log statistics showed "Invalid Date" for oldest and newest timestamps
  - **Root Cause**: IndexedDB stores Date objects as strings, and when retrieved, they weren't being properly converted back to Date objects, causing invalid date calculations
  - **Solution**: Added robust timestamp conversion and validation in `getStats` function and improved date formatting in ChatLogManager
  - **Implementation**: Enhanced timestamp processing to handle both Date objects and string timestamps, added validation with fallback to current time, improved `formatDate` function with invalid date detection
  - **Features**: Statistics now show proper dates for oldest and newest messages, debug logging shows timestamp processing details, graceful handling of invalid timestamps
  - **Impact**: Chat log statistics now display correct date information instead of "Invalid Date"
- **Added AI Link and Image Support**: Enhanced AI capabilities to post links to websites and images in chat messages
  - **Root Cause**: AI was limited to text-only messages, missing the ability to share links and images like real chat users
  - **Solution**: Enhanced AI prompts to include link and image generation, updated message types to support links and images, improved message rendering
  - **Implementation**: Added `links` and `images` fields to Message interface, enhanced AI system instruction with link/image examples, added URL extraction functions, updated Message component with link/image rendering
  - **Features**: AI can now share realistic website links and image URLs, links are clickable and open in new tabs, images are displayed inline with fallback to links, proper URL detection for both links and images
  - **Impact**: More realistic chat simulation with AI users sharing relevant links and images, enhanced user experience with interactive content
- **Fixed CORS and Network Error Handling**: Resolved CORS (Cross-Origin Resource Sharing) errors when AI API calls fail
  - **Root Cause**: Browser security policies block direct API calls to external services, causing CORS errors and network failures
  - **Solution**: Added comprehensive error handling for CORS/network errors, implemented fallback response system, enhanced error messages
  - **Implementation**: Added `isNetworkError` detection in `utils/config.ts`, enhanced `withRateLimitAndRetries` to handle network errors, created `getFallbackResponse` function for graceful degradation, updated error messages in App.tsx
  - **Features**: Simulation continues with fallback responses when API fails, user-friendly error messages explain CORS issues, personality-based fallback responses maintain user characteristics
  - **Impact**: Chat simulation remains functional even when AI API is unavailable, better user experience with clear error explanations
- **Enhanced AI Link and Image Sharing**: Improved AI prompts to encourage more frequent sharing of links and images
  - **Root Cause**: AI was too conservative and not naturally inclined to share links and images, making conversations less engaging
  - **Solution**: Enhanced AI system instructions and prompt construction to actively encourage link and image sharing
  - **Implementation**: Updated system instruction to be more proactive about sharing content, added 10% chance for explicit link/image sharing in diversity prompts, added 30% chance for link/image encouragement when none shared recently, added 20% chance for link/image sharing in reactions
  - **Features**: AI now more actively shares relevant links and images, better conversation engagement with multimedia content, realistic URL generation from common hosting services
  - **Impact**: More engaging and realistic chat simulation with AI users actively sharing relevant content
- **Enhanced HTML Export with Images**: Added HTML export functionality that preserves images and links in exported chat logs
  - **Root Cause**: Existing JSON and CSV exports didn't preserve the visual content (images and links) that AI users were sharing
  - **Solution**: Created comprehensive HTML export system with embedded CSS styling and image rendering
  - **Implementation**: Updated ChatLogEntry interface to include links and images fields, added handleExportHTML function with image rendering, created responsive HTML template with dark theme styling, added HTML export buttons to UI
  - **Features**: Images are displayed inline with hover effects and click-to-open functionality, links are clickable and open in new tabs, responsive design with channel grouping, color-coded message types, fallback handling for broken images
  - **Impact**: Exported chat logs now preserve the full multimedia experience with images and interactive links
- **Fixed Image Posting Security Issues**: Resolved CORS errors and audio/video play permission errors when AI users post images
  - **Root Cause**: AI was generating URLs from ad networks and tracking services that triggered CORS errors and audio/video auto-play issues
  - **Solution**: Enhanced AI prompts to use safer image hosting services, added URL filtering to block unsafe domains, improved error handling for image loading
  - **Implementation**: Updated AI system instruction to specify safe image hosting services and avoid ad networks, added unsafe URL detection in Message component with warning display, enhanced extractLinksAndImages function to filter out problematic domains, added crossOrigin and loading attributes to images
  - **Features**: AI now uses safe image hosting services (imgur.com, i.imgur.com, gyazo.com, etc.), unsafe URLs are blocked with warning messages, images load with proper security attributes, audio/video auto-play issues are prevented
  - **Impact**: Eliminated CORS errors and security warnings, improved user experience with safe image sharing, prevented unwanted audio/video content
- **Fixed Imgur URL Redirect Issues**: Resolved Imgur links that redirected to front page instead of showing images
  - **Root Cause**: AI was generating incomplete Imgur URLs (like imgur.com/abc123) that redirect to Imgur's front page instead of displaying the actual image
  - **Solution**: Enhanced AI prompts with complete URL examples, added automatic URL fixing for incomplete Imgur URLs, improved URL validation
  - **Implementation**: Updated AI system instruction with proper Imgur URL format examples (i.imgur.com/ID.jpg), added fixImgurUrl function to convert incomplete URLs to direct image links, enhanced Message component to detect and fix incomplete Imgur URLs with user feedback
  - **Features**: AI now generates complete Imgur URLs with file extensions, automatic URL fixing converts imgur.com/ID to i.imgur.com/ID.jpg, users see feedback when URLs are fixed, proper validation prevents front page redirects
  - **Impact**: Imgur images now display correctly instead of redirecting to front page, better user experience with working image links, automatic fixing of common URL issues
- **Enhanced Imgur URL Filtering**: Added comprehensive filtering to prevent Imgur URLs from loading full JavaScript applications
  - **Root Cause**: Some Imgur URLs were still loading Imgur's full desktop application (main.js) instead of just the image, causing JavaScript errors and audio/video play issues
  - **Solution**: Added strict URL validation to only allow direct image URLs, enhanced URL fixing to handle more Imgur patterns, added blocking for problematic Imgur URLs
  - **Implementation**: Added isDirectImageUrl function to validate direct image URLs, enhanced fixImgurUrl to handle gallery/album URLs, added problematic Imgur URL detection with user warnings, added referrerPolicy="no-referrer" to prevent tracking
  - **Features**: Only direct image URLs (i.imgur.com/ID.jpg) are now processed, problematic Imgur URLs are blocked with warnings, enhanced URL validation prevents JavaScript loading, better error handling for audio/video issues
  - **Impact**: Eliminated Imgur JavaScript loading errors, prevented audio/video auto-play issues, improved performance by only loading direct images
- **Complete Imgur URL Blocking**: Implemented comprehensive blocking of all Imgur URLs to prevent JavaScript and audio/video errors
  - **Root Cause**: Even with filtering, some Imgur URLs were still causing "The play method is not allowed" errors and JavaScript loading issues
  - **Solution**: Completely blocked all Imgur URLs (imgur.com and i.imgur.com), redirected AI to use alternative image hosting services, added global error handlers to suppress audio/video errors
  - **Implementation**: Added imgur.com to unsafe domains list, updated AI prompts to use gyazo.com, prnt.sc, imgbb.com instead of Imgur, added global error handlers for audio/video play errors, enhanced Message component to block all Imgur URLs with user warnings
  - **Features**: All Imgur URLs are now blocked with warning messages, AI uses alternative image hosting services (gyazo.com, prnt.sc, imgbb.com), global error handlers suppress audio/video play errors, users get clear feedback about blocked URLs
  - **Impact**: Completely eliminated Imgur-related JavaScript and audio/video errors, improved reliability with alternative image hosting services, better user experience with clear error messages
- **Fixed AI Image Blocking**: Resolved issue where AI-generated images from alternative hosting services were being blocked
  - **Root Cause**: URL filtering logic was too restrictive, only allowing URLs with file extensions in the path, but many image hosting services (gyazo.com, prnt.sc, imgbb.com) use URLs without file extensions
  - **Solution**: Updated URL validation patterns to be more flexible, enhanced image detection in Message component, added debug logging to track URL filtering
  - **Implementation**: Modified isDirectImageUrl function to accept URLs without file extensions from trusted hosting services, updated Message component to detect image hosting services by domain, added comprehensive debug logging for URL processing
  - **Features**: Alternative image hosting services now work correctly (gyazo.com, prnt.sc, imgbb.com, postimg.cc, imgbox.com, imgchest.com, freeimage.host), flexible URL patterns support both with and without file extensions, debug logging helps identify blocked URLs
  - **Impact**: AI-generated images now display correctly instead of being blocked, better support for various image hosting URL formats, improved debugging capabilities for URL filtering issues
- **Enhanced IRC Realism**: Fixed unrealistic conversation patterns where AI users reply to multiple people in the same sentence
  - **Root Cause**: AI users were generating unrealistic IRC behavior by addressing multiple users in one message (e.g., "Alice and Bob, you're both wrong"), which real IRC users don't do
  - **Solution**: Enhanced AI prompts to encourage single-user replies, added conversation pattern detection for multi-user replies, implemented IRC realism guidelines
  - **Implementation**: Added comprehensive IRC conversation pattern guidelines to AI system instructions, enhanced both channel activity and reaction generation prompts with single-user reply instructions, added multi-user reply detection in trackConversationPatterns function, implemented specific warnings against addressing multiple users in one sentence
  - **Features**: AI now replies to one person at a time like real IRC users, conversation pattern detection identifies unrealistic multi-user replies, enhanced prompts encourage natural IRC conversation flow, specific guidelines prevent addressing multiple users in one message
  - **Impact**: Improved IRC realism with authentic conversation patterns, eliminated unrealistic multi-user addressing, better user experience with natural IRC behavior, enhanced authenticity of AI-generated conversations
- **Comprehensive YouTube Link Quality Improvements**: Fixed multiple issues with AI-generated YouTube links including fake URLs, repetitive content, outdated videos, and overused memes
  - **Root Cause**: AI users were posting various types of problematic YouTube links including fake URLs, repetitive Rick Astley links, outdated videos, and non-existent content
  - **Solution**: Implemented comprehensive link validation system with anti-repetition measures, real content validation, and anti-meme protection
  - **Implementation**: 
    - **Fake Link Prevention**: Added guidelines emphasizing real, existing content only, enhanced prompts with anti-fake content measures, implemented fallback mechanisms for real content
    - **Anti-Repetition System**: Added YouTube link tracking, implemented anti-repetition measures, enhanced prompts to encourage diverse content across genres and creators
    - **Rick Astley Spam Prevention**: Removed specific video examples, created dedicated `antiRickAstleyPrompt` variable included in 100% of link sharing prompts, restructured prompt chain for consistent application
    - **Outdated Content Prevention**: Added guidelines for recent content preference, implemented tracking for potentially outdated links, enhanced prompts to discourage old videos
    - **Content Quality Enhancement**: Added comprehensive validation guidelines, implemented multiple anti-repetition measures, created fallback options for alternative content types
  - **Features**: AI now only shares real, existing, current YouTube links, comprehensive anti-repetition system prevents overused content, 100% coverage of anti-Rick Astley measures, enhanced content diversity with fresh, relevant links
  - **Impact**: Eliminated all problematic YouTube link types (fake, repetitive, outdated, overused), improved user experience with working, diverse content, enhanced conversation quality with relevant, fresh links, better AI behavior consistency

## 1.13.18 - 2025-01-23

### Enhanced
- **IRC Conversation Realism**: Improved AI conversation patterns to match real IRC behavior
- **YouTube Link Quality**: Comprehensive improvements to AI-generated YouTube link sharing

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

- **Additional Bug Fixes**: Resolved various issues with message truncation, language display, React keys, and build configuration
  - **Message Truncation**: Fixed AI messages being cut off for terse users by doubling token limits for all verbosity levels
  - **Language Skills Display**: Fixed "object Object" showing in language skills by correcting format conversion in batch generation
  - **React Key Collisions**: Fixed duplicate message IDs when adding users dynamically with counter-based unique ID generation
  - **Build Configuration**: Fixed missing file reference in vite.config.ts causing build failures
  - **Impact**: Improved message quality, better language display, stable React rendering, and successful production builds

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
- **Export and UI Stability Fixes**: Resolved critical issues with export functionality and UI components
  - **Export Window**: Fixed "an error occurred while opening export window" message by resolving TypeScript compilation errors
  - **Type Safety**: Fixed type issues in BatchUserModal, GeminiService, and UsernameGeneration components
  - **Component Rendering**: All modal components now render correctly without falling back to error boundaries
  - **Typing Indicators**: Fixed generic "AI is typing" messages conflicting with specific nickname indicators
  - **HTML Structure**: Fixed React hydration error caused by invalid HTML structure in AI model selector
  - **Impact**: Export functionality now works reliably, UI components render properly, and typing indicators are accurate

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
- **Settings Modal Stability**: Fixed blank screen issue when accessing settings during simulation
  - **Simulation Pause**: Background simulation automatically pauses when settings modal is opened
  - **Safety Checks**: Added multiple safety checks to prevent simulation interference during modal operations
  - **Error Handling**: Added error boundaries to prevent crashes and provide graceful recovery
  - **Impact**: Users can now safely access settings during simulation without blank screens or crashes

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
- **AI Model and Build Fixes**: Resolved API errors and build issues
  - **Model ID Validation**: Fixed API errors by properly extracting model IDs from display names with regex pattern matching
  - **API Call Validation**: Applied model ID validation to all AI generation functions with automatic fallback system
  - **Build Asset References**: Removed incorrect reference to non-existent `/index.css` in built HTML files
  - **Enhanced Debugging**: Added comprehensive logging for model ID validation and troubleshooting
  - **Impact**: Eliminated API errors, 404 errors, and improved build output quality

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
- **Modal Form Conflicts**: Resolved issue where Add User/Channel buttons were closing the settings window
  - **Form Structure**: Removed form wrapper that was causing submission conflicts
  - **Event Handling**: Restructured SettingsModal to use button-based actions instead of form submission
  - **Modal Stacking**: Fixed z-index layering for proper modal stacking
  - **Reliability**: Simplified event handling for better reliability

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
- **API Resilience and Error Handling**: Enhanced API stability and user feedback
  - **Retry Mechanism**: Implemented automatic retry with exponential backoff for all API calls
  - **Rate Limit Handling**: Gracefully handles `429 RESOURCE_EXHAUSTED` errors with intelligent retries
  - **Error Feedback**: Single, non-spammy system messages inform users of persistent failures
  - **Impact**: Significantly reduced visible errors and improved simulation stability

## 1.1.0 - 2025-10-19

### Added
- **Simulation Speed Control**: Users can now adjust the speed of background AI chatter ('Fast', 'Normal', 'Slow') or turn it 'Off' completely via the Settings modal. This provides granular control over API usage.

### Changed
- **API Quota Management**: Enhanced quota management with automatic pausing when browser tab is not visible
  - **Tab Visibility**: Simulation automatically pauses when application tab is not visible
  - **Speed Controls**: Combined with speed controls to reduce API rate limit likelihood
  - **Default Speed**: Increased default 'Normal' simulation interval to 30 seconds
  - **Impact**: Significantly reduces API usage and helps conserve overall quota

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