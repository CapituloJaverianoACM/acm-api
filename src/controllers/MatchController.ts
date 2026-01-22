import { Elysia } from 'elysia'
import { SocketParams } from '../utils/schemas/websocket';
import { StudentService } from '../services/StudentService';
import { SupabaseAdapter } from '../db/supabase/supabase.adapter';
import { MatchService } from '../services/MatchService';

const studentService = new StudentService(new SupabaseAdapter());
const matchService = new MatchService(studentService);
export const match = new Elysia()
    .derive(async ({ params }) => {
        const { ownID, opponentID } = params;
        const connectionData = await matchService.prepareConnectionData(
            Number(ownID),
            Number(opponentID),
        );
        return connectionData;
    })
    .ws('/ws/contest/:ownID/:opponentID', {
        params: SocketParams,

        async open(ws) {
            const { pairKey, connId } = ws.data;
            await matchService.handleConnectionOpen(pairKey, connId);

            console.log('open handles', (ws.data as any).handles);
            console.log('open problems counts', {
                own: (ws.data as any).problems?.own?.length ?? 0,
                opponent: (ws.data as any).problems?.opponent?.length ?? 0,
            });

            ws.subscribe(pairKey);
        },

        async message(ws, message: any) {
            const { pairKey, connId } = ws.data;
            const { ownID, opponentID } = ws.data.params;

            if (message.action === 'PING') {
                ws.send({
                    action: 'PONG',
                    data: { pairKey, from: 'server' }
                });
                return;
            }

            if (message.action === 'READY') {
                const problems = (ws.data as any).problems;
                const startMsg = await matchService.handleReadyAction(
                    pairKey,
                    Number(ownID),
                    Number(opponentID),
                    problems,
                );
                if (startMsg) {
                    ws.publish(pairKey, startMsg);
                    ws.send(startMsg);
                }
            }

            if (message.action === 'NOT_READY') {
                matchService.handleNotReadyAction(
                    pairKey,
                    Number(ownID),
                    Number(opponentID),
                );
            }

            if (message.action === 'CHECK') {
                const handles = (ws.data as any).handles;
                const checkResults = await matchService.handleCheckAction(
                    pairKey,
                    Number(ownID),
                    Number(opponentID),
                    handles,
                );
                // Send messages: one directly to sender, one published to opponent
                for (const result of checkResults) {
                    if (result.targetID === Number(ownID)) {
                        // Send directly to the sender
                        ws.send(result);
                    } else if (result.targetID === Number(opponentID)) {
                        // Publish to opponent (and other subscribers)
                        ws.publish(pairKey, result);
                    } else {
                        // No targetID (like CONTINUE without specific target) - publish to all
                        ws.publish(pairKey, result);
                    }
                }
            }
        },

        close(ws) {
            const { pairKey, connId } = ws.data;
            matchService.handleConnectionClose(pairKey, connId);
            ws.unsubscribe(pairKey);
        }
    });