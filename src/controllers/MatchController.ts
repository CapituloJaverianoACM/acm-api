import { Elysia } from 'elysia';
import { SocketParams } from '../utils/schemas/websocket';
import { MatchService } from '../services/MatchService';
import { jwtPlugin } from '../utils/macros/auth';

// Instancia única (Singleton)
const matchService = new MatchService();

export const match = new Elysia()
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

        async message(ws, message: any) {
            const { pairKey, userId } = ws.data;

            if (message.action === 'READY') {
                const handle = message.data?.handle;
                if (handle) {
                    await matchService.setReady(pairKey, userId, handle);
                }
            }

            if (message.action === 'NOT_READY') {
                matchService.setNotReady(pairKey, userId);
            }

            if (message.action === 'CHECK') {
                // El usuario pide verificar si ganó
                await matchService.checkWinCondition(pairKey, userId);
            }
        },

        close(ws) {
            const { pairKey, userId } = ws.data;
            matchService.disconnect(pairKey, userId);
        }
    });