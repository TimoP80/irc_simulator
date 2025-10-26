import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isElectron = process.env.ELECTRON === 'true';
    
    console.log('Vite config - ELECTRON:', process.env.ELECTRON, 'isElectron:', isElectron);
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ELECTRON': JSON.stringify(isElectron)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: isElectron ? './' : '/',
      build: {
        // Use different HTML template for Electron
        rollupOptions: {
          input: isElectron ? 'index-electron.html' : 'index.html',
          output: {
            manualChunks: {
              // Split vendor libraries into separate chunks
              'react-vendor': ['react', 'react-dom'],
              'google-ai': ['@google/genai'],
              // Split AI services into their own chunk
              'ai-services': [
                './services/geminiService.ts',
                './services/usernameGeneration.ts'
              ],
              // Split utility functions
              'utils': [
                './utils/importExport.ts',
                './utils/personalityTemplates.ts',
                './utils/config.ts',
                './utils/debugLogger.ts'
              ],
              // Split components into smaller chunks
              'modals': [
                './components/AddUserModal.tsx',
                './components/BatchUserModal.tsx',
                './components/ImportExportModal.tsx',
                './components/SettingsModal.tsx'
              ],
              'chat-components': [
                './components/ChatWindow.tsx',
                './components/Message.tsx',
                './components/ChannelList.tsx',
                './components/UserList.tsx'
              ]
            }
          }
        },
        // Increase chunk size warning limit to 600KB to reduce noise
        chunkSizeWarningLimit: 600
      }
    };
});