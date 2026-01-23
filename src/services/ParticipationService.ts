import { IDatabase } from "../db/database.interface";
import { MatchmakingTreeNode } from "../utils/matchmaking-tree";
import { StandardResponse } from "../utils/responses";
import { Participation } from "../utils/schemas/participation";
const COLLECTION: string = "participation";
export const CONTEST_RUNNING: string = "Contest continues running.";

export class ParticipationService {
    constructor(private db: IDatabase) { }

    async getAll(
        filters: any,
        order?: { column: string; asc?: boolean },
        suborder?: { column: string; asc?: boolean },
        limit?: number,
        offset?: number,
    ): Promise<{ error: string | null; data: any }> {
        const result =
            Object.keys(filters).length > 0
                ? await this.db.getBy(
                    COLLECTION,
                    filters,
                    order,
                    suborder,
                    limit,
                    offset,
                )
                : await this.db.getAll(COLLECTION, order, suborder, limit, offset);

        return result;
    }

    async getOne(
        contestId: number,
        studentId: number,
    ): Promise<{ error: string | null; data: any }> {
        const result = await this.db.getBy(COLLECTION, {
            contest_id: contestId,
            student_id: studentId,
        });

        if (result.error) {
            return { error: "Participation does not exist.", data: null };
        }

        return result;
    }

    async getByContestId(
        contestId: number,
    ): Promise<{ error: string | null; data: any }> {
        const resultsQuery = { contest_id: contestId };
        const result = await this.db.getBy(COLLECTION, resultsQuery);
        return result;
    }

    async getByStudentId(
        studentId: number,
    ): Promise<{ error: string | null; data: any }> {
        const resultsQuery = { student_id: studentId };
        const result = await this.db.getBy(COLLECTION, resultsQuery);
        return result;
    }

    async create(
        participationData: any,
    ): Promise<{ error: string | null; data: any }> {
        const participation = await this.db.getBy(COLLECTION, {
            contest_id: participationData.contest_id,
            student_id: participationData.student_id,
        });

        if (participation.data && participation.data.length > 0) {
            return {
                error: "Participation already exists for this student and contest.",
                data: null,
            };
        }

        const resultInsert = await this.db.insert(COLLECTION, participationData);
        return resultInsert;
    }

    async update(
        contestId: number,
        studentId: number,
        participationData: any,
    ): Promise<{ error: string | null; data: any }> {
        const toUpdt = await this.db.getBy(COLLECTION, {
            contest_id: contestId,
            student_id: studentId,
        });

        if (toUpdt.error) {
            return { error: "This participation does not exist.", data: null };
        }

        const resultUpdate = await this.db.update(
            COLLECTION,
            { contest_id: contestId, student_id: studentId },
            participationData,
        );

        return resultUpdate;
    }

    async delete(
        contestId: number,
        studentId: number,
    ): Promise<{ error: string | null; data: any }> {
        const toDel = await this.db.getBy(COLLECTION, {
            contest_id: contestId,
            student_id: studentId,
        });

        if (toDel.error) {
            return { error: "This participation does not exist.", data: null };
        }

        const resultDelete = await this.db.delete(COLLECTION, {
            contest_id: contestId,
            student_id: studentId,
        });

        return resultDelete;
    }

    private computeFrequencies(
        root: MatchmakingTreeNode | null,
        frequencies: Record<number, number>,
    ) {
        if (!root) return;
        if (root.student_id != null) {
            if (!(root.student_id in frequencies)) frequencies[root.student_id] = 0;
            frequencies[root.student_id]++;
        }

        this.computeFrequencies(root.left, frequencies);
        this.computeFrequencies(root.right, frequencies);
    }

    async assignPositions(
        contest_id: number,
        tree: MatchmakingTreeNode,
    ): Promise<StandardResponse> {
        const frequencies: Record<number, number> = {};
        if (!tree.student_id)
            return { error: CONTEST_RUNNING, data: null };

        this.computeFrequencies(tree, frequencies);

        const contest_participations = await this.getByContestId(contest_id);

        if (contest_participations.error) return contest_participations;

        const student_frequencies: Participation[] = (
            contest_participations.data as Participation[]
        )
            .filter((p) => p.student_id in frequencies)
            .map((p) => {
                p.position = frequencies[p.student_id] - 1;
                return p;
            });

        const bulk_data = student_frequencies.sort(
            (a, b) => b.position! - a.position!,
        );

        let curr_wins = -1,
            final_position = 1;

        // Solo puede existir un puesto 1
        for (let i = 0; i < bulk_data.length; i++) {
            if (bulk_data[i].student_id == tree.student_id) {
                bulk_data[i].position = final_position;
                final_position++;
                break;
            }
        }

        for (let i = 0; i < bulk_data.length; i++) {
            if (bulk_data[i].student_id == tree.student_id) continue;
            if (bulk_data[i].position != curr_wins) {
                curr_wins = bulk_data[i].position!;
                bulk_data[i].position = final_position;
                final_position++;
            } else {
                bulk_data[i].position = final_position;
            }
        }

        return await this.db.upsert(COLLECTION, bulk_data);
    }
}
