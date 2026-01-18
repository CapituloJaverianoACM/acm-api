import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "participation";

export class ParticipationService {
  constructor(private db: IDatabase) {}

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
}
