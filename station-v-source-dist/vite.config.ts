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
          strict: false,
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
        devSourcemap: false,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.ELECTRON': JSON.stringify(isElectron)
      },
      build: {
        sourcemap: false,
        rollupOptions: {
          input: {
            main: isElectron ? 'index-electron.html' : 'index.html'
          },
          output: {
            inlineDynamicImports: false
          }
        },
        chunkSizeWarningLimit: 1000,
        minify: isElectron ? 'esbuild' : 'terser',
        assetsInlineLimit: 0,
        cssMinify: false,
        ssr: false,
        target: 'es2020',
        emptyOutDir: true,
        reportCompressedSize: false,
        watch: null,
        mode: 'production',
        write: true
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: isElectron ? './' : '/'
    };
});