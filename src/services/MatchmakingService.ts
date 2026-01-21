import { IDatabase } from "../db/database.interface";
import {
    getOpponentInTree,
    makeMatches,
    MatchmakingTreeNode,
    shuffle_array,
} from "../utils/matchmaking-tree";
import {
    getTreeByContestId,
    deleteTreeById,
} from "../utils/contest-tree-manager";
import { Student } from "../utils/schemas/student";
import { StudentService } from "./StudentService";
import { SupabaseAdapter } from "../db/supabase/supabase.adapter";

const COLLECTION: string = "matchmaking";
const PARTICIPATION_COLLECTION: string = "participation";

const student_service = new StudentService(new SupabaseAdapter());

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
}
