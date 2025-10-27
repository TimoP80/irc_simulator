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
        fs: {
          strict: true,
          allow: ['.']
        }
      },
      plugins: [react()],
      optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['@google/genai'],
        esbuildOptions: {
          target: 'es2020'
        }
      },
      esbuild: {
        target: 'es2020'
      },
      css: {
        postcss: './postcss.config.js',
      },
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
        sourcemap: true,
        rollupOptions: {
          input: isElectron ? 'index-electron.html' : 'index.html',
          output: {
            manualChunks: {
              // Split vendor libraries into separate chunks
              'react-vendor': ['react', 'react-dom'],
              'google-ai': ['@google/genai'],
              // Split AI services into their own chunk
              'ai-services': [
                'services/geminiService',
                'services/usernameGeneration'
              ],
              // Split utility functions
              'utils': [
                'utils/importExport',
                'utils/personalityTemplates',
                'utils/config',
                'utils/debugLogger'
              ],
              // Split components into smaller chunks
              'modals': [
                'components/AddUserModal',
                'components/BatchUserModal',
                'components/ImportExportModal',
                'components/SettingsModal'
              ],
              'chat-components': [
                'components/ChatWindow',
                'components/Message',
                'components/ChannelList',
                'components/UserList'
              ]
            }
          }
        },
        chunkSizeWarningLimit: 600,
        cssCodeSplit: true,
        minify: isElectron ? 'esbuild' : 'terser'
      }
    };
});