# Station V Network Setup Guide

This guide explains how to set up and use the network functionality in Station V, allowing multiple human users to connect to the same virtual chat environment.

## Overview

Station V now supports network functionality that allows:
- Multiple human users to connect via WebSocket or IRC
- Real-time communication between human users and AI virtual users
- Hybrid chat environments with both human and AI participants

## Architecture

### Server Components
- **Station V Server** (`server/station-v-server.js`): Main server handling WebSocket and IRC connections
- **WebSocket Server**: Handles web client connections on port 8080
- **IRC Server**: Handles IRC client connections on port 6667

### Client Components
- **Network Service** (`services/networkService.ts`): Handles client-side network communication
- **Network Connection Component**: UI for connecting to the server
- **Network Users Component**: UI for displaying connected users

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
# Start the Station V server
npm run server

# Or start both server and client together
npm run dev:full
```

The server will start on:
- WebSocket: `ws://localhost:8080/station-v`
- IRC: `irc://localhost:6667`

### 3. Connect Clients

#### Web Client Connection
1. Open Station V in your browser
2. Click the "Network" panel on the right side
3. Configure connection settings:
   - Server Host: `localhost` (or your server IP)
   - Server Port: `8080`
   - Nickname: Your desired nickname
   - Auto-join Channels: `#general` (comma-separated)
4. Click "Connect"

#### IRC Client Connection
Connect any IRC client to:
- Server: `localhost`
- Port: `6667`
- Nickname: Your desired nickname
- Channels: `#general`, `#random`, etc.

## Usage

### For Web Clients
1. **Connect**: Use the Network panel to connect to the server
2. **Join Channels**: Channels are joined automatically based on your configuration
3. **Send Messages**: Type messages in the chat window as usual
4. **See Network Users**: The Network panel shows all connected users (human, virtual, and bot)

### For IRC Clients
1. **Connect**: Use your preferred IRC client to connect to `localhost:6667`
2. **Join Channels**: Use `/join #channelname` to join channels
3. **Send Messages**: Type messages normally in your IRC client
4. **See All Users**: All users (human and AI) will appear in your IRC client

### Network Features
- **Real-time Communication**: Messages are synchronized between all clients
- **User Management**: See all connected users with their types (human/virtual/bot)
- **Channel Management**: Join/leave channels dynamically
- **Nickname Changes**: Change your nickname in real-time
- **Hybrid Environment**: Human users can chat with AI virtual users

## Configuration

### Server Configuration
The server can be configured by modifying `server/station-v-server.js`:
- Port numbers (default: WebSocket 8080, IRC 6667)
- Server host binding
- Channel management
- User limits

### Client Configuration
Web clients can configure:
- Server host and port
- Nickname
- Auto-join channels
- Connection preferences

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if the server is running
   - Verify the server host and port
   - Check firewall settings

2. **Nickname Already in Use**
   - The server will automatically append a timestamp to duplicate nicknames
   - Try a different nickname

3. **Messages Not Appearing**
   - Check if you're in the correct channel
   - Verify network connection
   - Check browser console for errors

4. **IRC Client Issues**
   - Ensure you're connecting to the correct port (6667)
   - Check if the server is running
   - Verify IRC client configuration

### Debug Information
- Server logs are displayed in the terminal where you started the server
- Web client logs are available in the browser console
- IRC client logs depend on your IRC client

## Advanced Usage

### Running on Different Machines
1. Start the server on your machine
2. Configure clients to connect to your machine's IP address
3. Ensure port 8080 (WebSocket) and 6667 (IRC) are accessible

### Custom Channels
- Web clients: Add channels to the auto-join list
- IRC clients: Use `/join #channelname` to join custom channels
- All channels support both human and AI users

### Integration with Existing IRC Networks
The server can be configured to bridge with existing IRC networks, allowing Station V to connect to real IRC servers while maintaining the virtual user functionality.

## Security Considerations

- The server currently has no authentication
- All users can join any channel
- Consider implementing authentication for production use
- Use HTTPS/WSS for secure connections in production

## Development

### Adding New Features
- Network service: `services/networkService.ts`
- Server logic: `server/station-v-server.js`
- UI components: `components/NetworkConnection.tsx`, `components/NetworkUsers.tsx`

### Testing
- Test with multiple web clients
- Test with IRC clients
- Test mixed environments (web + IRC clients)
- Test channel management and user interactions

## Support

For issues or questions:
1. Check the server logs
2. Check browser console for client errors
3. Verify network connectivity
4. Check firewall and port accessibility
