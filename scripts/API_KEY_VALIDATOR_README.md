# API Key Validator Tool

A command-line utility to test and validate your Gemini API key before using it in the Station V IRC Simulator.

## Features

✅ **Test API key from .env file** - Quickly verify your configured API key  
✅ **Interactive validation** - Supply and test any API key in a separate window  
✅ **Detailed error messages** - Get specific feedback on what's wrong  
✅ **Troubleshooting tips** - Helpful suggestions for common issues  
✅ **Colored output** - Easy-to-read console output with color coding  

## Installation

The script is already included in the project. No additional installation needed.

## Usage

### Running the Script

```bash
node scripts/test-api-key.js
```

Or with npm (if configured in package.json):

```bash
npm run test-api-key
```

### Main Menu Options

When you run the script, you'll see a menu with three options:

```
🎯 API Key Test Tool
====================

Choose an option:
1. Test API key from .env file
2. Validate a custom API key
3. Exit
```

### Option 1: Test API key from .env file

This option reads your `.env` file and validates the `GEMINI_API_KEY` environment variable.

**Steps:**
1. Select option `1`
2. The script will:
   - Look for `.env` file in the project root
   - Extract the `GEMINI_API_KEY` value
   - Display the key preview (first 10 characters)
   - Show if the key starts with "AIza" (valid format)

**Example Output:**
```
🧪 Simple API Key Test
======================
🔍 API Key found: YES
🔍 API Key preview: AIzaSyD...
🔍 API Key starts with AIza: YES
✅ Test completed!
```

### Option 2: Validate a custom API key

This option allows you to enter any API key and validate it against the Gemini API.

**Steps:**
1. Select option `2`
2. You'll see instructions:
   ```
   📝 Instructions:
   1. Get your API key from: https://makersuite.google.com/app/apikey
   2. Click "Create API key" if you don't have one
   3. Copy the key and paste it below
   ```
3. Enter your API key when prompted
4. The script will validate it and show the result

**Success Response:**
```
📊 Validation Result:
====================
✅ SUCCESS: Your API key is valid!

You can now use this key in the application.
```

**Error Response:**
```
📊 Validation Result:
====================
❌ FAILED: Invalid API key. Please check your Gemini API key.

Troubleshooting tips:
• Make sure you're using a Gemini API key (not Cloud Console)
• Check that your Google account has billing enabled
• Try creating a new API key at: https://makersuite.google.com/app/apikey
• Check your internet connection
```

### Option 3: Exit

Closes the script.

## Getting a Valid API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the generated key
5. Use it in the validator or add to your `.env` file:
   ```
   GEMINI_API_KEY=your_key_here
   ```

## Common Issues & Solutions

### ❌ Invalid API key (400 Bad Request)

**Cause:** The API key is malformed or doesn't exist

**Solutions:**
- Get a fresh key from https://makersuite.google.com/app/apikey
- Make sure you're not using a Cloud Console key
- Check that you copied the entire key without extra spaces

### ❌ Not authorized (401)

**Cause:** The key exists but doesn't have permission

**Solutions:**
- Verify you're using a Gemini API key (not Cloud Console)
- Try creating a new key at https://makersuite.google.com/app/apikey
- Check your Google account permissions

### ❌ Forbidden (403)

**Cause:** Key is restricted or no permission to access

**Solutions:**
- Enable billing on your Google account
- Check key restrictions in Google AI Studio
- Try creating a new key

### ❌ Network error

**Cause:** Connection or service issue

**Solutions:**
- Check your internet connection
- Try again in a few moments
- Check if Google's API service is operational

## Integration with Application

Once you've validated your API key:

1. **In the Application:**
   - Open Settings (⚙️)
   - Scroll to "AI Model" section
   - Paste your API key
   - Click "Validate API Key" button

2. **In .env file:**
   - Add: `GEMINI_API_KEY=your_validated_key`
   - Restart the application

## Troubleshooting

### Script won't run

```bash
# Make sure Node.js is installed
node --version

# Make sure you're in the project directory
cd /path/to/irc_simulator

# Try running with explicit node path
/usr/bin/node scripts/test-api-key.js
```

### Input not working

- Make sure your terminal supports interactive input
- Try running in a different terminal
- Check that stdin is not redirected

### API validation always fails

- Check your internet connection
- Verify the API key is correct
- Try the key in https://makersuite.google.com/app/apikey directly
- Check if Google's API service is down

## Technical Details

### Validation Process

The script validates your API key by:

1. Checking if the key is empty
2. Making a test request to: `https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY`
3. Analyzing the HTTP response:
   - **200 OK** = Valid key ✅
   - **400 Bad Request** = Invalid key ❌
   - **401 Unauthorized** = Not authorized ❌
   - **403 Forbidden** = No permission ❌
   - **Other** = Network/service error ❌

### Security

- The script does NOT store your API key
- The key is only used for validation
- No data is sent to external services except Google's API
- The key is never logged or saved

## Support

For issues with:
- **API Key generation:** Visit https://makersuite.google.com/app/apikey
- **Billing:** Check https://console.cloud.google.com/billing
- **Application:** Check the main README.md

