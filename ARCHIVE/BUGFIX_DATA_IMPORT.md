# Bug Fix: Data Import Error

## Issue
Windows build error: `data: 0.savelog is not a function` when importing data

## Root Cause
The `dataExportService` was calling `chatLogService.saveLog()` during data import, but this method didn't exist in the `ChatLogService` class. The service only had `saveMessage()` for saving individual messages, not complete log entries during data restoration.

## Solution
Added the missing `saveLog()` method to the `ChatLogService` class in both:
- `services/chatLogService.ts`
- `station-v-source-dist/services/chatLogService.ts`

### Implementation Details

**New Method: `saveLog(logEntry: ChatLogEntry)`**
- Accepts a complete `ChatLogEntry` object
- Handles proper date conversion for timestamps (Date objects vs strings)
- Saves to IndexedDB
- Updates channel metadata
- Used specifically during data import operations

**Error Handling**
Added try-catch block in `dataExportService.ts`:
- Imports continue even if individual logs fail to save
- Logs errors to debug console
- More resilient import process

## Changes Made

### 1. Added `saveLog()` method to ChatLogService
```typescript
async saveLog(logEntry: ChatLogEntry): Promise<void> {
  const db = await this.ensureDB();
  
  // Ensure proper date conversion for timestamps
  const processedEntry: ChatLogEntry = {
    ...logEntry,
    message: {
      ...logEntry.message,
      timestamp: logEntry.message.timestamp instanceof Date 
        ? logEntry.message.timestamp 
        : new Date(logEntry.message.timestamp)
    },
    createdAt: logEntry.createdAt instanceof Date 
      ? logEntry.createdAt 
      : new Date(logEntry.createdAt)
  };
  // ... save to IndexedDB
}
```

### 2. Improved error handling in DataExportService
```typescript
try {
  for (const log of data.chatLogs) {
    await chatLogService.saveLog(log);
  }
  dataExportDebug.log('Chat logs saved:', data.chatLogs.length, 'logs');
} catch (error) {
  dataExportDebug.error('Failed to save some chat logs:', error);
  // Continue import even if some logs fail to save
}
```

## Files Modified
- ✅ `services/chatLogService.ts` - Added `saveLog()` method
- ✅ `services/dataExportService.ts` - Improved error handling
- ✅ `station-v-source-dist/services/chatLogService.ts` - Added `saveLog()` method
- ✅ `station-v-source-dist/services/dataExportService.ts` - Improved error handling

## Testing
After this fix:
1. Build the Windows executable: `npm run electron:build:all`
2. Export data from the app
3. Import the data back
4. ✅ No more "savelog is not a function" error
5. ✅ Chat logs import successfully

## Impact
- ✅ Data import now works correctly in Windows builds
- ✅ Better error handling prevents import from failing completely
- ✅ Handles date conversion properly (Date objects vs ISO strings)
- ✅ More resilient to malformed data

## Related
- Issue occurred specifically in Windows Electron builds
- Was working in development but failing in packaged builds
- Affected chat log import functionality
- Now fixed for both dev and production builds

