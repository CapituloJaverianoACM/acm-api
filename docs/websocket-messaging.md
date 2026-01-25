# WebSocket Messaging System

This document explains the new WebSocket messaging system that provides type-safe communication between the server and clients.

## Overview

The messaging system consists of:

1. **WebSocket Actions Enum** - All possible message actions
2. **Type Definitions** - Specific data schemas for each action
3. **WebSocket Messenger** - Helper class for sending messages
4. **Type Safety** - Full TypeScript support with proper typing

## Message Structure

All WebSocket messages follow this structure:

```json
{
  "action": "ACTION_NAME",
  "data": { /* action-specific data */ },
  "timestamp": 1234567890
}
```

## Available Actions

### Outgoing Actions (Server to Client)
- `SESSION_CONNECTED` - User successfully connected to session
- `SESSION_RESUME` - User reconnected to existing session
- `SESSION_DISCONNECTED` - User disconnected from session
- `MATCH_FOUND` - Opponent found for user
- `MATCH_START` - Match started with problem details
- `MATCH_END` - Match ended with winner/loser info
- `MATCH_CANCELLED` - Match was cancelled
- `USER_READY` - User marked as ready
- `USER_NOT_READY` - User marked as not ready
- `USER_JOINED` - New user joined session
- `USER_LEFT` - User left session
- `PROBLEM_ASSIGNED` - Problem assigned to users
- `WINNER` - User won the match
- `LOSER` - User lost the match
- `CONTINUE` - User should continue trying
- `ERROR` - Error occurred with details
- `PING` - Ping message for connection health
- `PONG` - Pong response

### Incoming Actions (Client to Server)
- `READY` - User is ready to start match (requires `handle`)
- `NOT_READY` - User is not ready
- `CHECK` - User requests win condition check

## Usage Examples

### Server-side (MatchService)

```typescript
import { WebSocketMessenger } from '../utils/websocket-messenger';

class MatchService {
    private messenger: WebSocketMessenger;
    
    constructor() {
        this.messenger = new WebSocketMessenger(this.activeConnections);
    }
    
    // Send match start to all users
    async startMatch(pairKey: string, problem: CFProblem) {
        this.messenger.sendMatchStart(pairKey, {
            pairKey,
            problem: {
                contestId: problem.contestId,
                index: problem.index,
                name: problem.name,
                rating: problem.rating,
                url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
            }
        });
    }
    
    // Send winner notification
    declareWinner(pairKey: string, userId: number, problem: CFProblem) {
        this.messenger.sendWinner(pairKey, userId, {
            pairKey,
            userId,
            problem: {
                contestId: problem.contestId,
                index: problem.index,
                name: problem.name,
                time: Date.now()
            }
        });
    }
    
    // Send error to specific user
    sendError(pairKey: string, userId: number, error: WebSocketError) {
        this.messenger.sendError(pairKey, userId, error, getErrorMessage(error));
    }
}
```

### Client-side (Frontend)

```typescript
// WebSocket message handler
function handleWebSocketMessage(message: any) {
    switch (message.action) {
        case 'MATCH_START':
            const { problem } = message.data;
            console.log(`Match started! Problem: ${problem.name}`);
            console.log(`URL: ${problem.url}`);
            break;
            
        case 'WINNER':
            const { problem: winnerProblem, time } = message.data;
            console.log(`You won! Time: ${time}ms`);
            break;
            
        case 'LOSER':
            const { opponent } = message.data;
            console.log(`You lost! Opponent: ${opponent.handle}`);
            break;
            
        case 'ERROR':
            const { code, message: errorMsg, context } = message.data;
            console.error(`Error [${code}]: ${errorMsg} (${context})`);
            break;
            
        default:
            console.log('Unknown message:', message);
    }
}

// Send messages to server
function sendReady(ws: WebSocket, handle: string) {
    ws.send(JSON.stringify({
        action: 'READY',
        data: { handle }
    }));
}

function sendNotReady(ws: WebSocket) {
    ws.send(JSON.stringify({
        action: 'NOT_READY',
        data: {}
    }));
}

function sendCheck(ws: WebSocket) {
    ws.send(JSON.stringify({
        action: 'CHECK',
        data: {}
    }));
}

// WebSocket connection
const ws = new WebSocket('ws://localhost:3000/match');
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
};

// Example usage
document.getElementById('readyButton')?.addEventListener('click', () => {
    const handle = document.getElementById('handleInput')?.value;
    if (handle) {
        sendReady(ws, handle);
    }
});

document.getElementById('notReadyButton')?.addEventListener('click', () => {
    sendNotReady(ws);
});

document.getElementById('checkButton')?.addEventListener('click', () => {
    sendCheck(ws);
});
```

## Type Safety

The system provides full TypeScript type safety:

```typescript
// Outgoing message types
type MatchStartMessage = {
    action: 'MATCH_START';
    data: {
        pairKey: string;
        problem: {
            contestId: number;
            index: string;
            name: string;
            rating: number;
            url: string;
        };
    };
    timestamp?: number;
};

// Incoming message types
type ReadyMessage = {
    action: 'READY';
    data: {
        handle: string;
    };
    timestamp?: number;
};

type NotReadyMessage = {
    action: 'NOT_READY';
    data: {};
    timestamp?: number;
};

type CheckMessage = {
    action: 'CHECK';
    data: {};
    timestamp?: number;
};

// Union type for all possible messages
type WebSocketMessage = 
    | MatchStartMessage
    | WinnerMessage
    | LoserMessage
    | ErrorMessage
    | ReadyMessage
    | NotReadyMessage
    | CheckMessage
    | // ... other message types
    ;
```

## Error Handling

All errors are sent with consistent structure:

```json
{
  "action": "ERROR",
  "data": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found. Please reconnect.",
    "context": "setReady",
    "details": null
  },
  "timestamp": 1234567890
}
```

## Benefits

1. **Type Safety**: Full TypeScript support with proper typing
2. **Consistency**: All messages follow the same structure
3. **Maintainability**: Centralized message handling
4. **Documentation**: Self-documenting with clear action names
5. **Error Handling**: Comprehensive error reporting
6. **Extensibility**: Easy to add new actions and data types

## Migration Notes

The old format:
```json
{
  "action": "START_MATCH",
  "data": problem
}
```

New format:
```json
{
  "action": "MATCH_START",
  "data": {
    "pairKey": "room-123",
    "problem": {
      "contestId": 1001,
      "index": "A",
      "name": "Test Problem",
      "rating": 800,
      "url": "https://codeforces.com/problemset/problem/1001/A"
    }
  },
  "timestamp": 1234567890
}
```

Clients should be updated to handle the new message format and action names.
