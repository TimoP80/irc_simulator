# Vertex AI Integration Summary

## Overview

This document summarizes the Vertex AI authentication integration into the IRC Simulator application. The integration allows the application to use Google Cloud's Vertex AI instead of (or in addition to) the standard Gemini API key authentication.

## Changes Made

### 1. New Files Created

#### `services/vertexAIService.ts`
- **Purpose**: Central service for managing AI authentication
- **Key Functions**:
  - `getAIServiceConfig()`: Reads environment variables and determines authentication method
  - `createAIService()`: Creates GoogleGenAI instance with appropriate configuration
  - `getAIService()`: Singleton pattern to get/create AI service instance
  - `resetAIService()`: Utility to reset the service (useful for testing)

#### `VERTEX_AI_SETUP.md`
- **Purpose**: Comprehensive setup guide for Vertex AI
- **Contents**:
  - Prerequisites and requirements
  - Step-by-step setup instructions
  - Authentication options (ADC vs Service Account)
  - Configuration examples
  - Troubleshooting guide
  - Security best practices

#### `examples/vertex-ai-example.ts`
- **Purpose**: Example code demonstrating Vertex AI usage
- **Contents**:
  - Basic usage example
  - Model selection examples
  - Chat conversation example
  - Error handling patterns

#### `INTEGRATION_SUMMARY.md`
- **Purpose**: This document - summary of all changes

### 2. Modified Files

#### `.env`
**Changes**:
- Added `USE_VERTEX_AI` flag (default: false)
- Added `VERTEX_AI_PROJECT` for Google Cloud project ID
- Added `VERTEX_AI_LOCATION` for region selection (default: us-central1)

**Example**:
```env
GEMINI_API_KEY=AIzaSyB_4TBuMUiBrwnGc300B3DqGOTrtdtlN64

# Vertex AI Configuration
USE_VERTEX_AI=false
VERTEX_AI_PROJECT=gen-lang-client-0199557163
VERTEX_AI_LOCATION=us-central1
```

#### `types.ts`
**Changes**:
- Added `vertexAI` configuration to `AppConfig` interface
- New fields: `enabled`, `project`, `location`

**Code**:
```typescript
vertexAI?: {
  enabled: boolean;
  project: string;
  location: string;
};
```

#### `services/geminiService.ts`
**Changes**:
- Removed direct `GoogleGenAI` instantiation
- Imported and used `getAIService()` from `vertexAIService`
- Updated authentication status logging to show Vertex AI or API key mode
- Modified `listAvailableModels()` to return default models for Vertex AI
- Modified `getModelInfo()` to handle Vertex AI authentication

**Key Changes**:
```typescript
// Before
const ai = new GoogleGenAI({ apiKey: API_KEY });

// After
import { getAIService, getAIServiceConfig } from './vertexAIService.js';
const ai = getAIService();
```

#### `services/botService.ts`
**Changes**:
- Removed direct `GoogleGenAI` instantiation
- Imported and used `getAIService()` from `vertexAIService`

#### `services/audioService.ts`
**Changes**:
- Removed direct `GoogleGenAI` instantiation
- Imported and used `getAIService()` from `vertexAIService`

#### `services/visionService.ts`
**Changes**:
- Removed direct `GoogleGenAI` instantiation
- Imported and used `getAIService()` from `vertexAIService`

#### `services/usernameGeneration.ts`
**Changes**:
- Removed direct `GoogleGenAI` instantiation
- Imported and used `getAIService()` from `vertexAIService`

#### `vite.config.ts`
**Changes**:
- Added environment variable definitions for Vertex AI
- Added console logging for Vertex AI configuration
- Exposed `USE_VERTEX_AI`, `VERTEX_AI_PROJECT`, `VERTEX_AI_LOCATION` to the application

**Code**:
```typescript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.USE_VERTEX_AI': JSON.stringify(env.USE_VERTEX_AI),
  'process.env.VERTEX_AI_PROJECT': JSON.stringify(env.VERTEX_AI_PROJECT),
  'process.env.VERTEX_AI_LOCATION': JSON.stringify(env.VERTEX_AI_LOCATION),
  'process.env.ELECTRON': JSON.stringify(isElectron)
}
```

#### `README.md`
**Changes**:
- Added mention of Vertex AI as an authentication option
- Added link to `VERTEX_AI_SETUP.md`
- Updated `.env` example to include Vertex AI variables

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Start                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              getAIServiceConfig()                            │
│  Reads: USE_VERTEX_AI, VERTEX_AI_PROJECT,                   │
│         VERTEX_AI_LOCATION, GEMINI_API_KEY                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                    ┌─────────┐
                    │ Config  │
                    └────┬────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌────────────────┐            ┌──────────────────┐
│ USE_VERTEX_AI  │            │ USE_VERTEX_AI    │
│    = true      │            │    = false       │
└────────┬───────┘            └────────┬─────────┘
         │                             │
         ▼                             ▼
┌────────────────┐            ┌──────────────────┐
│ GoogleGenAI({  │            │ GoogleGenAI({    │
│  vertexai:true,│            │  apiKey: KEY     │
│  project: ..., │            │ })               │
│  location: ... │            │                  │
│ })             │            │                  │
└────────┬───────┘            └────────┬─────────┘
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  AI Service      │
              │  Instance        │
              └──────────────────┘
```

### Service Integration

All AI-dependent services now use the centralized `getAIService()`:

```
┌─────────────────────────────────────────────────────────────┐
│                   vertexAIService.ts                         │
│                   getAIService()                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │ gemini   │    │  bot     │   │  audio   │
    │ Service  │    │ Service  │   │ Service  │
    └──────────┘    └──────────┘   └──────────┘
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │ vision   │    │ username │   │  image   │
    │ Service  │    │Generation│   │Generation│
    └──────────┘    └──────────┘   └──────────┘
```

## Configuration Options

### Option 1: API Key (Default)
```env
USE_VERTEX_AI=false
GEMINI_API_KEY=your_api_key_here
```

### Option 2: Vertex AI
```env
USE_VERTEX_AI=true
VERTEX_AI_PROJECT=your-project-id
VERTEX_AI_LOCATION=us-central1
```

### Option 3: Hybrid (Vertex AI with API Key fallback)
```env
USE_VERTEX_AI=true
VERTEX_AI_PROJECT=your-project-id
VERTEX_AI_LOCATION=us-central1
GEMINI_API_KEY=your_api_key_here
```

## Benefits

1. **Flexibility**: Easy switching between API key and Vertex AI
2. **Enterprise Ready**: Support for Google Cloud enterprise features
3. **Better Quotas**: Access to higher rate limits with Vertex AI
4. **Regional Deployment**: Choose specific regions for compliance
5. **Centralized Management**: Single point of configuration
6. **Backward Compatible**: Existing API key setup continues to work

## Testing

To test the integration:

1. **API Key Mode**:
   ```bash
   # Set in .env
   USE_VERTEX_AI=false
   GEMINI_API_KEY=your_key
   
   # Run the app
   npm run dev
   ```

2. **Vertex AI Mode**:
   ```bash
   # Set in .env
   USE_VERTEX_AI=true
   VERTEX_AI_PROJECT=your_project
   VERTEX_AI_LOCATION=us-central1
   
   # Authenticate
   gcloud auth application-default login
   
   # Run the app
   npm run dev
   ```

3. **Check Console Logs**:
   - Look for "VERTEX AI AUTHENTICATION" or "GEMINI API KEY STATUS"
   - Verify the correct mode is active

## Migration Guide

### For Existing Users

No changes required! The default configuration uses API key authentication, so existing setups will continue to work without modification.

### To Enable Vertex AI

1. Follow the setup guide in `VERTEX_AI_SETUP.md`
2. Update your `.env` file
3. Restart the application

## Security Considerations

1. **API Keys**: Never commit `.env` files to version control
2. **Service Accounts**: Use service accounts in production
3. **Permissions**: Grant only necessary IAM permissions
4. **Rotation**: Regularly rotate credentials
5. **Monitoring**: Set up billing alerts in Google Cloud

## Future Enhancements

Potential future improvements:
- UI toggle to switch between authentication modes
- Configuration persistence in app settings
- Support for multiple Vertex AI projects
- Advanced quota management
- Cost tracking integration

## Support

For issues or questions:
1. Check `VERTEX_AI_SETUP.md` for setup help
2. Review console logs for error messages
3. Verify Google Cloud project configuration
4. Ensure required APIs are enabled

## References

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google GenAI SDK](https://github.com/google/generative-ai-js)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)

