import { WebSocketAction, WebSocketMessageMap, createWebSocketMessage, SessionConnectedData, SessionResumeData, UserReadyData, UserNotReadyData, MatchStartData, WinnerData, LoserData, ContinueData } from './websocket-types';

export class WebSocketMessenger {
    private connections: Map<string, Map<number, any>>;

    constructor(connections: Map<string, Map<number, any>>) {
        this.connections = connections;
    }

    // Generic message sender
    sendToUser<T extends WebSocketAction>(
        pairKey: string, 
        userId: number, 
        action: T, 
        data: WebSocketMessageMap[T]['data']
    ): boolean {
        const ws = this.connections.get(pairKey)?.get(userId);
        if (!ws) {
            return false;
        }

        const message = createWebSocketMessage(action, data);
        ws.send(JSON.stringify(message));
        return true;
    }

    // Send to all users in a session
    sendToSession<T extends WebSocketAction>(
        pairKey: string, 
        action: T, 
        data: WebSocketMessageMap[T]['data'],
        excludeUserId?: number
    ): number {
        const connections = this.connections.get(pairKey);
        if (!connections) {
            return 0;
        }

        const message = createWebSocketMessage(action, data);
        let sentCount = 0;

        connections.forEach((ws, userId) => {
            if (excludeUserId && userId === excludeUserId) {
                return;
            }
            
            if (ws && (ws.readyState === undefined || ws.readyState === 1)) { // 1 = WebSocket.OPEN
                ws.send(JSON.stringify(message));
                sentCount++;
            }
        });

        return sentCount;
    }

    // Specific message helpers
    sendSessionConnected(pairKey: string, userId: number, contestId: number, isReconnection: boolean): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.SESSION_CONNECTED, {
            pairKey,
            contestId,
            userId,
            isReconnection
        });
    }

    sendSessionResume(pairKey: string, userId: number, sessionData: SessionResumeData): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.SESSION_RESUME, sessionData);
    }

    sendUserReady(pairKey: string, userId: number): number {
        return this.sendToSession(pairKey, WebSocketAction.USER_READY, {
            pairKey,
            userId,
        }, userId);
    }

    sendUserNotReady(pairKey: string, userId: number): number {
        return this.sendToSession(pairKey, WebSocketAction.USER_NOT_READY, {
            pairKey,
            userId
        }, userId);
    }

    sendMatchStart(pairKey: string, problem: MatchStartData): number {
        return this.sendToSession(pairKey, WebSocketAction.MATCH_START, problem);
    }

    sendWinner(pairKey: string, userId: number, problem: WinnerData): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.WINNER, problem);
    }

    sendLoser(pairKey: string, userId: number, opponent: LoserData): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.LOSER, opponent);
    }

    sendContinue(pairKey: string, userId: number): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.CONTINUE, {
            pairKey,
            userId
        });
    }

    sendError(pairKey: string, userId: number, code: string, message: string, context?: string, details?: any): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.ERROR, {
            code,
            message,
            context,
            details
        });
    }

    // Broadcast error to all users in session
    sendErrorToSession(pairKey: string, code: string, message: string, context?: string, details?: any): number {
        return this.sendToSession(pairKey, WebSocketAction.ERROR, {
            code,
            message,
            context,
            details
        });
    }

    // System messages
    sendPing(pairKey: string, userId: number): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.PING, {
            timestamp: Date.now()
        });
    }

    sendPong(pairKey: string, userId: number, originalTimestamp: number): boolean {
        return this.sendToUser(pairKey, userId, WebSocketAction.PONG, {
            timestamp: Date.now(),
            originalTimestamp
        });
    }

    // Utility methods
    isUserConnected(pairKey: string, userId: number): boolean {
        return this.connections.has(pairKey) && 
               this.connections.get(pairKey)!.has(userId);
    }

    getConnectedUsers(pairKey: string): number[] {
        const connections = this.connections.get(pairKey);
        return connections ? Array.from(connections.keys()) : [];
    }

    getSessionSize(pairKey: string): number {
        return this.connections.get(pairKey)?.size || 0;
    }
}
