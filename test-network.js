// Simple test script for Station V network functionality
import { WebSocket } from 'ws';

const testWebSocketConnection = async () => {
  console.log('🧪 Testing Station V network functionality...');
  
  try {
    // Test WebSocket connection
    const ws = new WebSocket('ws://localhost:8080/station-v');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      
      // Test joining a channel
      ws.send(JSON.stringify({
        type: 'join',
        nickname: 'TestUser',
        channel: '#test'
      }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);
      
      if (message.type === 'joined') {
        console.log('✅ Successfully joined channel:', message.channel);
        
        // Test sending a message
        ws.send(JSON.stringify({
          type: 'message',
          channel: '#test',
          content: 'Hello from test client!'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
    
    // Keep connection alive for 10 seconds
    setTimeout(() => {
      ws.close();
      console.log('✅ Test completed');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testWebSocketConnection();
