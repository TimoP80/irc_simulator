# Vertex AI Integration Guide

This guide explains how to configure the IRC Simulator to use Google Cloud's Vertex AI instead of the standard Gemini API key authentication.

## Overview

The application now supports two authentication methods:
1. **API Key Authentication** (default) - Uses `GEMINI_API_KEY` from Google AI Studio
2. **Vertex AI Authentication** - Uses Google Cloud Project credentials

## Why Use Vertex AI?

- **Enterprise Features**: Access to enterprise-grade features and SLAs
- **Better Quota Management**: Higher rate limits and better quota control
- **Advanced Security**: Integration with Google Cloud IAM and security features
- **Cost Management**: Better cost tracking and billing integration with Google Cloud
- **Regional Deployment**: Deploy models in specific regions for compliance

## Prerequisites

1. **Google Cloud Account**: You need an active Google Cloud account
2. **Google Cloud Project**: Create or use an existing project
3. **Vertex AI API Enabled**: Enable the Vertex AI API in your project
4. **Authentication Setup**: Configure Application Default Credentials (ADC)

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID** (e.g., `gen-lang-client-0199557163`)

### Step 2: Enable Vertex AI API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Vertex AI API"
3. Click **Enable**

### Step 3: Set Up Authentication

You have several options for authentication:

#### Option A: Application Default Credentials (Recommended for Development)

```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install

# Authenticate with your Google account
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

#### Option B: Service Account (Recommended for Production)

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., `vertex-ai-service`)
4. Grant the role: **Vertex AI User**
5. Click **Create Key** and download the JSON file
6. Set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

### Step 4: Configure Environment Variables

Update your `.env` file:

```env
# Set to true to enable Vertex AI
USE_VERTEX_AI=true

# Your Google Cloud Project ID
VERTEX_AI_PROJECT=gen-lang-client-0199557163

# Region where you want to use Vertex AI (default: us-central1)
VERTEX_AI_LOCATION=us-central1

# Keep this for fallback or when USE_VERTEX_AI=false
GEMINI_API_KEY=your_api_key_here
```

### Step 5: Choose Your Region

Available regions for Vertex AI:
- `us-central1` (Iowa, USA)
- `us-east4` (Northern Virginia, USA)
- `us-west1` (Oregon, USA)
- `europe-west1` (Belgium)
- `europe-west4` (Netherlands)
- `asia-northeast1` (Tokyo, Japan)
- `asia-southeast1` (Singapore)

Choose based on:
- **Latency**: Pick the region closest to your users
- **Compliance**: Some regions may be required for data residency
- **Availability**: Check which models are available in each region

## Configuration Examples

### Example 1: Development Setup (API Key)

```env
USE_VERTEX_AI=false
GEMINI_API_KEY=AIzaSyB_4TBuMUiBrwnGc300B3DqGOTrtdtlN64
```

### Example 2: Production Setup (Vertex AI)

```env
USE_VERTEX_AI=true
VERTEX_AI_PROJECT=my-production-project
VERTEX_AI_LOCATION=us-central1
```

### Example 3: Hybrid Setup

```env
# Use Vertex AI but keep API key as fallback
USE_VERTEX_AI=true
VERTEX_AI_PROJECT=my-project
VERTEX_AI_LOCATION=us-central1
GEMINI_API_KEY=AIzaSyB_4TBuMUiBrwnGc300B3DqGOTrtdtlN64
```

## Available Models in Vertex AI

When using Vertex AI, you can use these models:
- `gemini-1.5-flash` - Fast and versatile
- `gemini-1.5-flash-001` - Specific version
- `gemini-1.5-pro` - Advanced reasoning
- `gemini-2.0-flash` - Latest generation

## Troubleshooting

### Error: "VERTEX_AI_PROJECT environment variable is required"

**Solution**: Make sure you've set `VERTEX_AI_PROJECT` in your `.env` file when `USE_VERTEX_AI=true`

### Error: "Could not load the default credentials"

**Solution**: 
1. Run `gcloud auth application-default login`
2. Or set `GOOGLE_APPLICATION_CREDENTIALS` to your service account key path

### Error: "Permission denied"

**Solution**: 
1. Ensure your account/service account has the "Vertex AI User" role
2. Check that the Vertex AI API is enabled in your project

### Error: "Model not found"

**Solution**: 
1. Verify the model is available in your selected region
2. Check the model name is correct (e.g., `gemini-1.5-flash`)

### Model listing shows default models instead of API models

**Note**: When using Vertex AI, the application uses a default list of common models instead of fetching from the API. This is expected behavior as Vertex AI uses different authentication mechanisms.

## Switching Between API Key and Vertex AI

You can easily switch between authentication methods:

1. **To use API Key**: Set `USE_VERTEX_AI=false` in `.env`
2. **To use Vertex AI**: Set `USE_VERTEX_AI=true` in `.env`
3. Restart the application

## Cost Considerations

- **API Key**: Pay-as-you-go pricing, billed through Google AI Studio
- **Vertex AI**: Billed through Google Cloud, may have different pricing
- Check current pricing: [Vertex AI Pricing](https://cloud.google.com/vertex-ai/pricing)

## Security Best Practices

1. **Never commit** `.env` files or service account keys to version control
2. **Use service accounts** in production, not personal credentials
3. **Rotate keys** regularly
4. **Use least privilege**: Only grant necessary permissions
5. **Monitor usage**: Set up billing alerts in Google Cloud Console

## Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud IAM](https://cloud.google.com/iam/docs)
- [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your Google Cloud project settings
3. Ensure all required APIs are enabled
4. Check your authentication credentials

## Example Code

The integration is handled automatically by the `vertexAIService.ts` module. Here's how it works:

```typescript
import { getAIService } from './vertexAIService';

// This automatically uses either Vertex AI or API key based on configuration
const ai = getAIService();

// Use it the same way regardless of authentication method
const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Hello!' }] }]
});
```

## Migration Checklist

- [ ] Create Google Cloud project
- [ ] Enable Vertex AI API
- [ ] Set up authentication (ADC or service account)
- [ ] Update `.env` file with Vertex AI settings
- [ ] Test the application
- [ ] Monitor usage and costs
- [ ] Set up billing alerts (recommended)

