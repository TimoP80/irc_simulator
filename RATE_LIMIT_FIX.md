# 429 Rate Limit Error - Diagnosis and Fix

## 🔍 Problem Diagnosis

### Error Message
```
ApiError: {"error":{"code":429,"message":"Quota exceeded for quota metric 'Generate Content API requests per minute' and limit 'GenerateContent request limit per minute for a region' of service 'generativelanguage.googleapis.com' for consumer 'project_number:362017463235'.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.ErrorInfo","reason":"RATE_LIMIT_EXCEEDED","domain":"googleapis.com","metadata":{"quota_limit_value":"0","quota_metric":"generativelanguage.googleapis.com/generate_content_requests","service":"generativelanguage.googleapis.com","quota_limit":"GenerateContentRequestsPerMinutePerProjectPerRegion","quota_unit":"1/min/{project}/{region}","quota_location":"europe-west1","consumer":"projects/362017463235"}}}
```

### Key Findings

**Critical Issue:** `"quota_limit_value":"0"`

This means your API key has **ZERO quota allocated** for the `europe-west1` region. This is **NOT** a rate limiting issue - it's a **billing/configuration issue**.

**Details:**
- **Region:** `europe-west1`
- **Quota Limit:** `0` requests per minute
- **Project:** `362017463235`
- **Service:** `generativelanguage.googleapis.com`

## 🎯 Root Cause

Your Gemini API key has one of these issues:

1. **No quota allocated for europe-west1 region**
   - The API is trying to use the europe-west1 region
   - Your project has 0 quota for that region
   - You may have quota in other regions (e.g., us-central1)

2. **Billing not properly configured**
   - Free tier may have expired
   - Billing account not linked
   - Payment method issue

3. **API key restrictions**
   - API key may be restricted to specific regions
   - Quota may not be enabled for this service

## ✅ Solutions

### Solution 1: Check Google Cloud Console Quotas

1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Select your project: `362017463235`
3. Check quotas for `GenerateContent` API
4. Look for regional quotas and ensure they're not 0
5. Request quota increase if needed

### Solution 2: Check Billing Settings

1. Go to: https://console.cloud.google.com/billing
2. Ensure billing is enabled for project `362017463235`
3. Verify payment method is valid
4. Check if you've exceeded free tier limits

### Solution 3: Use a Different Region

The Gemini API may be auto-detecting your region as `europe-west1`. You can try:

1. Using a VPN to connect from a different region
2. Checking if your API key has regional restrictions
3. Creating a new API key with different region settings

### Solution 4: Use a Different API Key

If you have access to another Google Cloud project:

1. Create a new project in Google Cloud Console
2. Enable the Generative Language API
3. Create a new API key
4. Update your `.env` file with the new key

### Solution 5: Check API Enablement

1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Ensure the API is enabled for your project
3. Check if there are any service restrictions

## 🔧 Code Changes Made

### 1. Enhanced Rate Limiting (App.tsx)

**Before:**
```typescript
const MAX_CONCURRENT_REQUESTS = 2;
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds
```

**After:**
```typescript
const MAX_CONCURRENT_REQUESTS = 1; // Reduced from 2
const MIN_REQUEST_INTERVAL = 5000; // Increased to 5 seconds
const MAX_REQUESTS_PER_MINUTE = 12; // New: Track requests per minute
```

**Why:** Even though your issue is quota=0, these changes will help prevent rate limit errors once quota is fixed.

### 2. Per-Minute Request Tracking (App.tsx)

Added tracking of requests per minute:
```typescript
const [requestTimestamps, setRequestTimestamps] = useState<number[]>([]);

// In withConcurrencyLimit:
const recentRequests = requestTimestamps.filter(ts => ts > oneMinuteAgo);
if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
  // Wait until oldest request is >1 minute old
  const waitTime = 60000 - (now - oldestRequest) + 1000;
  await new Promise(resolve => setTimeout(resolve, waitTime));
}
```

**Why:** Ensures we never exceed 12 requests per minute (Tier 1 limit is 15 RPM).

### 3. Better Error Messages (utils/config.ts)

Added specific error detection for zero quota:
```typescript
if (error.message.includes('"quota_limit_value":"0"')) {
  throw new Error(`❌ API Quota Error: Your Gemini API key has 0 quota allocated...`);
}
```

**Why:** Provides clear guidance when quota is 0 instead of generic rate limit error.

## 📊 Gemini API Rate Limits (For Reference)

### Free Tier
- **Gemini 2.5 Flash:** 10 RPM, 250K TPM, 250 RPD
- **Gemini 2.5 Flash-Lite:** 15 RPM, 250K TPM, 1000 RPD

### Tier 1 (Paid)
- **Gemini 2.5 Flash:** 1000 RPM, 1M TPM, 10K RPD
- **Gemini 2.5 Flash-Lite:** 4000 RPM, 4M TPM

**Note:** These limits only apply if you have quota allocated!

## 🚀 Next Steps

1. **Immediate:** Check your Google Cloud Console quotas (link above)
2. **Verify:** Ensure billing is enabled and payment method is valid
3. **Test:** Once quota is fixed, the enhanced rate limiting will prevent future 429 errors
4. **Monitor:** Watch console logs for rate limiter messages showing RPM usage

## 💡 How to Verify the Fix

Once you've fixed the quota issue:

1. Open the app in browser
2. Open browser console (F12)
3. Look for rate limiter debug messages:
   ```
   Starting [context] (1/1 concurrent, 3/12 RPM)
   ```
4. Verify no 429 errors appear
5. Check that requests are properly spaced (5 seconds apart)

## 📝 Additional Notes

- The rate limiting changes are **preventive** - they won't fix the quota=0 issue
- You **must** fix the quota allocation in Google Cloud Console
- Once quota is fixed, the app will work much better with the new rate limiting
- Consider using "slow" simulation speed (60s intervals) to further reduce API usage

## 🔗 Useful Links

- **Quotas Dashboard:** https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- **Billing Dashboard:** https://console.cloud.google.com/billing
- **API Library:** https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
- **Rate Limits Docs:** https://ai.google.dev/gemini-api/docs/rate-limits
- **Pricing Docs:** https://ai.google.dev/gemini-api/docs/pricing

## ⚠️ Important

**The 429 error you're seeing is NOT caused by too many requests.**

**It's caused by having ZERO quota allocated for your region.**

**You must fix the quota allocation in Google Cloud Console before the app will work.**

