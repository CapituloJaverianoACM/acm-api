import { Elysia } from 'elysia';
import { SocketParams } from '../utils/schemas/websocket';
import { MatchService } from '../services/MatchService';
import { jwtPlugin } from '../utils/macros/auth';
import { BadRequest } from '../utils/responses';
import { IncomingWebSocketMessage, WebSocketAction } from '../utils/websocket-types';

// Instancia única (Singleton)
const matchService = new MatchService();

export const match = new Elysia()
    .onBeforeHandle(c => {
        if (!c.query.token) return BadRequest(c, "token query needed.");
        c.request.headers.set('authorization', `Bearer ${c.query.token}`);
    })
    .use(jwtPlugin)
    .guard({ params: SocketParams, isSelf: ["params.ownID"] })
    .derive(({ params }) => {
        const { contestID, ownID, opponentID } = params;
        // Normalizamos la key: siempre "menor-mayor" para que ambos usuarios caigan en la misma sala
        const idFromContest = Number(contestID);
        const ids = [Number(ownID), Number(opponentID)].sort((a, b) => a - b);
        const pairKey = `${ids[0]}-${ids[1]}-${idFromContest}`;
        
        return { 
            idFromContest,
            pairKey, 
            userId: Number(ownID),
            opponentId: Number(opponentID)
        };
    })
    .ws('/ws/contest/:contestID/:ownID/:opponentID', {
        params: SocketParams,

        open(ws) {
            const {idFromContest, pairKey, userId } = ws.data;
            // Registramos la conexión. Pasamos el objeto 'ws' para poder enviarle mensajes luego.
            matchService.connect(pairKey, idFromContest, userId, ws);
        },

        async message(ws, message: IncomingWebSocketMessage) {
            const { pairKey, userId } = ws.data;

            // Type guard to ensure message has valid action
            if (!message.action || !Object.values(WebSocketAction).includes(message.action)) {
                console.error(`[WebSocket] Invalid message action: ${message.action}`);
                return;
            }

            switch (message.action) {
                case WebSocketAction.READY:
                    if ('handle' in message.data && message.data.handle) {
                        await matchService.setReady(pairKey, userId, message.data.handle);
                    } else {
                        console.error(`[WebSocket] READY message missing handle`);
                    }
                    break;

                case WebSocketAction.NOT_READY:
                    await matchService.setNotReady(pairKey, userId);
                    break;

                case WebSocketAction.CHECK:
                    await matchService.checkWinCondition(pairKey, userId);
                    break;

                default:
                    console.warn(`[WebSocket] Unhandled action: ${message.action}`);
            }
        },

        close(ws) {
            const { pairKey, userId } = ws.data;
            matchService.disconnect(pairKey, userId);
        }
    });
