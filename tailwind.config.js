/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index-electron.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        'irc-bg': '#111827',
        'irc-text': '#e5e7eb',
        'irc-border': '#374151',
        'irc-hover': '#1f2937',
      }
    },
  },
  plugins: [],
}
