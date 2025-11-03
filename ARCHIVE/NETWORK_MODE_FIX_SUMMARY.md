# Network Mode Guide

This guide provides an overview of the network mode feature in the Station V desktop application.

## What is Network Mode?

Network mode allows multiple users to connect to the same Station V chat environment. This enables collaborative sessions where several human users can interact with each other and the AI-powered virtual users in real-time.

## How It Works

The application includes a built-in WebSocket server that facilitates communication between all connected clients. When you launch the desktop application, this server starts automatically in the background, allowing other users on your local network to connect to your session.

### Key Features

-   **Multi-User Chat:** Multiple human users can join the same channels and participate in conversations.
-   **AI Integration:** The AI-powered virtual users will interact with all connected users, creating a dynamic and engaging chat environment.
-   **Simple Setup:** No complex server configuration is required. Simply launch the application and share your local IP address with other users.

## Getting Started

To start a network session, please refer to the [Network Setup Guide](NETWORK_SETUP.md) for detailed instructions on how to connect multiple users.

## Technical Details

-   **Server:** The WebSocket server is located at `server/station-v-server.js`.
-   **Client:** The client-side network logic is managed by the `services/networkService.ts`.
-   **Port:** The server defaults to port 8080 but will automatically find an open port if the default is in use.

This feature is ideal for collaborative world-building, interactive storytelling, or simply sharing the unique experience of Station V with others.
