# Proposal to Reduce Simulation Start Delay

## 1. Introduction

The current simulation startup is delayed by an exponential backoff retry mechanism in the `withRateLimitAndRetries` function. When the Gemini API is rate-limited during startup, this can lead to significant delays. This proposal outlines changes to minimize this delay by introducing a "fast startup" mode with a less aggressive retry strategy.

## 2. Proposed Changes

### 2.1. Modify `withRateLimitAndRetries` in `utils/config.ts`

I propose modifying the `withRateLimitAndRetries` function to accept an `options` parameter. This will allow for customized retry and backoff settings, enabling a "fast startup" mode.

**Current Implementation:**

```typescript
export const withRateLimitAndRetries = async <T>(apiCall: () => Promise<T>, context?: string): Promise<T> => {
  let attempt = 0;
  while (attempt <= MAX_RETRIES) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`[API Error] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed${context ? ` for ${context}` : ''}:`, error);
      
      if (isNetworkError(error)) {
        console.warn(`[API Error] Network/CORS error detected. This may be due to browser security policies.`);
        // For network errors, we don't retry as they're likely persistent
        throw new Error(`Network error: Unable to connect to AI service. This may be due to CORS restrictions or network issues. Please check your internet connection and try again.`);
      }
      
      if (isRateLimitError(error) && attempt < MAX_RETRIES) {
        attempt++;
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Provide specific error messages for different types of errors
        if (error instanceof Error) {
          if (error.message.includes("RESOURCE_EXHAUSTED")) {
            throw new Error(`AI service quota exhausted. Please try again later or check your API key limits.`);
          } else if (error.message.includes("quota")) {
            throw new Error(`AI service quota exceeded. Please try again later.`);
          } else if (error.message.includes("429")) {
            throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
          } else if (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("UNAVAILABLE")) {
            throw new Error(`AI service is temporarily overloaded. Please try again in a few moments.`);
          }
        }
        throw error;
      }
    }
  }
  throw new Error("Exhausted retries for API call.");
};
```

**Proposed Implementation:**

```typescript
export const withRateLimitAndRetries = async <T>(
  apiCall: () => Promise<T>, 
  context?: string, 
  options?: { maxRetries?: number; initialBackoffMs?: number }
): Promise<T> => {
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  const initialBackoffMs = options?.initialBackoffMs ?? INITIAL_BACKOFF_MS;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      console.error(`[API Error] Attempt ${attempt + 1}/${maxRetries + 1} failed${context ? ` for ${context}` : ''}:`, error);
      
      if (isNetworkError(error)) {
        console.warn(`[API Error] Network/CORS error detected. This may be due to browser security policies.`);
        throw new Error(`Network error: Unable to connect to AI service. This may be due to CORS restrictions or network issues. Please check your internet connection and try again.`);
      }
      
      if (isRateLimitError(error) && attempt < maxRetries) {
        attempt++;
        const delay = initialBackoffMs * Math.pow(2, attempt - 1) + Math.random() * 1000; // Add jitter
        console.warn(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (error instanceof Error) {
          if (error.message.includes("RESOURCE_EXHAUSTED")) {
            throw new Error(`AI service quota exhausted. Please try again later or check your API key limits.`);
          } else if (error.message.includes("quota")) {
            throw new Error(`AI service quota exceeded. Please try again later.`);
          } else if (error.message.includes("429")) {
            throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
          } else if (error.message.includes("503") || error.message.includes("overloaded") || error.message.includes("UNAVAILABLE")) {
            throw new Error(`AI service is temporarily overloaded. Please try again in a few moments.`);
          }
        }
        throw error;
      }
    }
  }
  throw new Error("Exhausted retries for API call.");
};
```

### 2.2. Utilize "Fast Startup" Mode in `services/geminiService.ts`

I will now update the `generateBatchUsers` and `generateRandomWorldConfiguration` functions in `services/geminiService.ts` to use the new "fast startup" mode. This will involve passing a new options object to `withRateLimitAndRetries` with a lower initial backoff and fewer retries.

**Proposed Changes in `generateBatchUsers`:**

```typescript
// Inside generateBatchUsers function
const response = await withRateLimitAndRetries(() =>
  ai.models.generateContent({
    model: validatedModel,
    contents: prompt,
    config: config,
  }), `batch user generation (${count} users)`,
  { maxRetries: 1, initialBackoffMs: 500 } // Fast startup options
);
```

**Proposed Changes in `generateRandomWorldConfiguration`:**

```typescript
// Inside generateRandomWorldConfiguration function
const response = await withRateLimitAndRetries(() =>
  ai.models.generateContent({
      model: validatedModel,
      contents: prompt,
      config: config,
  }), `world configuration generation`,
  { maxRetries: 1, initialBackoffMs: 500 } // Fast startup options
);
```

## 3. Rationale

These changes will significantly reduce the startup delay by:
-   **Reducing the initial backoff period** from 2000ms to 500ms.
-   **Limiting the number of retries** to 1 for startup-critical API calls.
-   **Maintaining the existing retry logic** for other API calls, ensuring the application remains resilient to rate limiting during normal operation.

This approach aligns with the safe refactoring guidelines by preserving the core logic of the `withRateLimitAndRetries` function while providing the flexibility needed to improve startup performance.

## 4. Next Steps

Once this proposal is approved, I will request to switch to "Code" mode to implement the changes.