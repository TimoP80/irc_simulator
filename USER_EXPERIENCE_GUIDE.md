# User Experience Guide - API Key Validation

## 👀 What You'll See

### Scenario 1: Invalid API Key

When you open Settings with an invalid API key, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│ Simulation Configuration                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ API Key Issue Detected                               │ │
│ │                                                         │ │
│ │ Invalid API key. Please check your Gemini API key in   │ │
│ │ settings.                                               │ │
│ │                                                         │ │
│ │ [Validate & Fix]                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ... rest of settings ...                                    │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 2: Valid API Key

When you open Settings with a valid API key, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│ Simulation Configuration                                    │
│                                                             │
│ (No warning banner - everything is fine!)                  │
│                                                             │
│ ... settings ...                                            │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 3: Model Section with Error

In the AI Model section, if there's an error:

```
┌─────────────────────────────────────────────────────────────┐
│ AI Model                                                    │
│ [Dropdown with models...]                                   │
│                                                             │
│ ⚠️ Invalid API key. Please check your Gemini API key in    │
│    settings. (Using fallback models)                        │
│                                                             │
│ [Validate API Key]                                          │
│                                                             │
│ Choose the AI model for message generation...              │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 4: Troubleshooting Tips

In the Image Generation section:

```
┌─────────────────────────────────────────────────────────────┐
│ 💡 API Key Troubleshooting:                                 │
│                                                             │
│ If you see a 400 error or models won't load, your API key  │
│ may be invalid. Common issues:                              │
│ • API key is expired or revoked                             │
│ • API key has incorrect permissions                         │
│ • API key is for the wrong service                          │
│                                                             │
│ Solution: Get a fresh API key from Google AI Studio and    │
│ paste it above.                                             │
│                                                             │
│ [Link: https://makersuite.google.com/app/apikey]           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Step-by-Step: What to Do

### If You See a Warning

**Step 1: Read the Error**
```
⚠️ Invalid API key. Please check your Gemini API key in settings.
```

**Step 2: Click "Validate & Fix"**
- System tests your API key
- Shows result: ✅ Valid or ❌ Error

**Step 3: If Still Invalid**
- Get fresh API key from Google AI Studio
- Paste in Settings
- Click "Validate API Key" again

### If You Want to Test Your Key

**Step 1: Open Settings** (⚙️ icon)

**Step 2: Scroll to "AI Model" section**

**Step 3: Click "Validate API Key" button**

**Step 4: See Result**
- ✅ "API key is valid!" - Success!
- ❌ Error message - Follow troubleshooting

### If You Need a New API Key

**Step 1: Visit Google AI Studio**
https://makersuite.google.com/app/apikey

**Step 2: Create or Copy Key**
- Click "Create API key"
- Or copy existing key
- Make sure it's a Gemini API key

**Step 3: Copy the Key**
- Select all (Ctrl+A)
- Copy (Ctrl+C)

**Step 4: Paste in Settings**
- Open Settings (⚙️)
- Find API key field
- Paste (Ctrl+V)

**Step 5: Validate**
- Click "Validate API Key"
- Should see ✅ "API key is valid!"

## 🔴 Error Messages Explained

### "Invalid API key (400 Bad Request)"
```
What it means: Your API key is malformed or doesn't exist
What to do:
  1. Get fresh key from Google AI Studio
  2. Make sure you copied the entire key
  3. Paste in Settings
  4. Click "Validate API Key"
```

### "API key is not authorized (401)"
```
What it means: Key exists but doesn't have permission
What to do:
  1. Verify it's a Gemini API key (not Cloud Console)
  2. Try regenerating the key
  3. Make sure you're using the right key
```

### "API key does not have permission (403)"
```
What it means: Key is restricted or billing not enabled
What to do:
  1. Check key restrictions in Google AI Studio
  2. Make sure billing is enabled on your account
  3. Try creating a new unrestricted key
```

### "Failed to fetch models: [error]"
```
What it means: Network issue or API service problem
What to do:
  1. Check your internet connection
  2. Try again in a few moments
  3. Check Google Cloud Status page
  4. Try a fresh API key
```

## ✅ Success Indicators

### You Know It's Working When:

✅ **No Warning Banner**
- Settings opens without red warning
- Means your API key is valid

✅ **Models Load**
- AI Model dropdown shows available models
- Means API is responding correctly

✅ **Validation Succeeds**
- Click "Validate API Key"
- See "✅ API key is valid!"

✅ **Simulation Runs**
- No 400 errors in console
- Messages generate without errors

## 🆘 Troubleshooting Checklist

- [ ] API key is from Google AI Studio (not Cloud Console)
- [ ] API key is copied completely (no spaces)
- [ ] API key is pasted in the correct field
- [ ] You clicked "Validate API Key" to test
- [ ] Your Google account has billing enabled
- [ ] You're not using a service account key
- [ ] Your internet connection is working
- [ ] You tried refreshing the page
- [ ] You tried a fresh API key

## 💡 Pro Tips

1. **Keep Your Key Safe**
   - Don't share your API key
   - Don't commit it to version control
   - Regenerate if you think it's compromised

2. **Test Regularly**
   - Click "Validate API Key" if you see errors
   - Helps catch issues early

3. **Get Fresh Keys**
   - If stuck, get a new key from Google AI Studio
   - Old keys might be expired or revoked

4. **Check Internet**
   - Validation needs internet connection
   - Make sure you're online

5. **Use Incognito**
   - If having persistent issues
   - Try in incognito/private window

## 🔗 Helpful Links

- **Get API Key**: https://makersuite.google.com/app/apikey
- **Google AI Studio**: https://makersuite.google.com
- **API Documentation**: https://ai.google.dev
- **Status Page**: https://status.cloud.google.com

## 📞 Need Help?

**Check These First**
1. Read the error message carefully
2. Look at troubleshooting tips in Settings
3. Check the troubleshooting checklist
4. Try a fresh API key

**Still Stuck?**
1. Open browser console (F12 → Console)
2. Look for error messages
3. Check debug logs (Settings → Debug)
4. Try in incognito window

## 🎉 You're All Set!

Once you see:
- ✅ No warning banner
- ✅ Models loading
- ✅ Validation succeeds

You're ready to use the simulator! 🚀

---

**Remember**: The system will warn you if something's wrong. Just follow the troubleshooting steps and you'll be fine!

