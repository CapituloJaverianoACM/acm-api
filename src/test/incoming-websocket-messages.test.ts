import { describe, it, expect } from 'bun:test';
import { WebSocketAction, IncomingWebSocketMessage } from '../utils/websocket-types';

describe('Incoming WebSocket Messages', () => {
    describe('Message Type Validation', () => {
        it('should validate READY message structure', () => {
            const message: IncomingWebSocketMessage = {
                action: WebSocketAction.READY,
                data: {
                    handle: 'testuser123'
                },
                timestamp: Date.now()
            };

            expect(message.action).toBe('READY');
            expect(message.data).toHaveProperty('handle');
            expect(message.data.handle).toBe('testuser123');
        });

        it('should validate NOT_READY message structure', () => {
            const message: IncomingWebSocketMessage = {
                action: WebSocketAction.NOT_READY,
                data: {},
                timestamp: Date.now()
            };

            expect(message.action).toBe('NOT_READY');
            expect(message.data).toEqual({});
        });

        it('should validate CHECK message structure', () => {
            const message: IncomingWebSocketMessage = {
                action: WebSocketAction.CHECK,
                data: {},
                timestamp: Date.now()
            };

            expect(message.action).toBe('CHECK');
            expect(message.data).toEqual({});
        });
    });

    describe('Message Action Validation', () => {
        it('should include all incoming actions in WebSocketAction enum', () => {
            const incomingActions = [
                WebSocketAction.READY,
                WebSocketAction.NOT_READY,
                WebSocketAction.CHECK
            ];

            incomingActions.forEach(action => {
                expect(Object.values(WebSocketAction)).toContain(action);
            });
        });

        it('should validate message action is a WebSocketAction', () => {
            const validMessage = {
                action: WebSocketAction.READY,
                data: { handle: 'test' }
            };

            expect(Object.values(WebSocketAction)).toContain(validMessage.action);
        });
    });

    describe('Type Safety', () => {
        it('should enforce correct data structure for READY', () => {
            // This should compile without errors
            const readyMessage: IncomingWebSocketMessage = {
                action: WebSocketAction.READY,
                data: { handle: 'required' }
            };

            expect(readyMessage.data).toHaveProperty('handle');
        });

        it('should allow empty data for NOT_READY', () => {
            const notReadyMessage: IncomingWebSocketMessage = {
                action: WebSocketAction.NOT_READY,
                data: {}
            };

            expect(notReadyMessage.data).toEqual({});
        });

        it('should allow empty data for CHECK', () => {
            const checkMessage: IncomingWebSocketMessage = {
                action: WebSocketAction.CHECK,
                data: {}
            };

            expect(checkMessage.data).toEqual({});
        });
    });

    describe('Runtime Validation', () => {
        it('should validate message structure at runtime', () => {
            const testMessage = {
                action: 'READY' as WebSocketAction.READY,
                data: { handle: 'testuser' },
                timestamp: Date.now()
            };

            // Validate action
            expect(Object.values(WebSocketAction)).toContain(testMessage.action);

            // Validate data based on action
            if (testMessage.action === WebSocketAction.READY) {
                expect(testMessage.data).toHaveProperty('handle');
                expect(typeof testMessage.data.handle).toBe('string');
            }
        });

        it('should handle invalid actions gracefully', () => {
            const invalidMessage = {
                action: 'INVALID_ACTION' as any,
                data: {}
            };

            expect(Object.values(WebSocketAction)).not.toContain(invalidMessage.action);
        });
    });
});
