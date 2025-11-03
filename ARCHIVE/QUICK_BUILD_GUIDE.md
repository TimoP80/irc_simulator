# Quick Build Guide - Station V Desktop

This guide provides the essential commands for building the Station V desktop application.

## Recommended Build Command

For most users, the following command is all you need to create a distributable version of the application for your current operating system (Windows, macOS, or Linux):

```bash
npm run electron:build
```

This command will:

1.  Build the React application for production.
2.  Compile the Electron main process.
3.  Package everything into a distributable format (e.g., an `.exe` installer for Windows).

The build artifacts will be located in the `release/` directory.

## Portable Distribution (Windows Only)

If you are on Windows, you can create a portable `.zip` distribution that can be run without installation:

```bash
npm run electron:build:portable
```

This is a convenient way to share the application with others. The portable distribution will be created in the `release/` directory.

## Development

To run the application in a local development environment with hot-reloading and access to developer tools, use the following command:

```bash
npm run electron:dev
```

This will launch the application in a development window, allowing you to make changes to the source code and see them reflected in real-time.

## Troubleshooting

-   **Permission Errors:** If you encounter permission-related errors during the build process, please refer to the [Troubleshooting Permissions](TROUBLESHOOTING_PERMISSIONS.md) guide.
-   **Blank Screen or Other Issues:** For other common issues, see the [General Troubleshooting Guide](WINDOWS_BLANK_SCREEN_FIX.md).

For a more detailed breakdown of the available build scripts, you can inspect the `scripts` section of the `package.json` file.
