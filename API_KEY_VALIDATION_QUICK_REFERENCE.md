# API Key Validation - Quick Reference

## 🚀 Quick Start

### Getting a Valid API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API key" (or copy existing)
3. Paste in Settings → AI Model section
4. Click "Validate API Key"

### What You'll See

**✅ Valid Key**
- No warning banner
- Models load successfully
- Simulation works without errors

**❌ Invalid Key**
- 🔴 Red warning banner at top of Settings
- ⚠️ Error message in AI Model section
- 💡 Troubleshooting tips provided

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| 400 Error | Get fresh key from Google AI Studio |
| 401 Error | Verify it's a Gemini API key |
| 403 Error | Check key permissions, enable billing |
| Models won't load | Click "Validate API Key" button |
| Still failing | Try incognito window, check internet |

## 📍 Where to Find It

**Settings Modal** (⚙️ icon)
- Top banner: Shows warning if API key invalid
- AI Model section: Shows error details
- Image Generation section: Troubleshooting tips

## 🎯 Manual Validation

1. Open Settings (⚙️)
2. Scroll to "AI Model" section
3. Click "Validate API Key" button
4. See result: ✅ Valid or ❌ Error message

## 🔑 API Key Format

- **Source**: Google AI Studio (makersuite.google.com)
- **Starts with**: "AIza"
- **Length**: ~39 characters
- **Type**: Gemini API key (not Cloud Console key)

## ⚡ Common Errors

### "Invalid API key (400 Bad Request)"
```
❌ Your key is malformed or doesn't exist
✅ Get fresh key from Google AI Studio
```

### "API key is not authorized (401)"
```
❌ Key exists but has no permission
✅ Verify it's a Gemini API key
```

### "API key does not have permission (403)"
```
❌ Key is restricted or billing not enabled
✅ Check key restrictions, enable billing
```

## 📋 Validation Checklist

- [ ] API key from Google AI Studio (not Cloud Console)
- [ ] Key copied completely (no spaces)
- [ ] Key pasted in correct field
- [ ] Clicked "Validate API Key" button
- [ ] Google account has billing enabled
- [ ] Not using service account key
- [ ] Internet connection working
- [ ] Tried fresh API key

## 🔗 Helpful Links

- **Get API Key**: https://makersuite.google.com/app/apikey
- **Google AI Studio**: https://makersuite.google.com
- **API Documentation**: https://ai.google.dev
- **Status Page**: https://status.cloud.google.com

## 💡 Pro Tips

1. **Auto-Validation**: System validates automatically when Settings opens
2. **Manual Check**: Click button anytime to verify your key
3. **Error Messages**: Read the error - it tells you what's wrong
4. **Troubleshooting**: Check the yellow info box in Settings
5. **Fresh Key**: If stuck, get a new key from Google AI Studio

## 🎯 What Happens

### On Settings Open
```
1. System validates your API key
2. If invalid → Red warning appears
3. If valid → No warning shown
```

### On Button Click
```
1. Click "Validate API Key"
2. System tests the key
3. Shows ✅ or ❌ result
4. Provides next steps
```

### On Model Load
```
1. System tries to fetch models
2. If 400 error → Detects invalid key
3. Shows warning with solution
4. Falls back to default models
```

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console)
2. **Look at debug logs** (Settings → Debug)
3. **Read error message** carefully
4. **Try fresh API key** from Google AI Studio
5. **Check internet connection**
6. **Try incognito window**

## 📞 Support

For detailed help, see:
- `API_KEY_VALIDATION_GUIDE.md` - Full guide
- `API_KEY_VALIDATION_IMPLEMENTATION.md` - Technical details
- Browser console (F12) - Error details

---

**Remember**: The system will warn you if your API key is invalid. Just follow the troubleshooting steps! 🎉

