# Mobile App Source Directory

This directory contains the source code for the WordWave mobile application.

## Structure

```
src/
├── hooks/              # Custom React hooks
│   ├── useGestureDetector.ts    # Accelerometer gesture detection
│   └── useSocket.ts             # WebSocket connection management
├── services/           # API and external services
│   └── api.ts                   # REST API client
├── constants/          # App constants and configuration
│   └── theme.ts                 # Theme colors, spacing, typography
├── components/         # Reusable UI components (coming soon)
├── contexts/           # React Context providers (coming soon)
└── utils/              # Utility functions (coming soon)
```

## Key Features

### Gesture Detection
The `useGestureDetector` hook uses the device's accelerometer to detect swipe gestures:
- Swipe up: Mark word as guessed
- Swipe down: Skip word

### WebSocket Connection
The `useSocket` hook manages real-time communication with the game server:
- Auto-reconnection
- Game state synchronization
- Player updates
- Turn management

### API Client
Centralized API client for:
- Room creation and management
- Player management
- Categories and words
- Game state
