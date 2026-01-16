import { Context } from "elysia";
import { IDatabase } from "../../db/database.interface";
import { MongoAdapter } from "../../db/mongo/mongo.adapter";
import { SupabaseAdapter } from "../../db/supabase/supabase.adapter";
import { BadRequest, Ok, ServerError } from "../../utils/responses";
import { makeMatches, MatchmakingTreeNode } from "../../utils/matchmaking-tree";
import { getTreeByContestId } from "../../utils/contest-tree-manager";

const COLLECTION: string = "matchmaking";
const PARTICIPATION_COLLECTION: string = "participation";
const mongo: IDatabase = new MongoAdapter();
const supabase: IDatabase = new SupabaseAdapter();

export const createMatchmaking = async (context: Context) => {
    const { contest_id } = context.body as any;

    const exist = await mongo.getBy(COLLECTION, { contest_id });
    if (exist.data)
        return BadRequest(context, "A matchmaking for this contest already exist");

    const participation_result = await supabase.getBy(PARTICIPATION_COLLECTION, {
        contest_id,
    });

    if (participation_result.error)
        return BadRequest(context, participation_result.error);

    const participants: number[] = participation_result.data
        .filter((p: any) => p.checkin)
        .map((p: any) => p.student_id);

    if (participants.length == 0)
        return BadRequest(context, "There isn't any participants for this contest");

    const tree: MatchmakingTreeNode | null = makeMatches(
        participants,
        0,
        participants.length,
    );

    if (!tree)
        return ServerError(context, "Something happen creating matchmaking tree");

    const matchmaking_record = { tree, contest_id };
    const result = await mongo.insert(COLLECTION, matchmaking_record);

    if (result.error) return BadRequest(context, result.error);
    return Ok(context, result.data);
};

export const getMatchmakingTree = async (context: Context) => {
    const {contest_id} = context.params;
    const tree = await getTreeByContestId(parseInt(contest_id));
    if(!tree) return BadRequest(context, "Empty tree for contest");
    return Ok(context,tree);
};