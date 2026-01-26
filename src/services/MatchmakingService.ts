import { IDatabase } from "../db/database.interface";
import {
    getOpponentInTree,
    createResultInTree,
    makeMatches,
    MatchmakingTreeNode,
    shuffle_array,
} from "../utils/matchmaking-tree";
import {
    getTreeByContestId,
    deleteTreeById,
    updateTreeByContestId,
} from "../utils/contest-tree-manager";
import { Student } from "../utils/schemas/student";
import { StudentService } from "./StudentService";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";
import { Result } from "../utils/schemas/result";
import { CONTEST_RUNNING, ParticipationService } from "./ParticipationService";

const COLLECTION: string = "matchmaking";
const PARTICIPATION_COLLECTION: string = "participation";
const RESULT_COLLECTION: string = "results";

const student_service = new StudentService(new SupabaseAdapter());
const participation_service = new ParticipationService(new SupabaseAdapter());

export class MatchmakingService {
    constructor(
        private mongoDb: IDatabase,
        private supabaseDb: IDatabase,
    ) { }

    async create(
        contestId: number,
    ): Promise<{ error: string | null; data: any }> {
        const exist = await this.mongoDb.getBy(COLLECTION, {
            contest_id: contestId,
        });
        if (exist.data) {
            return {
                error: "A matchmaking for this contest already exist",
                data: null,
            };
        }

        const participation_result = await this.supabaseDb.getBy(
            PARTICIPATION_COLLECTION,
            {
                contest_id: contestId,
            },
        );

        if (participation_result.error) {
            return { error: participation_result.error, data: null };
        }

        const participants: number[] = participation_result.data
            .filter((p: any) => p.checkin)
            .map((p: any) => p.student_id);

        if (participants.length == 0) {
            return {
                error: "There isn't any participants for this contest",
                data: null,
            };
        }

        shuffle_array(participants);

        const tree: MatchmakingTreeNode | null = makeMatches(
            participants,
            0,
            participants.length,
        );

        if (!tree) {
            return {
                error: "Something happen creating matchmaking tree",
                data: null,
            };
        }

        const matchmaking_record = { tree, contest_id: contestId };
        const result = await this.mongoDb.insert(COLLECTION, matchmaking_record);

        return result;
    }

    async getTreeByContestId(
        contestId: number,
    ): Promise<{ error: string | null; data: any }> {
        const tree = await getTreeByContestId(contestId);
        if (!tree) {
            return { error: "Empty tree for contest", data: null };
        }
        return { error: null, data: tree };
    }

    async getOpponent(
        contest_id: number,
        student_id: number,
    ): Promise<{ error: string | null; data: Student | null }> {
        const tree = await getTreeByContestId(contest_id);
        if (!tree) {
            return { error: "There is no tree for this contest.", data: null };
        }
        const opponent_id = getOpponentInTree(tree, student_id);
        if (!opponent_id) {
            return { error: "There is no opponent.", data: null };
        }

        return await student_service.getOne(opponent_id);
    }

    async deleteTreeByContestId(
        contestId: number,
    ): Promise<{ error: string | null; data: any }> {
        const result = await deleteTreeById(contestId);
        return result;
    }

    /**
     * Transacción con compensación (rollback):
     * - Mutar árbol en memoria con createResultInTree
     * - Insertar result en Supabase
     * - Persistir árbol en Mongo
     *
     * Rollbacks:
     * - Si falla insert en Supabase: restaurar árbol/caché a estado previo.
     * - Si falla update en Mongo: borrar result insertado en Supabase y restaurar árbol/caché.
     */
    async setResult(resultData: {
        contest_id: number;
        local_id: number;
        visitant_id: number;
        winner_id: number;
    }): Promise<{ error: string | null; data: any }> {
        const { contest_id, local_id, visitant_id, winner_id } = resultData;

        if (local_id === visitant_id) {
            return { error: "Visitant and Local are the same.", data: null };
        }

        if (winner_id !== local_id && winner_id !== visitant_id) {
            return { error: "Neither visitant or local is the winner", data: null };
        }

        const tree = await getTreeByContestId(contest_id);
        if (!tree) {
            return { error: "Empty tree for contest", data: null };
        }

        // snapshot para rollback (estructura simple => JSON ok)
        const prevTree: MatchmakingTreeNode = Object.create(tree);

        const ok = createResultInTree(tree, local_id, visitant_id, winner_id);
        if (!ok) {
            return { error: "Invalid match or node already resolved", data: null };
        }

        // 1) crear result en supabase
        const created = await this.supabaseDb.insert(RESULT_COLLECTION, resultData);
        if (created.error) {
            // rollback árbol en cache a estado previo
            await updateTreeByContestId(contest_id, prevTree);
            return { error: created.error, data: null };
        }

        const insertedRow = created.data[0] as Result;
        const insertedId = insertedRow.id;

        // 2) persistir árbol en mongo (y cache)
        const updatedTree = await updateTreeByContestId(contest_id, tree);
        if (updatedTree.error) {
            // rollback supabase result
            if (insertedId !== null && insertedId !== undefined) {
                await this.supabaseDb.delete(RESULT_COLLECTION, { id: insertedId });
            }
            // rollback árbol/caché
            await updateTreeByContestId(contest_id, prevTree);

            return { error: updatedTree.error, data: null };
        }

        const { error: err } = await participation_service.assignPositions(
            contest_id,
            tree,
        );
        if (err && err !== CONTEST_RUNNING) return { error: err, data: null };

        return { error: null, data: insertedRow ?? created.data };
    }
}
