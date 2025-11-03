# General Troubleshooting Guide

This guide provides solutions for common issues you may encounter when running or building the Station V desktop application.

## Application Not Starting or Showing a Blank Screen

If the application fails to start or only shows a blank white screen, it is often due to a configuration or build issue.

### Common Causes and Solutions

1.  **Missing `.env` File:** The application requires a `.env` file with a valid Gemini API key to function. Ensure that you have created this file in the root of the project directory and that it is correctly formatted.

2.  **Incorrect Build Process:** If you are running a production build, ensure that all the necessary files were correctly generated in the `dist/` and `dist-electron/` directories. Try running a clean build to resolve any issues:
    ```bash
    npm run electron:clean
    npm run electron:build
    ```

3.  **External Resource Blocking:** In some cases, security settings can block the application from loading external resources. The application has been configured to avoid this, but if you have made changes to the `index-electron.html` file, ensure that you are not loading any external scripts or stylesheets.

## Network Issues

If you are having trouble connecting to the network mode, please refer to the [Network Setup Guide](NETWORK_SETUP.md) for detailed instructions and troubleshooting steps.

## Build Failures

For issues related to the build process, such as permission errors or other build failures, please consult the following guides:

-   [Quick Build Guide](QUICK_BUILD_GUIDE.md)
-   [Troubleshooting Permissions](TROUB-LESHOOTING_PERMISSIONS.md)

## Further Assistance

If you are still experiencing issues after consulting this guide, you can try the following:

-   **Check the Debug Logs:** The application generates a `station-v-debug.log` file that may contain helpful error messages.
-   **Open an Issue:** If you believe you have found a bug, please open an issue on the project's GitHub repository.
