# Copilot Instructions for Station V Desktop Executable

## Project Overview
- **Station V** is a cross-platform desktop IRC simulator where all users except you are AI agents powered by Google Gemini.
- Built with **React 18/19**, **TypeScript**, **Tailwind CSS**, and **Vite** for the frontend; **Electron** for desktop builds; **WebSocket** for network/multi-user support.
- This repository is the **main active codebase** for the desktop executable version. See `MAIN_CODEBASE.md` for status and structure.

## Key Architecture & Patterns
- **Component Structure**: UI in `components/`, business logic in `services/`, Electron main process in `electron/`, build/dev scripts in `scripts/`, WebSocket server in `server/`.
- **AI Integration**: All non-human users are AI-driven. Personality, memory, and relationship logic is in `services/` (notably `botService.ts`, `relationshipMemoryService.ts`).
- **Network Mode**: Multi-user support via WebSocket server (`server/`). Local and network modes share most logic.
- **Persistent Data**: Uses IndexedDB for chat logs and settings.
- **Quoting/Reply System**: Discord-style quoting, hover-to-reply, and quote preview are core UI features (see `MessageItem.tsx`, `components/Message.tsx`).
- **Personality System**: AI users have 7-level formality, verbosity, humor, emoji, and punctuation attributes. See README for details.

## Build & Development Workflows
- **Install**: `npm install` (Node.js 16+ required)
- **Start (single-user dev)**: `npm run dev` (Vite client only)
- **Start (full/network dev)**: `npm run dev:full` (client + server)
- **Windows alternatives**: `npm run dev:full:win` or `npm run dev:full:ps` if `concurrently` fails
- **Electron dev**: `npm run electron:dev`
- **Build desktop executable**: `npm run electron:build:win` (see `DESKTOP_DISTRIBUTION_GUIDE.md` for more)
- **Portable ZIP**: `npm run electron:build:portable`
- **Single EXE**: `npm run electron:build:single` (see guide for post-processing)
- **Test build**: `npm run electron:test`
- **Clean**: `npm run clean` or `npm run electron:clean`

## Project Conventions
- **TypeScript strict mode**; functional React components; Tailwind for all styling.
- **No global state libraries**; state is managed via React context/hooks and service modules.
- **All AI/logic code in `services/`**; UI logic in `components/`.
- **Electron config**: `package-electron.json`, `tsconfig.electron.json`.
- **Scripts**: All build/dev scripts in `scripts/` (see file headers for usage).
- **.env**: Requires `GEMINI_API_KEY` for AI features.

## Debugging & Troubleshooting
- **Common issues**: Port conflicts (3000/8080), missing dependencies, PowerShell command syntax (use `;` not `&&`), Electron build errors (see README troubleshooting).
- **Debug Electron**: Use `npm run dev:electron:debug` for DevTools.
- **Check logs**: Build/test logs in terminal; persistent logs in app UI.

## Documentation
- **README.md**: Main documentation, build/dev commands, feature list.
- **DESKTOP_DISTRIBUTION_GUIDE.md**: Desktop build/distribution details.
- **MAIN_CODEBASE.md**: Codebase status, structure, and guidelines.
- **REPOSITORY_SETUP_GUIDE.md**: Initial setup instructions.
- **NETWORK_SETUP.md**: Network/multi-user mode details.

## Example: Adding a New Chat Feature
1. Add UI in `components/` (e.g., `ChatWindow.tsx`).
2. Add/extend logic in `services/` (e.g., `chatLogService.ts`).
3. Update types in `types/` if needed.
4. Wire up in `App.tsx` or relevant parent.
5. Test in both single-user and network modes.

---
For more, see the README and referenced guides. When in doubt, follow the structure and patterns of existing files.
