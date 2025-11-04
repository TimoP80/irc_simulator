# API Key Validation Guide

## Overview

A comprehensive API key validation system has been added to Station V to help diagnose and fix API key issues. When you see a 400 error or models won't load, the system will now detect and warn you about invalid API keys.

## What's New

### 1. **Automatic API Key Validation**
- Validates your Gemini API key when the Settings modal opens
- Checks for common issues like invalid, expired, or unauthorized keys
- Displays clear error messages with solutions

### 2. **Visual Warnings**
- **Top Banner**: Shows a prominent warning at the top of Settings if there's an issue
- **Model Section**: Displays specific error messages near the AI model selector
- **Troubleshooting Box**: Provides helpful information about common API key issues

### 3. **Manual Validation Button**
- Click "Validate API Key" to manually test your API key
- Get immediate feedback on whether your key is valid
- Helpful error messages explain what's wrong

## How to Use

### Automatic Validation

1. Open Settings (⚙️ icon)
2. If your API key is invalid, you'll see:
   - 🔴 Red warning banner at the top
   - ⚠️ Error message in the AI Model section
   - 💡 Troubleshooting tips

### Manual Validation

1. Open Settings
2. Scroll to the "AI Model" section
3. Click the **"Validate API Key"** button
4. Wait for the validation to complete
5. You'll see either:
   - ✅ "API key is valid!" - Your key works!
   - ❌ Error message - See solutions below

## Error Messages & Solutions

### Error: "Invalid API key (400 Bad Request)"
**Cause**: Your API key is malformed or doesn't exist

**Solutions**:
1. Get a fresh API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Make sure you copied the entire key (no spaces before/after)
3. Paste it in Settings → AI Model section
4. Click "Validate API Key" to test

### Error: "API key is not authorized (401)"
**Cause**: Your API key exists but doesn't have permission

**Solutions**:
1. Check that you're using a Gemini API key (not a different Google API key)
2. Verify the key is from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Try regenerating the key in Google AI Studio
4. Make sure you're not using a service account key

### Error: "API key does not have permission (403)"
**Cause**: Your API key is restricted or has limited permissions

**Solutions**:
1. Check your API key restrictions in Google AI Studio
2. Make sure the key allows access to Gemini API
3. Try creating a new unrestricted key
4. Check if your Google account has billing enabled

### Error: "Failed to fetch models: [status] [message]"
**Cause**: Network issue or API service problem

**Solutions**:
1. Check your internet connection
2. Try again in a few moments (API might be temporarily down)
3. Check [Google Cloud Status](https://status.cloud.google.com/)
4. If problem persists, try a fresh API key

## Common Issues

### "I see 400 errors in the console"
This usually means your API key is invalid. The system will now warn you about this automatically.

**Fix**: 
1. Open Settings
2. Look for the red warning banner
3. Follow the troubleshooting steps
4. Get a fresh API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### "Models won't load"
If the model list is empty or shows "Using fallback models", your API key might be invalid.

**Fix**:
1. Click "Validate API Key" button
2. If it fails, get a new API key
3. Paste the new key in Settings
4. Refresh the page

### "I keep getting errors even with a new key"
This might be a service issue or account problem.

**Fix**:
1. Make sure you're using [Google AI Studio](https://makersuite.google.com/app/apikey) (not Google Cloud Console)
2. Check that your Google account has billing enabled
3. Try in an incognito/private browser window
4. Check the browser console for detailed error messages

## Technical Details

### Validation Process

The validation function:
1. Checks if you're using Vertex AI (no validation needed)
2. Verifies the API key is set
3. Makes a test request to the Gemini API
4. Checks the HTTP status code:
   - 400 = Invalid key
   - 401 = Unauthorized
   - 403 = Forbidden/No permission
   - Other = Network or service error
5. Returns clear error message or success

### Where Validation Happens

- **On Settings Open**: Automatic validation when you open Settings
- **On Button Click**: Manual validation when you click "Validate API Key"
- **On Model Fetch**: Validation happens when loading available models

### Error Handling

The system gracefully handles:
- Missing API keys
- Network errors
- API service errors
- Invalid responses
- Timeout issues

## Getting a Valid API Key

### Step 1: Go to Google AI Studio
Visit: https://makersuite.google.com/app/apikey

### Step 2: Create or Copy Your Key
- Click "Create API key"
- Or copy an existing key
- Make sure it's a Gemini API key (not a different service)

### Step 3: Paste in Settings
1. Open Station V Settings
2. Scroll to "AI Model" section
3. Paste your key in the API key field
4. Click "Validate API Key"

### Step 4: Verify
- You should see ✅ "API key is valid!"
- Models should load successfully
- Simulation should work without 400 errors

## Troubleshooting Checklist

- [ ] API key is from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] API key is copied completely (no spaces)
- [ ] API key is pasted in the correct field
- [ ] You clicked "Validate API Key" to test
- [ ] Your Google account has billing enabled
- [ ] You're not using a service account key
- [ ] Your internet connection is working
- [ ] You tried refreshing the page
- [ ] You tried a fresh API key

## Still Having Issues?

1. **Check the browser console** (F12 → Console tab) for detailed error messages
2. **Look at the debug logs** in Settings → Debug section
3. **Try the troubleshooting box** in Settings → Image Generation section
4. **Get a fresh API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Related Documentation

- [README.md](README.md) - General setup instructions
- [VERTEX_AI_SETUP.md](VERTEX_AI_SETUP.md) - Vertex AI authentication
- [RATE_LIMIT_FIX.md](RATE_LIMIT_FIX.md) - Rate limiting and quota issues

## Summary

The new API key validation system helps you:
✅ Detect invalid API keys automatically
✅ Understand what's wrong with clear error messages
✅ Fix issues quickly with troubleshooting tips
✅ Validate keys manually anytime
✅ Avoid confusing 400 errors

**Happy simulating!** 🚀

