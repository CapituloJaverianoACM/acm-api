import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "picture";

export class PictureService {
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

  async getOne(id: number): Promise<{ error: string | null; data: any }> {
    const result = await this.db.getBy(COLLECTION, {
      id: id,
    });

    return result;
  }

  async create(pictureData: any): Promise<{ error: string | null; data: any }> {
    const insertResult = await this.db.insert(COLLECTION, pictureData);
    return insertResult;
  }

  async update(
    id: number,
    pictureData: any,
  ): Promise<{ error: string | null; data: any }> {
    const pictureQuery = { id: id };

    const toUpdt = await this.db.getBy(COLLECTION, pictureQuery);
    if (toUpdt.error) {
      return { error: toUpdt.error, data: null };
    }

    const updateResult = await this.db.update(
      COLLECTION,
      pictureQuery,
      pictureData,
    );
    return updateResult;
  }

  async delete(id: number): Promise<{ error: string | null; data: any }> {
    const pictureQuery = { id: id };

    const toDelete = await this.db.getBy(COLLECTION, pictureQuery);
    if (toDelete.error) {
      return { error: toDelete.error, data: null };
    }

    const deleteResult = await this.db.delete(COLLECTION, pictureQuery);
    return deleteResult;
  }
}
