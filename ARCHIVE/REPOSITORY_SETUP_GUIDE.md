# Repository Setup Guide

This guide provides instructions for setting up the Station V desktop application repository for local development.

## Quick Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/TimoP80/station_v_executable.git
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd station_v_executable
    ```

3.  **Install the dependencies:**
    ```bash
    npm install
    ```

4.  **Create a `.env` file** in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

5.  **Run the application in development mode:**
    ```bash
    npm run electron:dev
    ```

You are now ready to start developing the Station V desktop application.

## Repository Structure

The repository is organized into the following key directories:

-   **`components/`**: Contains all the React components that make up the application's UI.
-   **`electron/`**: Holds the Electron-specific code, including the main process (`main.ts`) and preload scripts.
-   **`scripts/`**: Includes various build and development scripts for the Electron application.
-   **`server/`**: Contains the WebSocket server used for the application's network mode.
-   **`services/`**: Holds the application's core logic, such as the network service, AI service, and chat log service.
-   **`src/`**: Contains the main entry point for the React application and global styles.
-   **`utils/`**: Includes utility functions and helpers used throughout the application.

## Development Workflow

-   **Making changes to the UI?** Edit the React components in the `components/` directory.
-   **Working on the main process?** Modify the files in the `electron/` directory.
-   **Adding new features?** Create new services in the `services/` directory and integrate them into the UI.

The application uses hot-reloading, so any changes you make to the source code will be automatically reflected in the running development application.
