import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WebSocketMessenger } from '../utils/websocket-messenger';
import { WebSocketAction } from '../utils/websocket-types';

// Mock WebSocket
class MockWebSocket {
    sentMessages: string[] = [];
    readyState = 1; // OPEN

    send(message: string) {
        this.sentMessages.push(message);
    }

    close() {
        this.readyState = 3; // CLOSED
    }
}

describe('WebSocket Messenger', () => {
    let messenger: WebSocketMessenger;
    let connections: Map<string, Map<number, any>>;

    beforeEach(() => {
        connections = new Map();
        messenger = new WebSocketMessenger(connections);
    });

    afterEach(() => {
        connections.clear();
    });

    describe('Connection Management', () => {
        it('should check if user is connected', () => {
            const pairKey = 'test-room';
            const userId = 123;
            const ws = new MockWebSocket();

            connections.set(pairKey, new Map());
            connections.get(pairKey)!.set(userId, ws);

            expect(messenger.isUserConnected(pairKey, userId)).toBe(true);
            expect(messenger.isUserConnected(pairKey, 456)).toBe(false);
            expect(messenger.isUserConnected('other-room', userId)).toBe(false);
        });

        it('should get connected users', () => {
            const pairKey = 'test-room';
            const ws1 = new MockWebSocket();
            const ws2 = new MockWebSocket();

            connections.set(pairKey, new Map());
            connections.get(pairKey)!.set(123, ws1);
            connections.get(pairKey)!.set(456, ws2);

            const users = messenger.getConnectedUsers(pairKey);
            expect(users).toEqual([123, 456]);
        });

        it('should get session size', () => {
            const pairKey = 'test-room';
            const ws1 = new MockWebSocket();
            const ws2 = new MockWebSocket();

            connections.set(pairKey, new Map());
            connections.get(pairKey)!.set(123, ws1);
            connections.get(pairKey)!.set(456, ws2);

            expect(messenger.getSessionSize(pairKey)).toBe(2);
            expect(messenger.getSessionSize('empty-room')).toBe(0);
        });
    });

    describe('Message Sending', () => {
        beforeEach(() => {
            const pairKey = 'test-room';
            const ws1 = new MockWebSocket();
            const ws2 = new MockWebSocket();

            connections.set(pairKey, new Map());
            connections.get(pairKey)!.set(123, ws1);
            connections.get(pairKey)!.set(456, ws2);
        });

        it('should send message to specific user', () => {
            const sent = messenger.sendToUser('test-room', 123, WebSocketAction.ERROR, {
                code: 'TEST_ERROR',
                message: 'Test error message'
            });

            expect(sent).toBe(true);
            
            const userWs = connections.get('test-room')!.get(123);
            expect(userWs.sentMessages).toHaveLength(1);
            
            const message = JSON.parse(userWs.sentMessages[0]);
            expect(message.action).toBe('ERROR');
            expect(message.data.code).toBe('TEST_ERROR');
            expect(message.data.message).toBe('Test error message');
            expect(message.timestamp).toBeDefined();
        });

        it('should return false when user not found', () => {
            const sent = messenger.sendToUser('test-room', 999, WebSocketAction.ERROR, {
                code: 'TEST_ERROR',
                message: 'Test error message'
            });

            expect(sent).toBe(false);
        });

        it('should send message to all users in session', () => {
            const sentCount = messenger.sendToSession('test-room', WebSocketAction.PING, {
                timestamp: Date.now()
            });

            expect(sentCount).toBe(2);

            const user1Ws = connections.get('test-room')!.get(123);
            const user2Ws = connections.get('test-room')!.get(456);
            
            expect(user1Ws.sentMessages).toHaveLength(1);
            expect(user2Ws.sentMessages).toHaveLength(1);
            
            const message1 = JSON.parse(user1Ws.sentMessages[0]);
            const message2 = JSON.parse(user2Ws.sentMessages[0]);
            
            expect(message1.action).toBe('PING');
            expect(message2.action).toBe('PING');
        });

        it('should exclude specific user from session broadcast', () => {
            const sentCount = messenger.sendToSession('test-room', WebSocketAction.PING, {
                timestamp: Date.now()
            }, 123);

            expect(sentCount).toBe(1);

            const user1Ws = connections.get('test-room')!.get(123);
            const user2Ws = connections.get('test-room')!.get(456);
            
            expect(user1Ws.sentMessages).toHaveLength(0);
            expect(user2Ws.sentMessages).toHaveLength(1);
        });
    });

    describe('Specific Message Helpers', () => {
        beforeEach(() => {
            const pairKey = 'test-room';
            const ws1 = new MockWebSocket();
            const ws2 = new MockWebSocket();

            connections.set(pairKey, new Map());
            connections.get(pairKey)!.set(123, ws1);
            connections.get(pairKey)!.set(456, ws2);
        });

        it('should send session connected message', () => {
            const sent = messenger.sendSessionConnected('test-room', 123, 1, false);
            
            expect(sent).toBe(true);
            
            const ws = connections.get('test-room')!.get(123);
            const message = JSON.parse(ws.sentMessages[0]);
            
            expect(message.action).toBe('SESSION_CONNECTED');
            expect(message.data.pairKey).toBe('test-room');
            expect(message.data.contestId).toBe(1);
            expect(message.data.userId).toBe(123);
            expect(message.data.isReconnection).toBe(false);
        });

        it('should send match start message', () => {
            const sentCount = messenger.sendMatchStart('test-room', {
                pairKey: 'test-room',
                problem: {
                    contestId: 1001,
                    index: 'A',
                    name: 'Test Problem',
                    rating: 800,
                    url: 'https://codeforces.com/problemset/problem/1001/A'
                }
            });
            
            expect(sentCount).toBe(2);
            
            const ws = connections.get('test-room')!.get(123);
            const message = JSON.parse(ws.sentMessages[0]);
            
            expect(message.action).toBe('MATCH_START');
            expect(message.data.problem.name).toBe('Test Problem');
            expect(message.data.problem.url).toContain('codeforces.com');
        });

        it('should send error message', () => {
            const sent = messenger.sendError('test-room', 123, 'INTERNAL_ERROR', 'Test error', 'test-context');
            
            expect(sent).toBe(true);
            
            const ws = connections.get('test-room')!.get(123);
            const message = JSON.parse(ws.sentMessages[0]);
            
            expect(message.action).toBe('ERROR');
            expect(message.data.code).toBe('INTERNAL_ERROR');
            expect(message.data.message).toBe('Test error');
            expect(message.data.context).toBe('test-context');
        });

        it('should send error to entire session', () => {
            const sentCount = messenger.sendErrorToSession('test-room', 'INTERNAL_ERROR', 'Test error');
            
            expect(sentCount).toBe(2);
            
            const ws1 = connections.get('test-room')!.get(123);
            const ws2 = connections.get('test-room')!.get(456);
            
            expect(ws1.sentMessages).toHaveLength(1);
            expect(ws2.sentMessages).toHaveLength(1);
            
            const message1 = JSON.parse(ws1.sentMessages[0]);
            const message2 = JSON.parse(ws2.sentMessages[0]);
            
            expect(message1.action).toBe('ERROR');
            expect(message2.action).toBe('ERROR');
        });
    });
});
