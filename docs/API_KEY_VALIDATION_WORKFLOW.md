# API Key Validation Workflow

Complete guide for validating and using API keys in Station V IRC Simulator.

## 🎯 Two-Step Validation Process

### Step 1: Command-Line Validation (Optional but Recommended)

Use the API Key Validator script to test your key before entering it in the application.

```bash
node scripts/test-api-key.js
```

**Menu:**
```
Choose an option:
1. Test API key from .env file
2. Validate a custom API key
3. Exit
```

**Select Option 2:**
```
🔐 Enter your Gemini API key: [paste your key]
```

**Result:**
```
✅ SUCCESS: Your API key is valid!
```

### Step 2: Application Validation

Once your key is validated, use it in the application.

---

## 📱 In-Application Workflow

### Method 1: Through Settings Modal

#### Step 1: Open Settings
- Click the **⚙️ Settings** button in the top-right corner
- Or use keyboard shortcut (if configured)

#### Step 2: Navigate to AI Model Section
- Scroll down to find "AI Model" section
- Look for the API key input field

#### Step 3: Enter Your API Key
- Paste your validated API key
- The field is masked for security

#### Step 4: Validate in Application
- Click **"Validate API Key"** button
- Wait for validation result

#### Step 5: See Results

**Success:**
```
✅ API key is valid!
```

**Failure:**
```
❌ Invalid API key. Please check your Gemini API key in settings.
```

### Method 2: Through .env File

#### Step 1: Create/Edit .env File
```bash
# In project root
GEMINI_API_KEY=your_api_key_here
```

#### Step 2: Restart Application
- Close the application
- Restart it
- The key will be loaded automatically

#### Step 3: Verify in Settings
- Open Settings
- Check that no error banner appears
- API key should be recognized

---

## 🔑 Getting Your API Key

### Quick Steps (2 minutes)

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey

2. **Create API Key**
   - Click "Create API key"
   - Select "Create API key in new project"

3. **Copy Key**
   - Click copy icon
   - Key is now in clipboard

4. **Use in Validator**
   - Run: `node scripts/test-api-key.js`
   - Select option 2
   - Paste key
   - Verify it works

5. **Use in Application**
   - Open Settings
   - Paste key
   - Click "Validate API Key"

---

## ⚠️ Error Handling

### Error: Invalid API key (400)

**Symptoms:**
- Validation fails immediately
- Error message: "Invalid API key"

**Causes:**
- Malformed key
- Key doesn't exist
- Using wrong type of key

**Solutions:**
1. Get fresh key from https://makersuite.google.com/app/apikey
2. Make sure it's a Gemini API key (not Cloud Console)
3. Copy entire key without extra spaces
4. Try again

### Error: Not authorized (401)

**Symptoms:**
- Key format looks correct
- Validation fails with 401 error

**Causes:**
- Using Cloud Console key instead of Gemini API key
- Account permissions issue

**Solutions:**
1. Verify you're using Gemini API key
2. Create new key at https://makersuite.google.com/app/apikey
3. Check Google account permissions

### Error: Forbidden (403)

**Symptoms:**
- Key is valid but access denied
- Error message: "No permission"

**Causes:**
- Billing not enabled
- Key restrictions applied
- Account quota exceeded

**Solutions:**
1. Enable billing: https://console.cloud.google.com/billing
2. Check key restrictions in Google AI Studio
3. Create new key if needed

### Error: Network error

**Symptoms:**
- Validation times out
- Connection refused

**Causes:**
- No internet connection
- Google API service down
- Firewall blocking

**Solutions:**
1. Check internet connection
2. Try again in a few moments
3. Check Google's status page
4. Check firewall settings

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Store key in `.env` file
- ✅ Add `.env` to `.gitignore`
- ✅ Validate key before using
- ✅ Rotate key periodically
- ✅ Use different keys for different environments

### ❌ DON'T

- ❌ Commit API key to git
- ❌ Share key in messages/emails
- ❌ Use same key for multiple projects
- ❌ Hardcode key in source code
- ❌ Post key in public forums

---

## 📊 Validation Status Indicators

### In Settings Modal

**No Issues:**
```
✅ API key is valid
```

**Warning Banner:**
```
⚠️ API Key Issue Detected
[Error message]
[Validate & Fix button]
```

**Error Section:**
```
🔑 API Key Issue
[Error details]
[Validate API Key button]
```

---

## 🔄 Workflow Diagram

```
┌─────────────────────────────────────┐
│ Get API Key from Google AI Studio   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Validate with Command-Line Tool     │
│ node scripts/test-api-key.js        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ Valid     ❌ Invalid
        │             │
        │             └─→ Fix & Retry
        │
        ▼
┌─────────────────────────────────────┐
│ Enter in Application Settings       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Click "Validate API Key"            │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ✅ Valid     ❌ Invalid
        │             │
        │             └─→ Fix & Retry
        │
        ▼
┌─────────────────────────────────────┐
│ Ready to Use!                       │
│ Start Simulation                    │
└─────────────────────────────────────┘
```

---

## 📞 Troubleshooting Checklist

- [ ] API key is from https://makersuite.google.com/app/apikey
- [ ] Key is not from Google Cloud Console
- [ ] Key is copied completely without extra spaces
- [ ] Internet connection is working
- [ ] Google API service is operational
- [ ] Billing is enabled on Google account
- [ ] No firewall blocking API calls
- [ ] Key hasn't been revoked
- [ ] Using correct key format (starts with "AIza")

---

## 📚 Related Documentation

- `scripts/QUICK_START.md` - 30-second quick start
- `scripts/API_KEY_VALIDATOR_README.md` - Full validator guide
- `scripts/TEST_API_KEY_UPDATES.md` - Technical details
- `README.md` - Main project documentation

