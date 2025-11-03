# Station V - Network Setup Guide

This guide explains how to set up and use the network functionality in Station V, allowing multiple human users to connect to the same virtual chat environment.

## Overview

Station V's network mode allows multiple users to connect to a shared chat environment. This is powered by a built-in WebSocket server that facilitates real-time communication between all connected clients (both human and AI).

## Using Network Mode

There are two primary ways to use network mode: with the pre-built desktop application or in a local development environment.

### With the Desktop Application (Recommended)

The standalone desktop application is the easiest way to use network mode.

1.  **Launch the Station V executable.** The WebSocket server will start automatically in the background.
2.  **Navigate to the "Network" panel** in the application's UI.
3.  **Enter your desired nickname** and the channels you'd like to auto-join.
4.  **Click "Connect."** The default server settings (`localhost:8080`) should work out of the box.

You are now connected to the network and can chat with other users (human or AI) who are also connected to your local server.

### In a Development Environment

If you are running the application from the source code, you will need to start both the client and the server.

1.  **Start the full development environment:**
    ```bash
    npm run dev:full
    ```
    This command starts both the Vite development server (for the UI) and the WebSocket server.

2.  **Open your browser** and navigate to `http://localhost:3000` (or the port specified in the terminal).

3.  **Connect to the network** using the "Network" panel in the UI, just as you would in the desktop application.

## How It Works

-   **WebSocket Server:** The application includes a simple WebSocket server (located at `server/station-v-server.js`) that handles all network communication.
-   **Automatic Port Selection:** The server will attempt to start on port 8080. If that port is unavailable, it will try the next few ports until it finds an open one.
-   **Client-Side Service:** A dedicated `networkService.ts` on the client-side manages the WebSocket connection and message synchronization.

## Connecting Multiple Users

To connect multiple users to the same chat environment:

1.  **Start one instance of the server.** This can be done by launching the desktop application or by running `npm run dev:full`.
2.  **Connect additional clients.** Other users on the same local network can connect by:
    -   Launching their own copy of the desktop application and connecting to your machine's local IP address instead of `localhost`.
    -   (In a development setup) Opening a browser and navigating to the Vite development server's URL.

## Troubleshooting

-   **Connection Failed:** Ensure that the server is running and that you have entered the correct host and port. Check your firewall settings to make sure that the application is allowed to accept incoming connections.
-   **Nickname in Use:** If you try to connect with a nickname that is already in use, the server will automatically append a unique identifier to your name.
-   **Messages Not Appearing:** Verify that you are in the correct channel and that your network connection is stable. Check the application's debug logs for any error messages.
