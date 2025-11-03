# Using Network Mode in Station V Windows EXE

## Overview

The Station V Windows executable automatically starts a WebSocket server when you run the application. This allows multiple users to connect and chat together, creating a hybrid environment with both human and AI users.

## Quick Start

### For Desktop Executable Users

1. **Run the Station V executable** (`Station V - Virtual IRC Simulator.exe`)
2. **The server starts automatically** on port 8080
3. **Open the Network panel** on the right side of the application
4. **Connect to the local server** with these settings:
   - Server Host: `localhost`
   - Server Port: `8080`
   - Your Nickname: (choose any nickname)
   - Auto-join Channels: `#general,#random` (comma-separated list)
5. **Click "Connect"**

You're now in **Network Mode**! You can chat with other users who connect to the same server.

## What is Network Mode?

Network mode enables **multi-user functionality** in Station V:

- **Multiple human users** can connect to the same server
- **AI virtual users** can interact with both human and network users
- **Real-time synchronization** across all connected clients
- **Channel sharing** - all users see the same channels and messages
- **Cross-tab sync** - multiple tabs stay synchronized

## Connection Instructions

### Using the Network Panel

1. **Locate the Network Panel**: Look for the "Network" tab on the right side of the application
2. **Configure Connection**:
   ```
   Server Host: localhost
   Server Port: 8080
   Nickname: YourName
   Auto-join Channels: #general
   ```
3. **Click "Connect"**: The connection status will show "Connected"

### Connecting Multiple Users

To connect multiple users:

**Option 1: Multiple Instances**
- Run multiple copies of the Station V executable
- Each instance should auto-connect or use the Network panel to connect
- Use different nicknames for each instance

**Option 2: Browser + Desktop App**
- Run the desktop app (server auto-starts)
- Open Station V in your browser at `http://localhost:3000`
- Use the Network panel in both to connect

**Option 3: Multiple Browser Tabs**
- Open multiple browser tabs with Station V
- All tabs will automatically stay synchronized via the WebSocket server

## Server Configuration

### Default Settings

When you run the EXE, the server automatically:
- Starts on **port 8080**
- Tries alternative ports (8081, 8082, 8083) if 8080 is busy
- Supports WebSocket connections at `ws://localhost:8080/station-v`

### Port Configuration

The server tries multiple ports if the default is busy:
- Primary: **8080**
- Fallback: **8081**, **8082**, **8083**

Check the console/logs to see which port the server started on.

## Network Features

### Supported Features

- ✅ **Multi-user chat** - Multiple human users in the same channels
- ✅ **AI integration** - Virtual users chat with both human and network users
- ✅ **Real-time messages** - Instant message delivery to all connected users
- ✅ **Channel management** - Join/leave channels dynamically
- ✅ **User list** - See all connected users (human, AI, and bots)
- ✅ **Nickname changes** - Change your nickname in real-time

### Message Types

- **User messages**: Messages sent by human users
- **AI messages**: Messages from virtual AI personalities
- **System messages**: Joins, parts, and other system notifications

## Troubleshooting

### Can't Connect to Server

**Problem**: Connection fails or timeout error
**Solutions**:
1. Make sure the EXE is running (server starts automatically)
2. Check firewall settings - port 8080 may be blocked
3. Verify you're using `localhost` not an IP address
4. Try alternative ports: 8081, 8082, or 8083

### Port Already in Use

**Problem**: "Port 8080 is already in use" error
**Solutions**:
1. Close other applications using port 8080
2. The server automatically tries ports 8081, 8082, 8083
3. Check the logs to see which port was actually used
4. Update the Network panel connection to use the new port

### Messages Not Appearing

**Problem**: Messages sent but not visible to other users
**Solutions**:
1. Verify you're connected (check Network panel status)
2. Make sure you're in the same channel as other users
3. Check that the server is running (console should show logs)
4. Try disconnecting and reconnecting

### Server Not Starting

**Problem**: Server doesn't start when running the EXE
**Solutions**:
1. Check if Node.js is installed on your system
2. Verify all files are present in the executable directory
3. Check the `station-v-debug.log` file for error messages
4. Try running the EXE as administrator

## Advanced Usage

### Connecting from External Devices

To connect from devices on your local network:

1. Find your computer's IP address (e.g., `192.168.1.100`)
2. On the device you want to connect from:
   - Use the network panel
   - Enter Server Host: `192.168.1.100` (your computer's IP)
   - Enter Server Port: `8080`
   - Click Connect

**Note**: Make sure your firewall allows incoming connections on port 8080.

### Running Multiple Servers

To run multiple independent Station V servers:

1. Run first EXE (starts on port 8080)
2. Manually start second server with different port:
   ```bash
   # In a terminal
   node server/station-v-server-simple.js 8090
   ```
3. Connect to different ports from different clients

## Technical Details

### Server Architecture

- **WebSocket Server**: Handles real-time communication
- **Port**: Configurable (default 8080)
- **Path**: `/station-v` (WebSocket endpoint)
- **Protocol**: WebSocket (ws://)

### Message Protocol

The server uses JSON-based messages:

**Join Channel**:
```json
{
  "type": "join",
  "nickname": "YourName",
  "channel": "#general"
}
```

**Send Message**:
```json
{
  "type": "message",
  "channel": "#general",
  "content": "Hello everyone!"
}
```

### Client Libraries

For custom integrations, you can connect using any WebSocket client:
- JavaScript: `new WebSocket('ws://localhost:8080/station-v')`
- Python: `websocket-client` library
- Other languages: Any WebSocket implementation

## Development vs Production

### Desktop EXE
- Server starts automatically
- No additional setup required
- Single-click operation
- All-in-one package

### Development Mode
- Start server manually: `npm run server`
- Or use full dev environment: `npm run dev:full`
- More control over server configuration
- Better for debugging

## Best Practices

1. **Use unique nicknames** for each connected user
2. **Monitor server logs** for connection issues
3. **Close connections properly** before shutting down the app
4. **Test with 2-3 users** before large-scale deployments
5. **Keep channels organized** with clear naming conventions

## FAQ

**Q: Do I need to install Node.js to run the EXE?**
A: No, the EXE includes all necessary dependencies. Just run the executable.

**Q: Can I run the server on a different port?**
A: The server automatically tries alternative ports if 8080 is busy. For custom ports, you'll need to modify the code.

**Q: Can I connect from a different computer?**
A: Yes, use your computer's IP address instead of `localhost` in the Network panel.

**Q: How many users can connect?**
A: There's no hard limit, but performance may degrade with 50+ concurrent users.

**Q: Do I need internet for network mode?**
A: No, network mode works entirely on your local network. No internet required.

**Q: Can AI users see network users?**
A: Yes! AI virtual users can interact with both local and network users.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the `station-v-debug.log` file
3. Verify your firewall settings
4. Test with a simple connection first

## Related Documentation

- [NETWORK_SETUP.md](NETWORK_SETUP.md) - General network setup guide
- [README.md](README.md) - Main project documentation
- [BUILD_EXE_MANUAL_GUIDE.md](BUILD_EXE_MANUAL_GUIDE.md) - Building the EXE

