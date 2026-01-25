import { describe, it, expect } from 'bun:test';
import { WebSocketError, getErrorMessage } from '../utils/websocket-errors';

describe('WebSocket Errors', () => {
    describe('Error Messages', () => {
        it('should return correct message for SESSION_NOT_FOUND', () => {
            const message = getErrorMessage(WebSocketError.SESSION_NOT_FOUND);
            expect(message).toBe('Session not found. Please reconnect.');
        });

        it('should return correct message for MATCH_ALREADY_ACTIVE', () => {
            const message = getErrorMessage(WebSocketError.MATCH_ALREADY_ACTIVE);
            expect(message).toBe('Match is already in progress.');
        });

        it('should return correct message for PROBLEMS_NOT_LOADED', () => {
            const message = getErrorMessage(WebSocketError.PROBLEMS_NOT_LOADED);
            expect(message).toBe('Problems are still loading. Please wait.');
        });

        it('should return correct message for INTERNAL_ERROR', () => {
            const message = getErrorMessage(WebSocketError.INTERNAL_ERROR);
            expect(message).toBe('An internal error occurred. Please try again.');
        });

        it('should handle unknown error codes', () => {
            const message = getErrorMessage('UNKNOWN_ERROR' as WebSocketError);
            expect(message).toBe('Unknown error occurred.');
        });
    });

    describe('Error Code Coverage', () => {
        it('should have messages for all error codes', () => {
            const errorCodes = Object.values(WebSocketError);
            
            errorCodes.forEach(errorCode => {
                const message = getErrorMessage(errorCode);
                expect(message).toBeDefined();
                expect(typeof message).toBe('string');
                expect(message.length).toBeGreaterThan(0);
            });
        });
    });
});
