# Code Signing Configuration Guide

## Overview

This document explains how code signing is configured for the Station V application and why signing warnings appear during the build process.

## Current Configuration

**Code Signing is DISABLED** by default in `package-electron.json`:

```json
"win": {
  "sign": false,
  "signingHashAlgorithms": null,
  "signingAlgorithm": null,
  "certificateFile": null,
  "certificatePassword": null
}
```

## Why Signing Warnings Appear

Even though `"sign": false` is set, electron-builder may still attempt to:
1. Auto-discover certificates on the system
2. Check for signing credentials
3. Show warnings about missing certificates

These warnings are **expected** and **do not affect the functionality** of the built executable.

## Build Script Improvements

The build scripts (`scripts/build-windows-dist.js` and `scripts/build-installer.js`) now:

1. **Set environment variables** to suppress signing warnings:
   ```javascript
   const buildEnv = {
     ...process.env,
     CSC_IDENTITY_AUTO_DISCOVERY: 'false',  // Disable auto-discovery
     CSC_NAME: '',                          // Clear certificate name
     WIN_CSC_LINK: '',                      // Clear Windows cert link
     WIN_CSC_KEY_PASSWORD: '',             // Clear password
     CSC_LINK: '',                         // Clear certificate link
     CSC_KEY_PASSWORD: ''                  // Clear key password
   };
   ```

2. **Provide clear messages** during build:
   ```
   📝 Code signing is disabled in package-electron.json (sign: false)
      Signing warnings are expected and can be safely ignored
   ```

3. **Handle signing errors gracefully** by checking if the executable was created despite errors

## Understanding the Warnings

### Common Warnings You May See

1. **"Could not find certificate"**
   - **Meaning**: electron-builder tried to find a signing certificate
   - **Impact**: None - signing is disabled
   - **Action**: Ignore safely

2. **"CSC_IDENTITY_AUTO_DISCOVERY is false"**
   - **Meaning**: Auto-discovery of certificates is disabled
   - **Impact**: None - this is intentional
   - **Action**: Normal behavior

3. **"Signing skipped"**
   - **Meaning**: No signing certificate found, skip signing
   - **Impact**: None - signing is disabled
   - **Action**: Expected behavior

## How to Verify Signing is Disabled

Check the build output for:
```
✅ Executable created successfully despite errors
📁 Location: release/win-unpacked/Station V - Virtual IRC Simulator.exe
ℹ️ Any signing warnings are expected and do not affect functionality
```

This confirms that:
- The executable was built successfully
- Signing warnings did not prevent the build
- The executable is functional

## If You Want to Enable Code Signing

If you need to sign the executable for distribution:

### Option 1: Set Environment Variables

Create a `.env` file or set environment variables:

```bash
# For Windows certificate file (.p12)
WIN_CSC_LINK=/path/to/certificate.p12
WIN_CSC_KEY_PASSWORD=your-password

# Or use certificate store name
CSC_NAME="Your Certificate Name"
```

Then update `package-electron.json`:

```json
"win": {
  "sign": true,
  "certificateFile": "${WIN_CSC_LINK}",
  "certificatePassword": "${WIN_CSC_KEY_PASSWORD}"
}
```

### Option 2: Use electron-builder Flags

```bash
npx electron-builder --win \
  --config.win.sign=true \
  --config.win.certificateFile=/path/to/cert.p12 \
  --config.win.certificatePassword=password
```

### Option 3: Code Sign Server

For automated signing in CI/CD, use a signing service like:
- AWS KMS
- Azure Key Vault
- Custom signing server

## Benefits of Disabled Signing (Development)

1. **Faster builds** - No certificate lookup delays
2. **No certificate required** - Build anywhere
3. **Simpler process** - One less thing to configure
4. **Still functional** - App works perfectly without signature

## Drawbacks of Unsigned Executables

1. **Windows Defender warnings** - May show "Unknown publisher"
2. **User trust** - Users may be cautious about untrusted apps
3. **Distribution limitations** - Some stores require signed apps
4. **Security perception** - Users prefer signed applications

## Recommendations

### For Development
- Keep signing **disabled** for speed and simplicity

### For Internal Distribution
- Keep signing **disabled** if users trust your organization

### For Public Distribution
- Enable signing with a valid certificate
- Consider EV (Extended Validation) certificates for better trust

### For Enterprise
- Use organization-wide certificates
- Implement automated signing in CI/CD pipeline

## Troubleshooting

### Issue: Build fails with signing errors

**Solution**: Check if executable was created anyway:
```bash
ls release/win-unpacked/
```

If executable exists, the build succeeded despite errors.

### Issue: Too many signing warnings

**Solution**: The environment variables are automatically set in the build scripts:
- `CSC_IDENTITY_AUTO_DISCOVERY=false` prevents auto-discovery
- Empty strings for certificate variables prevent lookup

### Issue: Want to suppress all signing messages

**Solution**: Add this to your `.npmrc` or `.yarnrc`:
```
electron-builder-config-file=package-electron.json
```

Or use the `--config` flag:
```bash
npm run electron:build:win
```

The build scripts already pass `--config package-electron.json`.

## Summary

- ✅ Code signing is **disabled by default**
- ✅ Warnings are **expected** and can be **safely ignored**
- ✅ The executable is **fully functional** without signing
- ✅ Build scripts now **suppress most warnings** automatically
- ✅ Environment variables prevent certificate lookup

The build process has been improved to:
1. Explicitly disable signing algorithms in config
2. Set environment variables to suppress warnings
3. Provide clear user messages about signing status
4. Handle signing errors gracefully

You can now build without worrying about signing warnings!

