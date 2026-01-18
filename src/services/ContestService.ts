import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "contest";
const PICTURES_COLLECTION: string = "picture";

export class ContestService {
  constructor(private db: IDatabase) {}

  private async addPictures(result: {
    error: string | null;
    data: any;
  }): Promise<{
    error: string | null;
    data: any;
  }> {
    result.data = await Promise.all(
      result.data.map(async (x: any) => {
        const pictureResult = await this.db.getBy(PICTURES_COLLECTION, {
          contest_id: x.id,
        });

        if (pictureResult.error || pictureResult.data.length == 0) return x;

        return {
          ...x,
          picture: pictureResult.data?.at(0), // Solo debería haber una
        };
      }),
    );

    return result;
  }

  async getAll(
    filters: any,
    order?: { column: string; asc?: boolean },
    suborder?: { column: string; asc?: boolean },
    limit?: number,
    offset?: number,
    withPicture?: boolean,
  ): Promise<{ error: string | null; data: any }> {
    let result =
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

    if (result.error) return result;

    if (withPicture) {
      result = await this.addPictures(result);
    }

    return result;
  }

  async getOne(
    id: number,
    withPicture?: boolean,
  ): Promise<{ error: string | null; data: any }> {
    let result = await this.db.getBy(COLLECTION, {
      id: id,
    });

    if (result.error) return result;

    if (withPicture) {
      result = await this.addPictures(result);
    }

    return result;
  }

  async create(contestData: any): Promise<{ error: string | null; data: any }> {
    const contestQuery = {
      name: contestData.name,
    };

    const result = await this.db.getBy(COLLECTION, contestQuery);
    if (result.data && result.data.length > 0) {
      return { error: "Contest name already exists.", data: null };
    }

    const insertResult = await this.db.insert(COLLECTION, contestData);
    return insertResult;
  }

  async update(
    id: number,
    contestData: any,
  ): Promise<{ error: string | null; data: any }> {
    const contestQuery = { id: id };

    const toUpdt = await this.db.getBy(COLLECTION, contestQuery);
    if (toUpdt.error) {
      return toUpdt;
    }

    const updateResult = await this.db.update(
      COLLECTION,
      contestQuery,
      contestData,
    );
    return updateResult;
  }

  async delete(id: number): Promise<{ error: string | null; data: any }> {
    const contestQuery = { id: id };

    const toDelete = await this.db.getBy(COLLECTION, contestQuery);
    if (toDelete.error) {
      return toDelete;
    }

    const deleteResult = await this.db.delete(COLLECTION, contestQuery);
    return deleteResult;
  }

  async getBulkById(ids: any[]): Promise<{ error: string | null; data: any }> {
    const result = await this.db.getMultiple(COLLECTION, "id", ids);
    return result;
  }
}
