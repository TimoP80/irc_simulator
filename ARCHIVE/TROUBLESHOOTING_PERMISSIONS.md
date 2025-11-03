# Troubleshooting Permissions

This guide provides solutions for common permission-related errors that can occur when building the Station V desktop application.

## Quick Fix

If you are encountering permission errors, the following command will often resolve the issue by cleaning up any lingering processes from previous builds:

```bash
npm run electron:cleanup
```

After running the cleanup script, try building the application again.

## Common Causes and Solutions

Permission errors are typically caused by files being locked by another process. Here are the most common culprits and how to resolve them:

### 1. Running Application Processes

The most common cause of permission errors is a running instance of the application (either in development or a previous build).

-   **Solution:** Close all open instances of the Station V application. You can also use the cleanup script mentioned above, which will automatically terminate any related processes.

### 2. Open File Explorers or Terminals

Having a file explorer or terminal window open in the `release/` or `dist/` directories can also cause file locking issues.

-   **Solution:** Close any file explorer or terminal windows that are currently open in the project's build directories.

### 3. Antivirus Software

Antivirus software can sometimes interfere with the build process by scanning and locking files.

-   **Solution:** Temporarily disable your antivirus software or add the project directory to its exclusion list.

## Advanced Solutions

If the quick fixes above do not resolve the issue, you can try the following:

-   **Run as Administrator:** On Windows, running your terminal or code editor as an administrator can sometimes resolve permission issues.
-   **Manual Cleanup:** If the cleanup script fails, you can manually delete the `dist/`, `dist-electron/`, and `release/` directories to ensure a clean build.

By following these steps, you should be able to resolve most permission-related errors and successfully build the application.
