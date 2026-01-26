export enum WebSocketError {
    // Session errors
    SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
    SESSION_CREATION_FAILED = 'SESSION_CREATION_FAILED',
    USER_ADD_FAILED = 'USER_ADD_FAILED',
    USER_REMOVE_FAILED = 'USER_REMOVE_FAILED',
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    
    // Match state errors
    MATCH_ALREADY_ACTIVE = 'MATCH_ALREADY_ACTIVE',
    MATCH_ALREADY_FINISHED = 'MATCH_ALREADY_FINISHED',
    MATCH_NOT_ACTIVE = 'MATCH_NOT_ACTIVE',
    MATCH_START_FAILED = 'MATCH_START_FAILED',
    MATCH_FINISH_FAILED = 'MATCH_FINISH_FAILED',
    
    // User state errors
    USER_NOT_READY = 'USER_NOT_READY',
    READY_STATUS_UPDATE_FAILED = 'READY_STATUS_UPDATE_FAILED',
    SOLVED_PROBLEMS_UPDATE_FAILED = 'SOLVED_PROBLEMS_UPDATE_FAILED',
    
    // Problem errors
    PROBLEMS_NOT_LOADED = 'PROBLEMS_NOT_LOADED',
    NO_FAIR_PROBLEM_FOUND = 'NO_FAIR_PROBLEM_FOUND',
    PROBLEM_VERIFICATION_FAILED = 'PROBLEM_VERIFICATION_FAILED',
    
    // General errors
    INVALID_REQUEST = 'INVALID_REQUEST',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export const getErrorMessage = (error: WebSocketError): string => {
    switch (error) {
        // Session errors
        case WebSocketError.SESSION_NOT_FOUND:
            return 'Session not found. Please reconnect.';
        case WebSocketError.SESSION_CREATION_FAILED:
            return 'Failed to create session. Please try again.';
        case WebSocketError.USER_ADD_FAILED:
            return 'Failed to join session. Please try again.';
        case WebSocketError.USER_REMOVE_FAILED:
            return 'Failed to leave session. Please try again.';
        case WebSocketError.USER_NOT_FOUND:
            return 'User not found in session.';
            
        // Match state errors
        case WebSocketError.MATCH_ALREADY_ACTIVE:
            return 'Match is already in progress.';
        case WebSocketError.MATCH_ALREADY_FINISHED:
            return 'Match has already finished.';
        case WebSocketError.MATCH_NOT_ACTIVE:
            return 'No active match in progress.';
        case WebSocketError.MATCH_START_FAILED:
            return 'Failed to start match. Please try again.';
        case WebSocketError.MATCH_FINISH_FAILED:
            return 'Failed to finish match. Please try again.';
            
        // User state errors
        case WebSocketError.USER_NOT_READY:
            return 'User is not ready.';
        case WebSocketError.READY_STATUS_UPDATE_FAILED:
            return 'Failed to update ready status.';
        case WebSocketError.SOLVED_PROBLEMS_UPDATE_FAILED:
            return 'Failed to update solved problems.';
            
        // Problem errors
        case WebSocketError.PROBLEMS_NOT_LOADED:
            return 'Problems are still loading. Please wait.';
        case WebSocketError.NO_FAIR_PROBLEM_FOUND:
            return 'No suitable problem found for both users.';
        case WebSocketError.PROBLEM_VERIFICATION_FAILED:
            return 'Failed to verify problem solution.';
            
        // General errors
        case WebSocketError.INVALID_REQUEST:
            return 'Invalid request format.';
        case WebSocketError.INTERNAL_ERROR:
            return 'An internal error occurred. Please try again.';
        case WebSocketError.RATE_LIMIT_EXCEEDED:
            return 'Too many requests. Please wait before trying again.';
            
        default:
            return 'Unknown error occurred.';
    }
};
