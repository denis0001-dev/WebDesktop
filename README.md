# WebDesktop

A modern desktop environment built with React, TypeScript, and Node.js. Features a floating taskbar with blur effects, draggable terminal windows, and real-time backend communication.

## Features

- 🖥️ **Modern Desktop UI** with glass morphism effects
- 📱 **Floating Taskbar** with blur backdrop and square icon buttons
- 🖼️ **Draggable Terminal Windows** with modern styling
- 🔌 **Real-time Backend** with WebSocket communication
- 🎯 **TTY-like Terminal** with command execution
- 📊 **Server Status Indicator** showing connection state
- 🎨 **Responsive Design** that works on mobile devices

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd WebDesktop
npm install
```

2. **Run the full application (frontend + backend):**
```bash
npm run dev:full
```

This will start both the backend server (port 3001) and frontend development server (port 5173).

### Alternative: Run Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture

### Frontend (React + TypeScript)
- **App.tsx** - Main desktop environment component
- **App.css** - Modern styling with glass morphism effects
- **WebSocket Integration** - Real-time communication with backend

### Backend (Node.js + Express)
- **server/index.ts** - Express server with WebSocket support
- **API Endpoints** - RESTful API for system information
- **WebSocket Server** - Real-time terminal command execution

## Terminal Commands

The terminal supports the following commands:

- `help` - Show available commands
- `clear` - Clear terminal output
- `date` - Show current date and time
- `echo [text]` - Echo the given text
- `ls` - List files (simulated)
- `pwd` - Show current directory
- `system` - Show system information
- `network` - Show network status

## API Endpoints

- `GET /api/status` - Server status and uptime
- `GET /api/system` - System information
- `POST /api/terminal/execute` - Execute terminal commands
- `WebSocket /` - Real-time communication

## Development

### Project Structure
```
WebDesktop/
├── src/                 # Frontend source
│   ├── App.tsx         # Main desktop component
│   ├── App.css         # Styling
│   └── main.tsx        # Entry point
├── server/             # Backend source
│   ├── index.ts        # Express server
│   └── tsconfig.json   # TypeScript config
├── package.json        # Dependencies and scripts
└── vite.config.ts      # Vite configuration
```

### Key Features

#### Taskbar
- Floating design with blur effects
- Square icon buttons with tooltips
- Server status indicator
- Start menu and terminal buttons

#### Terminal Window
- Draggable with modern styling
- Real-time command execution
- WebSocket communication with backend
- Fallback to local execution if server is offline

#### Backend Integration
- WebSocket for real-time communication
- RESTful API endpoints
- Command execution server-side
- System information and status

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express, WebSocket
- **Styling**: CSS3 with glass morphism effects
- **Build Tools**: Vite, TypeScript, ESLint

## License

MIT License - feel free to use this project for your own desktop environment!
