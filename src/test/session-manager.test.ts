import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createSession, getSessionByPairKey, addUserToSession, updateUserReadyStatus, updateSession, deleteSession } from '../utils/session-manager';

describe('Session Manager', () => {
    const testPairKey = 'test-session-key';
    const testContestId = 123;
    const testUserId = 456;
    const testHandle = 'testuser';

    // Clean up before and after tests
    beforeAll(async () => {
        await deleteSession(testPairKey);
    });

    afterAll(async () => {
        await deleteSession(testPairKey);
    });

    describe('Session Creation', () => {
        it('should create a new session', async () => {
            const result = await createSession(testPairKey, testContestId);
            
            expect(result.error).toBeNull();
            expect(result.data).not.toBeNull();
            expect(result.data!.pairKey).toBe(testPairKey);
            expect(result.data!.contestID).toBe(testContestId);
            expect(result.data!.isActive).toBe(false);
            expect(result.data!.isFinished).toBe(false);
            expect(result.data!.users).toHaveLength(0);
        });

        it('should retrieve a created session', async () => {
            const session = await getSessionByPairKey(testPairKey);
            
            expect(session).not.toBeNull();
            expect(session!.pairKey).toBe(testPairKey);
            expect(session!.contestID).toBe(testContestId);
        });

        it('should return null for non-existent session', async () => {
            const session = await getSessionByPairKey('non-existent-key');
            expect(session).toBeNull();
        });
    });

    describe('User Management', () => {
        it('should add a user to session', async () => {
            const result = await addUserToSession(testPairKey, testUserId, testHandle);
            
            expect(result.error).toBeNull();
            
            const session = await getSessionByPairKey(testPairKey);
            expect(session!.users).toHaveLength(1);
            expect(session!.users[0].userId).toBe(testUserId);
            expect(session!.users[0].handle).toBe(testHandle);
            expect(session!.users[0].isReady).toBe(false);
        });

        it('should update user ready status', async () => {
            const result = await updateUserReadyStatus(testPairKey, testUserId, true);
            
            expect(result.error).toBeNull();
            
            const session = await getSessionByPairKey(testPairKey);
            expect(session!.users[0].isReady).toBe(true);
        });

        it('should handle adding the same user twice', async () => {
            const result = await addUserToSession(testPairKey, testUserId, testHandle);
            
            expect(result.error).toBeNull();
            
            const session = await getSessionByPairKey(testPairKey);
            expect(session!.users).toHaveLength(1); // Should still be 1, not 2
        });
    });

    describe('Session Updates', () => {
        it('should update session properties', async () => {
            const testProblem = {
                contestId: 1001,
                index: 'A',
                name: 'Test Problem',
                rating: 800
            };

            const result = await updateSession(testPairKey, {
                currentProblem: testProblem,
                isActive: true
            });

            expect(result.error).toBeNull();

            const session = await getSessionByPairKey(testPairKey);
            expect(session!.currentProblem).toEqual(testProblem);
            expect(session!.isActive).toBe(true);
        });
    });

    describe('Session Deletion', () => {
        it('should delete a session', async () => {
            const result = await deleteSession(testPairKey);
            
            expect(result.error).toBeNull();
            
            const session = await getSessionByPairKey(testPairKey);
            expect(session).toBeNull();
        });
    });

    describe('Cache Behavior', () => {
        it('should use cache for repeated access', async () => {
            // Create session
            await createSession('cache-test', 999);
            
            // First access (from DB)
            const session1 = await getSessionByPairKey('cache-test');
            expect(session1).not.toBeNull();
            
            // Second access (should be from cache)
            const session2 = await getSessionByPairKey('cache-test');
            expect(session2).not.toBeNull();
            expect(session2!.pairKey).toBe(session1!.pairKey);
            
            // Clean up
            await deleteSession('cache-test');
        });
    });
});
