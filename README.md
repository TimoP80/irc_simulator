# Station V - Virtual IRC Simulator

### An Experiment in AI-Simulated Social Environments

---

## 1. The Core Idea: What is This Project?

Station V - Virtual IRC Simulator is a web application that recreates the look and feel of a classic Internet Relay Chat (IRC) client with one fundamental difference: **you are the only human.**

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
-   **Batch User Generation**: Mass create users with powerful generation tools:
    -   **Personality Templates**: 8 predefined archetypes (Chatterbox, Polite Academic, Sarcastic Gamer, etc.)
    -   **AI-Assisted Generation**: Let Gemini AI create unique, creative personalities automatically
    -   **Randomization Engine**: Generate diverse users with smart random attributes and unique nicknames
    -   **Mass Add Interface**: Create 1-50 users at once with live preview and customization options
    -   **Template Customization**: Mix predefined templates with randomization for perfect control
-   **Import/Export System**: Full data portability for user management:
    -   **CSV Support**: Export/import users in spreadsheet format for easy editing
    -   **JSON Support**: Export/import complete user objects with all attributes
    -   **Backup & Sharing**: Easy data backup and community sharing capabilities
    -   **File Validation**: Automatic format detection with helpful error messages
-   **Classic IRC Experience**: The app features a familiar three-panel UI (channels, chat, user list), a retro monospace aesthetic, and support for essential commands like `/nick`, `/join`, and `/who`.
-   **Dynamic Conversations**: The simulation feels alive with both ambient background chatter generated by the AI users and direct, context-aware responses to your messages.
-   **Private Messaging**: Peel off from the main channels to have focused, one-on-one conversations with any AI personality.
-   **Realistic AI Personalities**: Each AI user has detailed language skills and writing styles that affect how they communicate:
    -   **Consistent Writing Styles**: AI users maintain their formality, verbosity, and humor levels across all interactions
    -   **Language-Aware Responses**: AI considers fluency levels and language preferences when generating messages
    -   **Character Depth**: More realistic conversations based on detailed personality and communication preferences
-   **Enhanced User Experience**: 
    -   **Cancel Button**: Browse settings without applying changes
    -   **Keyboard Shortcuts**: Escape key support for all modals
    -   **Form Validation**: Real-time validation with helpful error messages
    -   **Visual Feedback**: Status badges, color-coded elements, and hover effects

## 5. Getting Started

1.  Station V runs entirely in your browser. No installation is needed.
2.  Upon first launch, you will be greeted by a **Settings** modal with a modern, user-friendly interface.
3.  **Configure your world**: 
    -   **Set your nickname** in the text field at the top
    -   **Manage virtual users**: 
        -   **Single User Creation**: Use the "Add User" button for detailed customization:
            -   **Basic Information**: Set nickname and personality description
            -   **Language Skills**: Choose fluency level, add multiple languages, and set optional accents
            -   **Writing Style**: Configure formality, verbosity, humor, emoji usage, and punctuation
        -   **Mass User Generation**: Use the "Mass Add" button for batch creation:
            -   **Templates**: Choose from 8 predefined personality archetypes
            -   **AI Generation**: Let Gemini AI create unique, creative personalities
            -   **Random Generation**: Generate diverse users with randomized attributes
            -   **Customization**: Mix templates with randomization for perfect control
            -   **Quantity Control**: Generate 1-50 users at once with live preview
        -   **Import/Export**: Use the "Import/Export" button for data management:
            -   **Export**: Save users as CSV or JSON files for backup
            -   **Import**: Load users from CSV or JSON files
            -   **Sharing**: Share user collections with the community
        -   **User Management**: 
            -   Use the "Clear All" button to remove all users and start fresh
            -   Edit or delete individual users using the buttons on each user card
            -   View detailed user attributes including fluency badges and style information
    -   **Manage channels**: 
        -   Use the "Add Channel" button to create IRC channels with names (starting with #) and topics
        -   Use the "Clear All" button to remove all channels and start fresh
        -   Edit or delete individual channels using the buttons on each channel card
    -   **Adjust simulation speed**: Choose how frequently AI users generate autonomous messages (Fast/Normal/Slow/Off)
    -   **Browse without saving**: Use the "Cancel" button to explore settings without applying changes
4.  Click **"Save and Start"** to enter the simulation. Your configuration will be saved for your next visit.
5.  **Note**: Station V requires a valid Google Gemini API key to be present in the execution environment (`process.env.API_KEY`).

## 6. Recent Updates (v1.7.0)

Station V has recently received a major enhancement with powerful batch user generation and data management capabilities:

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

## 7. Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI**: Google Gemini API via the `@google/genai` npm package.

## 8. Known Issues

### API Rate Limit & Quota Errors

-   **The Problem**: The most common issue is an error message like `API request failed (rate limit or server issue)`. This happens because the simulation, especially on faster settings, makes frequent, autonomous calls to the Gemini API to generate background chatter. Free-tier API keys have strict rate limits that can be quickly consumed.
-   **"My Quota Dashboard Looks Fine, Why Am I Getting Errors?"**: This is a common point of confusion. API providers use multiple layers of protection. While your overall daily quota (e.g., requests per day) might be fine, you can easily hit a much stricter **short-term rate limit** (e.g., requests per minute). The simulator's rapid, periodic calls are likely to trigger these per-minute limits. Additionally, a `RESOURCE_EXHAUSTED` error can sometimes indicate temporary high load on Google's servers, not a problem with your specific quota.
-   **The Solution**: You have direct control over how frequently the AI generates background messages.
    -   Open the **Settings** modal (gear icon in the channel list).
    -   Under **"Background Simulation Speed,"** select a slower setting like `'Slow'` or `'Off'`.
    -   Current simulation intervals:
        -   **Fast**: 5 seconds (very frequent)
        -   **Normal**: 10 seconds (moderate)
        -   **Slow**: 20 seconds (conservative)
        -   **Off**: No autonomous messages (most quota-friendly)
    -   Setting the speed to **'Off'** completely disables autonomous AI messages. The AI will *only* respond when you send a message, which is the most effective way to conserve your API quota and avoid rate-limit errors.
    -   The simulation also automatically pauses when the browser tab is not visible, helping to save your quota when you're not actively looking at the app.
