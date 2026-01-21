import { IDatabase } from "../db/database.interface";
import { MatchmakingService } from "./MatchmakingService";

const COLLECTION: string = "results";

export class ResultService {
  constructor(
    private db: IDatabase,
    private matchmakingService?: MatchmakingService,
  ) { }

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

  async getOne(id: any): Promise<{ error: string | null; data: any }> {
    const resultQuery = { id: id };
    const result = await this.db.getBy(COLLECTION, resultQuery);
    return result;
  }

  async getByContestId(id: any): Promise<{ error: string | null; data: any }> {
    const resultsQuery = { contest_id: id };
    const result = await this.db.getBy(COLLECTION, resultsQuery);
    return result;
  }

  async create(resultData: any): Promise<{ error: string | null; data: any }> {
    if (this.matchmakingService) {
      // Delegar al flujo transaccional (supabase + mongo)
      return this.matchmakingService.setResult(resultData);
    }

    return { error: "Matchmaking service not available", data: null };
  }

  async update(
    id: any,
    resultData: any,
  ): Promise<{ error: string | null; data: any }> {
    const { winner_id, local_id, visitant_id } = resultData;
    const resultQuery = {
      id: id,
    };

    const toUpdt = await this.db.getBy(COLLECTION, resultQuery);

    if (!toUpdt.data) {
      return { error: "Result do not exist", data: null };
    }

    if (winner_id != local_id && winner_id != visitant_id) {
      return { error: "Neither visitant or local is the winner", data: null };
    }

    const result = await this.db.update(COLLECTION, resultQuery, resultData);
    return result;
  }

  async delete(id: any): Promise<{ error: string | null; data: any }> {
    const resultQuery = {
      id: id,
    };

    const toDelete = await this.db.getBy(COLLECTION, resultQuery);

    if (toDelete.error) {
      return toDelete;
    }

    const result = await this.db.delete(COLLECTION, resultQuery);
    return result;
  }
}
