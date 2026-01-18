import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "activities";

export class ActivityService {
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

  async getOne(id: string): Promise<{ error: string | null; data: any }> {
    const result = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (result.error) {
      return { error: "Do not exist.", data: null };
    }

    return result;
  }

  async create(
    activityData: any,
  ): Promise<{ error: string | null; data: any }> {
    const act = await this.db.getBy(COLLECTION, {
      title: activityData.title,
    });

    if (act.data) {
      return { error: "Activity already exist", data: null };
    }

    const resultInsert = await this.db.insert(COLLECTION, activityData);
    return resultInsert;
  }

  async createMany(
    activitiesData: any[],
  ): Promise<{ error: string | null; data: any }> {
    const resultInsertMany = await this.db.insertMany(
      COLLECTION,
      activitiesData,
    );
    return resultInsertMany;
  }

  async update(
    id: string,
    activityData: any,
  ): Promise<{ error: string | null; data: any }> {
    const toUpdt = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (toUpdt.error) {
      return { error: "This activity do not exist.", data: null };
    }

    const resultUpdate = await this.db.update(
      COLLECTION,
      { _id: id },
      activityData,
    );
    return resultUpdate;
  }

  async delete(id: string): Promise<{ error: string | null; data: any }> {
    const toDel = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (toDel.error) {
      return { error: "This activity do not exist.", data: null };
    }

    const resultDelete = await this.db.delete(COLLECTION, {
      _id: id,
    });
    return resultDelete;
  }
}
