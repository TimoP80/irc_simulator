# API Key Validator - Quick Start Guide

## 🚀 Quick Start (30 seconds)

### Step 1: Run the Script
```bash
node scripts/test-api-key.js
```

### Step 2: Choose Option 2
```
Enter your choice (1-3): 2
```

### Step 3: Enter Your API Key
```
🔐 Enter your Gemini API key: [paste your key here]
```

### Step 4: See Results
```
✅ SUCCESS: Your API key is valid!
```

---

## 📋 Menu Options

| Option | Purpose | Use When |
|--------|---------|----------|
| **1** | Test .env file | You have `GEMINI_API_KEY` in `.env` |
| **2** | Validate custom key | You want to test any API key |
| **3** | Exit | Done testing |

---

## 🔑 Getting an API Key (2 minutes)

1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Create API key"**
3. Copy the key
4. Paste in the validator

---

## ✅ Success Indicators

### Valid Key
```
✅ SUCCESS: Your API key is valid!
You can now use this key in the application.
```

### Invalid Key
```
❌ FAILED: Invalid API key. Please check your Gemini API key.

Troubleshooting tips:
• Make sure you're using a Gemini API key (not Cloud Console)
• Check that your Google account has billing enabled
• Try creating a new API key at: https://makersuite.google.com/app/apikey
• Check your internet connection
```

---

## 🆘 Common Issues

### "Invalid API key (400)"
→ Get a fresh key from https://makersuite.google.com/app/apikey

### "Not authorized (401)"
→ Make sure it's a Gemini API key, not Cloud Console

### "Forbidden (403)"
→ Enable billing on your Google account

### "Network error"
→ Check your internet connection

---

## 💡 Pro Tips

✅ **Validate before using** - Test your key here first  
✅ **Keep it safe** - Don't share your API key  
✅ **Use .env file** - Store key in `.env` for security  
✅ **Test regularly** - Validate after key rotation  

---

## 📚 More Help

- Full guide: `scripts/API_KEY_VALIDATOR_README.md`
- Updates: `scripts/TEST_API_KEY_UPDATES.md`
- Main README: `README.md`

---

## 🎯 Next Steps

After validation:

1. **In Application:**
   - Open Settings (⚙️)
   - Paste your API key
   - Click "Validate API Key"

2. **In .env file:**
   - Add: `GEMINI_API_KEY=your_key`
   - Restart app

---

**That's it! Your API key is ready to use.** 🎉

