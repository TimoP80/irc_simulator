# Station V - Virtual Chat Simulator

### An Experiment in AI-Simulated Social Environments

**Current Version: 1.16.2** - Network mode support, HTML export templates, and critical bug fixes for multi-user environments.

---

## 1. The Core Idea: What is This Project?

Station V - Virtual Chat Simulator is a web application that recreates the look and feel of a classic chat client with one fundamental difference: **you are the only human.**

Every other user in every channel, every message typed, and every interaction is generated in real-time by Google's Gemini AI. Each AI user has detailed personality traits, language skills, and writing styles that affect how they communicate. The project includes powerful tools for mass-generating diverse AI personalities, importing/exporting user data, and creating complex virtual communities. The project serves as a self-contained digital terrarium—a sandbox for observing how well a large language model can simulate a dynamic, multi-participant social environment with realistic character depth.

The central question we aim to explore is: **Can AI create a believable, engaging, and coherent social space that feels alive?**

## 2. The Experiment: Testing the Boundaries of AI Simulation

This project is more than just a tech demo; it's an interactive experiment designed to test several aspects of AI-driven simulation:

-   **Coherence & Consistency**: Can the AI agents maintain consistent personalities over time? Do they remember the context of the conversation, or do they easily get derailed?
-   **Believability**: Does the simulated chat room feel like a real (if slightly quirky) online community? Are the conversations natural, or do they feel sterile and robotic?
-   **Emergent Dynamics**: Can interesting social dynamics emerge from the interactions between AI agents? Will friendships, rivalries, or inside jokes develop organically?
-   **Engagement**: Is the environment compelling enough to hold a human user's attention? Can you have a meaningful or entertaining conversation with a bot that is also actively talking to other bots?

By interacting with the simulation, you are actively participating in this experiment and helping to answer these questions.

## 3. How It Works

The simulation is powered by the Gemini API, using carefully crafted prompts to guide the AI's behavior.

1.  **System Instruction**: A base instruction sets the scene, telling the AI its role is to simulate an IRC environment, adhere to strict formatting (`nickname: message`), and keep responses brief and in-character.
2.  **Autonomous Channel Activity**: At regular intervals, Station V picks a random channel and prompts the AI to generate a message from one of the virtual users. This prompt includes the channel topic, a list of users with their personalities, and the recent message history. This creates the ambient "background chatter" that makes the world feel lived-in.
3.  **Reactive Responses**: When you send a message, a different prompt is sent to the AI. It includes the context of your message and asks the AI to generate a direct, in-character reaction from one of the other users in the channel.
4.  **Private Messaging**: When you open a private message with a virtual user, the prompts are tailored for a one-on-one conversation, focusing heavily on that user's specific personality and the private chat history.
5.  **Persistent Storage**: All channel messages are automatically saved to a lightweight IndexedDB database, allowing you to browse chat history, export logs, and manage storage across browser sessions.

## 4. Key Features

-   **Fully AI-Driven World**: Every user besides you is an AI agent powered by Gemini, each with a unique, customizable personality.
-   **Advanced Configuration Interface**: The entire simulation is yours to control through a modern, user-friendly interface:
    -   **User Management**: Add, edit, and delete virtual users with dedicated forms and real-time validation
    -   **Channel Management**: Create and manage channels with visual cards and comprehensive validation
    -   **Your Nickname**: Set your own display name
    -   **Simulation Speed Control**: Adjust the frequency of autonomous AI messages (Fast/Normal/Slow/Off)
    -   **All settings are saved in your browser's local storage**
-   **Advanced User Customization**: Create highly detailed AI personalities with comprehensive character controls:
    -   **Language Skills**: Set fluency levels, multiple languages, and optional accents/dialects
    -   **Writing Style**: Control formality, verbosity, humor, emoji usage, and punctuation styles
    -   **Visual User Cards**: See detailed user attributes including fluency badges and style information
    -   **Dynamic Language Management**: Add and remove multiple languages for multilingual AI users
    -   **Multilingual Personality Descriptions**: Write personality descriptions in any language for authentic cultural representation
-   **Batch User Generation**: Mass create users with powerful generation tools:
    -   **Personality Templates**: 8 predefined archetypes (Chatterbox, Polite Academic, Sarcastic Gamer, etc.)
    -   **AI-Assisted Generation**: Let Gemini AI create unique, creative personalities automatically
    -   **Randomization Engine**: Generate diverse users with smart random attributes and unique nicknames
    -   **Mass Add Interface**: Create 1-50 users at once with live preview and customization options
    -   **Template Customization**: Mix predefined templates with randomization for perfect control
    -   **Primary Language Forcing**: Force all generated users to have a specific primary language with native fluency
-   **Import/Export System**: Full data portability for user and channel management:
    -   **User Import/Export**: CSV and JSON support for user data with all attributes
    -   **Channel Import/Export**: CSV and JSON support for channel configurations
    -   **Channel Log Export**: HTML export for chat logs with beautiful formatting
    -   **JSON Format Reference**: [Users_JSON_Format.html](Users_JSON_Format.html)
    -   **Backup & Sharing**: Easy data backup and community sharing capabilities
    -   **File Validation**: Automatic format detection with helpful error messages
    -   **World Editor Integration**: Import channels from other World Editor configurations
-   **Lightweight Chat Log Database**: Complete IndexedDB-based persistent storage system:
    -   **Automatic Message Storage**: All channel messages automatically saved to browser database
    -   **Chat Log Manager**: Full-featured UI for viewing, managing, and exporting chat logs
    -   **Channel Statistics**: Message counts, activity tracking, and storage usage monitoring
    -   **Export Functionality**: Export chat logs as JSON files for backup or analysis
    -   **Storage Management**: Clear individual channels or all logs with confirmation dialogs
    -   **Search & Filter**: Browse messages by channel with pagination and filtering
    -   **Mobile Compatible**: Responsive design works on all device sizes
    -   **Performance Optimized**: Efficient storage with automatic cleanup and indexing
-   **Classic IRC Experience**: The app features a familiar three-panel UI (channels, chat, user list), a retro monospace aesthetic, and support for essential commands like `/nick`, `/join`, and `/who`.
-   **Dynamic Conversations**: The simulation feels alive with both ambient background chatter generated by the AI users and direct, context-aware responses to your messages.
-   **Private Messaging**: Peel off from the main channels to have focused, one-on-one conversations with any AI personality.
-   **Realistic AI Personalities**: Each AI user has detailed language skills and writing styles that affect how they communicate:
    -   **Consistent Writing Styles**: AI users maintain their formality, verbosity, and humor levels across all interactions
    -   **Dynamic Message Length**: Very verbose users generate long, detailed messages while terse users stay brief
    -   **Language-Aware Responses**: AI considers fluency levels and language preferences when generating messages
    -   **Character Depth**: More realistic conversations based on detailed personality and communication preferences
    -   **Channel Language Control**: Channels can have explicit dominant languages for consistent communication
-   **Time-of-Day Synchronization**: The simulation adapts to real-world time patterns for maximum realism:
    -   **Real-time Context**: AI conversations include current time, day of week, and social context
    -   **Time-Appropriate Topics**: Morning coffee discussions, evening plans, late-night deep thoughts
    -   **Energy Level Matching**: Message tone and energy match the time period naturally
    -   **Smart User Selection**: Energetic users active in morning, introspective users at night
    -   **Dynamic Activity**: More active during peak hours (5-9 PM), quieter at night
    -   **Weekend Awareness**: Different behavior patterns for weekends vs weekdays
    -   **5 Time Periods**: Morning, Afternoon, Evening, Late Evening, and Late Night with unique characteristics
-   **Enhanced User Experience**: 
    -   **Cancel Button**: Browse settings without applying changes
    -   **Keyboard Shortcuts**: Escape key support for all modals
    -   **Form Validation**: Real-time validation with helpful error messages
    -   **Visual Feedback**: Status badges, color-coded elements, and hover effects
-   **Dynamic User Management**: Real-time user addition without simulation interruption
    -   **No Simulation Reset**: Add or remove users while the simulation continues running
    -   **Automatic Channel Joining**: New users automatically join all channels when created
    -   **Auto-Join Empty Channels**: Virtual users automatically join channels that only have the current user
    -   **Smart User Selection**: Randomly selects 2-4 users from available pool to populate empty channels
    -   **Channel State Persistence**: User channel assignments are saved and restored across sessions
    -   **Join/Part Messages**: Real-time join and part messages when users are added/removed
    -   **AI Greetings**: Existing users automatically welcome new users with contextual greetings
    -   **State Synchronization**: Virtual users and channel users stay perfectly synchronized
    -   **Visual Feedback**: Users see join/part activity in real-time
-   **IRC Command Support**: Full IRC command compatibility for realistic chat experience
    -   **Topic Management**: `/topic` command to view and change channel topics (operators only)
    -   **Action Commands**: `/me` command for performing actions (e.g., `/me waves`)
    -   **Help System**: `/help` command showing available commands
    -   **Operator Permissions**: Channel operators can manage topics and moderate channels
    -   **Auto-Operator Assignment**: Current user automatically becomes operator of all channels
-   **Anti-Repetition System**: Advanced conversation diversity and flow management
    -   **Repetition Detection**: Automatically detects repetitive phrases in recent messages
    -   **Enhanced Diversity Prompts**: 90% chance of diversity prompts to prevent stale conversations
    -   **7 Prompt Types**: New topics, questions, stories, observations, mood changes, humor, natural conversation
    -   **Repetition Avoidance**: AI receives explicit instructions to avoid detected repetitive phrases
    -   **Topic Evolution Warnings**: AI warned when conversations become stale or repetitive
    -   **Smart Topic Suggestions**: System messages suggest fresh topics when conversations get repetitive
    -   **Extended Context**: 20-message history for better AI understanding and context

## 4.5. Network Mode - Multi-User Support

Station V now supports **network mode**, allowing multiple human users to connect and chat together in the same virtual environment. This transforms the simulator from a single-user experience into a collaborative social space where humans and AI interact together.

### Network Features

- **WebSocket Server**: Built-in server for real-time communication between multiple clients
  - **Automatic Setup**: Server starts automatically with `npm run dev:full`
  - **Cross-Platform**: Works on Windows, macOS, and Linux
  - **Persistent Connections**: Stable WebSocket connections with automatic reconnection
  - **Channel Synchronization**: All users see the same channels, users, and messages

- **Multi-User Chat**: Multiple human users can chat in the same channels
  - **Real-Time Messaging**: Instant message delivery between all connected users
  - **User Presence**: See who's online and connected to the network
  - **Channel Management**: All users can join/leave channels together
  - **Message History**: New users receive complete channel history upon joining

- **AI Integration**: Virtual users interact with both human and network users
  - **Smart AI Responses**: AI users respond to messages from both local and network users
  - **Consistent Personalities**: AI maintains personalities across all user interactions
  - **Language Awareness**: AI adapts to the language context of all users
  - **No AI Loops**: Prevents infinite AI response loops in network mode

- **Cross-Tab Synchronization**: Multiple browser tabs stay synchronized
  - **User Lists**: User presence updates across all tabs
  - **Messages**: All messages appear in all open tabs
  - **AI Messages**: Virtual user messages sync across tabs
  - **Real-Time Updates**: Changes appear instantly in all connected tabs

- **Visual Indicators**: Clear distinction between user types
  - **Network Users**: Blue background with globe icon (🌐)
  - **Current User**: Highlighted with link icon (🔗) and cyan background
  - **Local Users**: Standard appearance with status dots
  - **Status Colors**: Green (online), yellow (away), blue (network)

### Network Setup

#### Quick Network Start
```bash
# Start both server and client
npm run dev:full

# Or start separately:
npm run server    # Start WebSocket server
npm run dev       # Start web client
```

#### Network Configuration
- **Server Port**: Default 8080 (configurable in `server/station-v-server-simple.js`)
- **Client Connection**: Automatically connects to `localhost:8080`
- **Multiple Clients**: Each browser tab acts as a separate client
- **User Nicknames**: Each client can set their own nickname

#### Network Architecture
- **WebSocket Server**: Handles all real-time communication
- **Client Service**: Manages connections and message routing
- **Broadcast System**: Ensures all clients receive updates
- **Message Deduplication**: Prevents duplicate messages across clients
- **Error Handling**: Robust reconnection and error recovery

### Network Use Cases

- **Collaborative Storytelling**: Multiple humans and AI create stories together
- **Language Learning**: Practice languages with AI and other learners
- **Social Experiments**: Observe AI behavior with multiple human participants
- **Team Building**: Use as an icebreaker or team activity
- **Educational Tool**: Teach AI interaction and social dynamics
- **Entertainment**: Multi-player chat experience with AI personalities

### Network Limitations

- **Local Network Only**: Currently designed for local network use
- **Single Server**: One server instance per network
- **Browser Required**: WebSocket clients require modern browsers
- **No Authentication**: No user authentication or security features
- **No Persistence**: Server state is not persisted (resets on restart)

## 5. Getting Started

### Quick Start (5 minutes)

If you just want to get Station V running quickly:

1. **Install Node.js** from [nodejs.org](https://nodejs.org/)
2. **Get a Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Clone the project** and navigate to the directory
4. **Install dependencies**: `npm install`
5. **Create `.env` file** with your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
6. **Start the app**: `npm run dev`
7. **Open browser** to `http://localhost:5173/`
8. **Configure and start chatting!**

### Prerequisites

Before running Station V, you'll need:

1. **Node.js** (version 16 or higher) - [Download from nodejs.org](https://nodejs.org/)
2. **npm** (comes with Node.js) or **yarn** package manager
3. **Google Gemini API Key** - [Get one from Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation & Setup

1. **Clone or Download the Project**
   ```bash
   git clone <repository-url>
   cd irc_simulator
   ```
   Or download the project files to a local directory.

2. **Install Dependencies**
   ```bash
   npm install
   ```
   This will install all required packages including React, TypeScript, Tailwind CSS, and the Google Gemini AI library.

3. **Set Up Environment Variables**
   Create a `.env` file in the project root directory:
   ```bash
   # Create .env file
   touch .env
   ```
   
   Add your Gemini API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   
   **Important**: Replace `your_api_key_here` with your actual Gemini API key from Google AI Studio.

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   
   The application will start and you'll see output like:
   ```
   VITE v4.x.x  ready in 500ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

5. **Open in Browser**
   Navigate to `http://localhost:5173/` in your web browser.

### First Launch Configuration

Upon first launch, you'll be greeted by a **Settings** modal with a modern, user-friendly interface:

#### **Step 1: Set Your Nickname**
- Enter your desired nickname in the "Your Nickname" field
- This will be your display name in all channels and conversations

#### **Step 2: Configure AI Model**
- Choose your preferred AI model from the dynamically loaded dropdown:
  - **Models are fetched live** from Google's Gemini API models endpoint
  - **Real-time availability** - Shows only models currently available to your API key
  - **Detailed information** - Each model displays token limits, performance characteristics, and cost indicators
  - **Automatic fallback** - If the API is unavailable, falls back to standard models (Gemini 2.5 Flash, 1.5 Flash, 1.5 Pro)
  - **Loading indicator** - Shows "Loading..." while fetching available models

#### **Step 3: Create Virtual Users**
You have several options for creating AI users:

**Option A: Single User Creation**
- Click "Add User" for detailed customization
- Set nickname and personality description
- Configure language skills (fluency, languages, accents)
- Set writing style (formality, verbosity, humor, emoji usage, punctuation)
- Use the "Randomize" button for AI-generated usernames

**Option B: Mass User Generation**
- Click "Mass Add" for batch creation
- Choose generation method:
  - **Templates**: 8 predefined personality archetypes
  - **AI Generation**: Let Gemini create unique personalities
  - **Random Generation**: Generate diverse users with randomized attributes
- Select quantity (1-50 users)
- Preview generated users before adding

**Option C: Import Users**
- Click "Import/Export" for data management
- Import users from CSV or JSON files
- Export users for backup or sharing

#### **Step 4: Create Channels**
- Click "Add Channel" to create IRC channels
- Channel names must start with `#` (e.g., `#general`, `#tech`)
- Add descriptive topics for each channel
- Use "Import/Export" to import channels from other configurations
- Use "Clear All" to remove all channels and start fresh

#### **Step 5: Configure Simulation Settings**
- **Background Simulation Speed**: Choose how frequently AI users generate autonomous messages
  - **Fast**: 15 seconds (responsive, moderate API usage)
  - **Normal**: 30 seconds (balanced, low API usage)
  - **Slow**: 60 seconds (conservative, very low API usage)
  - **Off**: No autonomous messages (most API-friendly)

- **Debug Logging**: Optional advanced settings for troubleshooting
  - Enable/disable debug logging
  - Choose log level (Debug, Info, Warn, Error)
  - Select categories to log (AI, Simulation, Config, Username)

#### **Step 6: Save and Start**
- Click "Save and Start" to enter the simulation
- Your configuration will be saved in browser localStorage
- Use "Cancel" to explore settings without applying changes

### Using the Application

Once configured, you can:

1. **Join Channels**: Click on channel names in the left panel to join
2. **Send Messages**: Type in the message box and press Enter
3. **Use IRC Commands**: 
   - `/nick <name>` - Change your nickname
   - `/join #channel` - Join a channel
   - `/me <action>` - Send an action message
   - `/who` - List users in current channel
   - `/help` - Show available commands
4. **Private Messages**: Click on usernames to start private conversations
5. **Adjust Settings**: Click the gear icon to modify your configuration
6. **View Chat Logs**: Click the "Chat Logs" button to access the persistent message database:
   - **Browse History**: View all messages from any channel with timestamps and message types
   - **Export Data**: Download chat logs in multiple formats for backup or analysis:
     - **JSON Export**: Structured data format for developers and data processing
     - **CSV Export**: Spreadsheet-friendly format for data analysis and reporting
     - **Channel-Specific**: Export individual channels or all channels at once
   - **Storage Management**: Monitor database usage and clear old logs if needed
   - **Channel Statistics**: See message counts and activity levels for each channel

### Troubleshooting

**Common Issues:**

1. **"npm is not recognized"**: Install Node.js from [nodejs.org](https://nodejs.org/)
2. **API Key Errors**: Ensure your `GEMINI_API_KEY` is correctly set in the `.env` file
3. **Rate Limit Errors**: Reduce simulation speed to "Slow" or "Off" in settings
4. **Port Already in Use**: The default port is 5173. If busy, Vite will suggest an alternative port

**Getting Help:**
- Check the browser console for detailed error messages
- Enable debug logging in settings for troubleshooting
- Ensure your API key has sufficient quota in Google AI Studio

### Building for Production

To create a production build:

1. **Build the Application**
   ```bash
   npm run build
   ```
   This creates an optimized build in the `dist/` directory.

2. **Preview the Production Build**
   ```bash
   npm run preview
   ```
   This serves the production build locally for testing.

3. **Deploy to a Web Server**
   - Upload the contents of the `dist/` directory to your web server
   - Ensure your web server serves the `index.html` file for all routes (SPA routing)
   - Set up environment variables on your hosting platform:
     - Add `GEMINI_API_KEY` as an environment variable
     - Or configure your hosting platform to inject the API key at build time

### Environment Variables

The application requires the following environment variable:

- **GEMINI_API_KEY**: Your Google Gemini API key (required)
  - Get one from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Add to `.env` file for local development
  - Set as environment variable in production

### Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for linting errors
npm run lint

# Type checking
npx tsc --noEmit
```

## 6. Recent Updates (v1.16.0)

Station V has recently received major enhancements including multilingual personality descriptions, enhanced cultural diversity, and improved AI language support:

### 🌍 **Multilingual Personality Descriptions (v1.16.0)**
- **Complete Language Support**: Write personality descriptions in any supported language (English, Spanish, Chinese, Japanese, German, French, etc.)
- **Cultural Authenticity**: AI can generate personality descriptions in different languages while maintaining cultural authenticity
- **Multilingual Templates**: New personality templates including Multilingual Enthusiast, Japanese Otaku, German Engineer, and Spanish Artist
- **Batch Generation Options**: Added multilingual personality generation options in batch user creation
- **Language Selection**: Users can choose which language to generate personality descriptions in
- **Cultural Examples**: Added examples for different languages to guide users in creating authentic personalities
- **Enhanced AI Prompts**: Updated AI system instructions to handle multilingual personalities authentically
- **Language Context**: AI now receives detailed language skills information for all users in conversations
- **Multilingual Behavior**: AI can generate responses that occasionally use words from other languages when appropriate

### 🎭 **Enhanced Personality Templates (v1.16.0)**
- **Cultural Traits**: Added traits like "passionate about languages", "culturally aware", "bilingual and bicultural", "language learning enthusiast", "international traveler", "cultural bridge-builder", "multilingual communicator", "cross-cultural expert", "global citizen", "language exchange partner"
- **Multilingual Interests**: Added interests like "language learning and linguistics", "cultural exchange and international relations", "translation and interpretation", "world literature and poetry", "international cuisine and cooking", "global music and traditional arts", "cross-cultural communication", "international business and trade", "multilingual media and entertainment", "cultural anthropology and sociology", "international education and exchange programs"
- **User Interface**: Enhanced personality input with multilingual support and language examples
- **AI System Instructions**: Enhanced AI prompts to better handle multilingual personalities

## 6.1 Previous Updates (v1.13.12)

Station V previously received major enhancements including time-of-day synchronization, conversation diversity improvements, and enhanced realism:

### 🕐 **Time-of-Day Synchronization (v1.13.12)**
- **Real-time Context**: AI conversations automatically include current time, day of week, and social context
- **Time-Appropriate Topics**: Morning coffee discussions, evening plans, late-night deep thoughts
- **Energy Level Matching**: Message tone and energy naturally match the time period
- **Smart User Selection**: Energetic users active in morning, introspective users at night
- **Dynamic Activity**: More active during peak hours (5-9 PM), quieter at night
- **Weekend Awareness**: Different behavior patterns for weekends vs weekdays
- **5 Time Periods**: Morning, Afternoon, Evening, Late Evening, and Late Night with unique characteristics

### 🎯 **Conversation Diversity Improvements (v1.13.12)**
- **Diversity Prompts**: 50% chance of special prompts to break repetitive patterns
- **User Rotation**: Smart user selection prevents same users always speaking
- **Activity Tracking**: Prefer users who haven't spoken recently
- **Temperature Variation**: Random AI creativity levels for more diverse responses
- **Conversation Resets**: Automatic conversation refresh every 10-15 minutes
- **Topic Evolution**: Conversations naturally evolve and change direction

### 🤖 **AI Model Selector**
- **Dynamic Model Loading**: Models are fetched live from Google's Gemini API models endpoint
- **Real-time Availability**: Shows only models currently available to your API key
- **Detailed Model Information**: Each model displays token limits, performance characteristics, and cost indicators
- **Automatic Fallback**: Falls back to standard models if API is unavailable
- **Real-time Switching**: Model changes apply immediately to new AI messages
- **Service Integration**: All AI functions use the selected model

### 🔍 **Comprehensive Debug Logging System**
- **AI Message Generation Logging**: Detailed logs for channel activity, reactions, and private message generation
- **Username Generation Logging**: Complete logging for AI-powered username generation with fallback tracking
- **Simulation Debug Logging**: Comprehensive simulation flow logging including burst mode and channel selection
- **Error Context Logging**: Structured error logging with stack traces, context data, and error categorization
- **Debug Control Panel**: User-friendly interface in settings modal to control debug logging
- **Real-time Configuration**: Debug settings can be changed without restarting the application

### 🎲 **Username Randomization**
- **Randomize Button**: Purple "Randomize" button next to nickname input field
- **AI-Powered Generation**: Uses the same AI username generation system as batch creation
- **Loading States**: Visual feedback with spinner and "Generating..." text during AI generation
- **Fallback System**: Automatic fallback to simple random nickname if AI fails
- **Enhanced UX**: Improved user experience with intuitive randomize functionality

### 📁 **Channel Import/Export System**
- **Channel Management**: Import and export channel configurations for easy sharing
- **CSV Support**: Export/import channels in spreadsheet format with name, topic, and statistics
- **JSON Support**: Export/import complete channel objects with all attributes
- **World Editor Integration**: Share channel configurations between different setups
- **File Validation**: Automatic format detection with helpful error messages
- **Backup & Sharing**: Easy channel configuration backup and community sharing

### 💬 **Advanced HTML Export System (v1.16.2)**
- **5 Export Templates**: Choose from multiple professional export styles
  - **Modern Dark**: Dark theme with gradients and modern styling (default)
  - **Classic Light**: Clean light theme with traditional styling
  - **Minimal Clean**: Ultra-minimal design focused on content
  - **Compact Table**: Dense table-like layout for maximum information density
  - **Web Client Style**: Mimics actual web client interface with colored nicknames
- **Live Preview**: Full-screen preview modal with template selection before export
- **Chronological Ordering**: All templates ensure messages are ordered oldest to newest
- **Enhanced Image Support**: Responsive image rendering with click-to-open functionality
- **Interactive Features**: Search functionality, scroll-to-top, and hover effects
- **Individual Channels**: Export each channel separately with full message history
- **All Channels**: Export all channels in one comprehensive HTML file
- **Cross-Platform**: HTML files work in any web browser for easy sharing

### 🌍 **Advanced Language Support (v1.13.10-1.13.11)**
- **Channel Dominant Language**: Set explicit dominant language for channels
- **Language Override**: Channels can override automatic language detection
- **25+ Language Support**: Comprehensive language selector with Finnish, English, Spanish, French, German, Japanese, and many more
- **Per-Language Format**: Enhanced language skills with individual fluency and accent settings
- **Language Persistence**: All language settings properly saved and loaded
- **AI Language Compliance**: AI users now strictly follow their configured languages

### ⚙️ **Enhanced User Management (v1.13.11)**
- **Real-time Synchronization**: Settings modal updates immediately when user data changes
- **Writing Style Persistence**: All humor, emoji usage, formality, and verbosity settings properly saved
- **Import/Export Fixes**: Writing style settings now correctly import/export in CSV and JSON formats
- **Format Compatibility**: Backward compatibility for legacy data formats
- **User Data Integrity**: Full user objects preserved across all operations

### 🎯 **Verbosity & Message Length (v1.13.11)**
- **Dynamic Token Limits**: Message length automatically adjusts based on user verbosity settings
- **Very Verbose Users**: 500 token limit for extremely detailed messages
- **Verbose Users**: 300 token limit for moderately detailed messages
- **Cutoff Prevention**: Enhanced prompts prevent message truncation
- **Explicit Instructions**: AI receives clear guidance about message length expectations
- **Debug Logging**: Token limits tracked and logged for troubleshooting

### 📊 **Previous Updates (v1.7.0)**

Station V previously received major enhancements with powerful batch user generation and data management capabilities:

### 🚀 **Batch User Generation System**
-   **Personality Templates**: 8 predefined archetypes (Chatterbox, Polite Academic, Sarcastic Gamer, Mysterious Cypher, etc.)
-   **AI-Assisted Generation**: Let Gemini AI create unique, creative personalities automatically
-   **Randomization Engine**: Generate diverse users with smart random attributes and unique nicknames
-   **Mass Add Interface**: Create 1-50 users at once with live preview and customization options
-   **Template Customization**: Mix predefined templates with randomization for perfect control

### 📊 **Import/Export System**
-   **CSV Support**: Export/import users in spreadsheet format for easy editing and sharing
-   **JSON Support**: Export/import complete user objects with all attributes for full data portability
-   **File Validation**: Automatic format detection with helpful error messages and format examples
-   **Backup & Sharing**: Easy data backup and community sharing capabilities

### 🎭 **Advanced User Customization Interface**
-   **Language Skills Configuration**: Set fluency levels (Beginner to Native), add multiple languages, and specify accents/dialects
-   **Writing Style Controls**: Configure formality, verbosity, humor levels, emoji usage, and punctuation styles
-   **Enhanced User Display**: User cards now show fluency badges and detailed attribute information
-   **Dynamic Language Management**: Add and remove multiple languages for multilingual AI users
-   **Comprehensive Form Validation**: Real-time validation for all new user attributes

### 🤖 **Enhanced AI Behavior**
-   **Style-Consistent Responses**: AI users now maintain consistent writing styles across all interactions
-   **Language-Aware Generation**: AI considers user's language skills and fluency levels when generating messages
-   **Character Depth**: More realistic and varied AI responses based on detailed user characteristics
-   **Improved Random Generation**: AI now generates users with varied language skills and writing styles

### 🎨 **Modern Configuration Interface**
-   **Visual User Management**: Add, edit, and delete virtual users with dedicated forms and real-time validation
-   **Visual Channel Management**: Create and manage channels with intuitive cards and comprehensive validation
-   **Form Validation**: Real-time validation with helpful error messages for nicknames, personalities, channel names, and topics
-   **Cancel Functionality**: Browse settings without applying changes using the Cancel button or Escape key

### 🧹 **Clear All Functionality**
-   **Clear All Users**: Red button with trash icon to remove all virtual users at once
-   **Clear All Channels**: Red button with trash icon to remove all channels at once
-   **Smart Visibility**: Clear buttons only appear when there are items to clear
-   **Safety Features**: Confirmation dialogs with exact counts and warning messages
-   **Custom World Building**: Easily start fresh and build completely custom virtual worlds

### ⚡ **Performance Improvements**
-   **More Frequent Messages**: Autonomous AI messages are now 3x more frequent across all speed settings
-   **Enhanced API Resilience**: Automatic retry mechanism with exponential backoff for better stability
-   **Smart Error Handling**: Graceful handling of API rate limits with user-friendly feedback

### 🎯 **User Experience Enhancements**
-   **Keyboard Shortcuts**: Escape key support for all modals
-   **Visual Feedback**: Status badges, color-coded elements, and hover effects
-   **Responsive Design**: Better layout and spacing for different screen sizes
-   **Professional Styling**: Modern card-based interface with smooth transitions
-   **Chat Log Database**: Persistent storage of all messages with export and management features

## 7. Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Vite** - Fast build tool and development server

### AI & APIs
- **Google Gemini API** - AI model for message generation and user creation
- **@google/genai** - Official Google Gemini AI client library

### Development Tools
- **ESLint** - Code linting and style enforcement
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking and compilation

### Browser Requirements
- **Modern Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers** - Fully compatible with iOS Safari, Chrome Mobile, Firefox Mobile
- **JavaScript Enabled** - Required for React application
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Local Storage** - Used for saving configuration and channel logs

## 8. Frequently Asked Questions (FAQ)

### Getting Started

**Q: Do I need to install anything to run Station V?**
A: You need Node.js (version 16+) and a Google Gemini API key. The application runs in your browser but requires a development server to be started.

**Q: Is this free to use?**
A: Station V itself is free and open source. However, it requires a Google Gemini API key, which has usage costs. You can get free credits from Google AI Studio to try it out.

**Q: Can I run this without an API key?**
A: No, Station V requires a valid Gemini API key to function. The AI generates all the virtual users and their messages.

**Q: How do I get a Gemini API key?**
A: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create a free account. You'll get free credits to start with.

### Configuration & Setup

**Q: Where are my settings saved?**
A: All settings are saved in your browser's localStorage, so they persist between sessions but are specific to each browser/device.

**Q: Can I share my configuration with others?**
A: Yes! Use the Import/Export feature in User Management to export your users as CSV or JSON files, which can be shared with others.

**Q: What's the difference between the AI models?**
A: The available models are dynamically loaded from Google's Gemini API, so the exact models may vary based on your API key and current availability. Generally:
- **Gemini 2.5 Flash**: Fastest responses, lowest cost, good for casual use
- **Gemini 1.5 Flash**: Balanced speed and quality, low cost  
- **Gemini 1.5 Pro**: Highest quality responses, higher cost, best for complex conversations
- **Other models** may appear based on your API access and Google's current offerings

**Q: Can I change the AI model after starting?**
A: Yes! Go to Settings and change the AI model. It will apply to all new AI messages immediately.

### User Management

**Q: How many virtual users can I have?**
A: There's no hard limit, but more users will increase API usage. Start with 5-10 users and add more as needed.

**Q: Can I edit users after creating them?**
A: Yes! Click the "Edit" button on any user card to modify their personality, language skills, or writing style.

**Q: What's the difference between single user creation and mass generation?**
A: Single creation gives you full control over each user's attributes. Mass generation creates multiple users quickly using templates or AI generation.

**Q: Can I import users from other sources?**
A: Yes! Use the Import/Export feature to import users from CSV or JSON files. You can also create users in a spreadsheet and import them.

**Q: Can I write personality descriptions in different languages?**
A: Yes! You can write personality descriptions in any language. The AI will understand and work with multilingual descriptions. Examples: "Passionate about technology" (English), "Apasionado por la música y el arte" (Spanish), "愛好技術和編程的工程師" (Chinese).

**Q: Can I import channels from other configurations?**
A: Yes! In Channel Management, click "Import/Export" to import channels from CSV or JSON files. This allows you to share channel configurations between different World Editor setups.

### Channels & Messaging

**Q: How do I create channels?**
A: In Settings, go to Channel Management and click "Add Channel". Channel names must start with `#` (e.g., `#general`).

**Q: Can I have private channels?**
A: Currently, all channels are public. Private messaging is available for one-on-one conversations with individual users.

**Q: How do I join a channel?**
A: Click on any channel name in the left panel to join it. You'll see the channel's messages and users.

**Q: What IRC commands are supported?**
A: Station V supports many IRC commands including `/nick`, `/join`, `/me`, `/who`, `/help`, `/kick`, `/ban`, and more. Type `/help` for a full list.

### AI Behavior & Simulation

**Q: Why aren't the AI users talking?**
A: Check your simulation speed setting. If it's set to "Off", AI users will only respond to your messages. Try "Slow" or "Normal" for background activity.

**Q: How do I make the AI more active?**
A: Increase the simulation speed to "Fast" or "Normal" in Settings. You can also send messages to trigger AI responses.

**Q: Why do AI users sometimes give weird responses?**
A: AI responses can vary based on the model, temperature settings, and context. Try switching to a different AI model or adjusting user personalities.

**Q: Can I control what AI users talk about?**
A: Yes! Set channel topics and user personalities to guide conversations. AI users will reference channel topics and maintain their personalities.

### Technical Issues

**Q: I'm getting "npm is not recognized" errors.**
A: You need to install Node.js from [nodejs.org](https://nodejs.org/). This includes npm, which is required to run the development server.

**Q: The app won't start or shows errors.**
A: Check that you have a valid `GEMINI_API_KEY` in your `.env` file and that Node.js is properly installed.

**Q: I'm getting API rate limit errors.**
A: Reduce the simulation speed to "Slow" or "Off" in Settings. Free API keys have strict rate limits.

**Q: The app is slow or unresponsive.**
A: Try reducing the number of virtual users, lowering the simulation speed, or switching to a faster AI model.

**Q: My chat logs disappeared.**
A: Logs are saved in browser localStorage. They might be cleared if you clear browser data or use incognito mode.

### Debugging & Troubleshooting

**Q: How can I see what's happening behind the scenes?**
A: Enable debug logging in Settings. This will show detailed logs in the browser console about AI requests and responses.

**Q: The AI isn't responding to my messages.**
A: Check the browser console for errors, ensure your API key is valid, and try reducing the simulation speed.

**Q: Users are saying inappropriate things.**
A: AI responses can sometimes be unpredictable. You can edit user personalities to be more appropriate or delete problematic users.

**Q: How do I report bugs or get help?**
A: Check the browser console for error messages, enable debug logging, and ensure your API key has sufficient quota.

### Data & Privacy

**Q: Is my data sent to external servers?**
A: Only your API key and AI prompts are sent to Google's Gemini API. Your configuration and chat logs stay in your browser.

**Q: Can I backup my configuration?**
A: Yes! Use the Import/Export feature to save your users and channels. Your settings are also saved in localStorage.

**Q: What happens if I clear my browser data?**
A: Your configuration and chat logs will be lost. Make sure to export your data before clearing browser data.

**Q: Can I use this offline?**
A: No, Station V requires an internet connection to communicate with the Gemini API for AI responses.

## 9. TODO List

### Planned Features

- **Real IRC Server Integration**: Add support for connecting users to real-world IRC servers using the [node-irc](https://github.com/martynsmith/node-irc) client library
  - Enable users to connect to actual IRC networks (Freenode, Libera, etc.)
  - Bridge between virtual AI users and real IRC channels
  - Allow real IRC users to interact with AI personalities
  - Maintain the simulation experience while adding real-world connectivity
  - Configure autonomous chat frequency (default=OFF, but configurable similar to the simulated personalities)


- **Enhanced User Attribute Options**: Expand customization options for user personality traits
  - **Formality**: More granular levels (Ultra-formal, Very formal, Formal, Semi-formal, Casual, Very casual, Ultra-casual)
  - **Verbosity**: Extended range (Terse, Brief, Moderate, Detailed, Verbose, Extremely verbose, Novel-length)
  - **Humor**: Extreme humor levels (None, Dry, Mild, Moderate, Witty, Sarcastic, Absurd, Chaotic, Unhinged)
  - **Emoji Usage**: Expanded emoji frequency (None, Rare, Occasional, Moderate, Frequent, Excessive, Emoji-only responses)
  - **Punctuation**: Detailed punctuation styles (Minimal, Standard, Expressive, Dramatic, Chaotic, Artistic, Experimental)

## 10. Author & Contact

**Station V - Virtual IRC Simulator** is developed by:

**Timo Pitkänen**
- **Email**: timbor@saunagames.fi
- **Website**: [www.saunagames.fi/timbor](https://www.saunagames.fi/timbor)

For questions, bug reports, or collaboration opportunities, please feel free to reach out!

## 11. Known Issues

### API Rate Limit & Quota Errors

-   **The Problem**: The most common issue is an error message like `API request failed (rate limit or server issue)`. This happens because the simulation, especially on faster settings, makes frequent, autonomous calls to the Gemini API to generate background chatter. Free-tier API keys have strict rate limits that can be quickly consumed.
-   **"My Quota Dashboard Looks Fine, Why Am I Getting Errors?"**: This is a common point of confusion. API providers use multiple layers of protection. While your overall daily quota (e.g., requests per day) might be fine, you can easily hit a much stricter **short-term rate limit** (e.g., requests per minute). The simulator's rapid, periodic calls are likely to trigger these per-minute limits. Additionally, a `RESOURCE_EXHAUSTED` error can sometimes indicate temporary high load on Google's servers, not a problem with your specific quota.
-   **The Solution**: You have direct control over how frequently the AI generates background messages.
    -   Open the **Settings** modal (gear icon in the channel list).
    -   Under **"Background Simulation Speed,"** select a slower setting like `'Slow'` or `'Off'`.
    -   Current simulation intervals:
        -   **Fast**: 15 seconds (responsive, moderate API usage)
        -   **Normal**: 30 seconds (balanced, low API usage)
        -   **Slow**: 60 seconds (conservative, very low API usage)
        -   **Off**: No autonomous messages (most quota-friendly)
    -   Setting the speed to **'Off'** completely disables autonomous AI messages. The AI will *only* respond when you send a message, which is the most effective way to conserve your API quota and avoid rate-limit errors.
    -   The simulation also automatically pauses when the browser tab is not visible, helping to save your quota when you're not actively looking at the app.
