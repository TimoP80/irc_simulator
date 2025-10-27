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
        // Use different HTML template for Electron
        rollupOptions: {
          input: isElectron ? 'index-electron.html' : 'index.html',
          output: {
            // Simplified chunking for better Electron compatibility
            manualChunks: (id) => {
              // Only chunk node_modules for Electron
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@google')) {
                  return 'google-ai';
                }
                return 'vendor';
              }
            }
          }
        },
        // Increase chunk size warning limit to 600KB to reduce noise
        chunkSizeWarningLimit: 600,
        // Ensure CSS is properly processed and included
        cssCodeSplit: false,
        // Optimize CSS for Electron builds
        minify: isElectron ? 'esbuild' : 'terser'
      }
    };
});