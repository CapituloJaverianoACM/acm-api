import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "student";

export class StudentService {
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

  async getBySupabaseId(
    supabaseUserId: string,
  ): Promise<{ error: string | null; data: any }> {
    const result = await this.db.getBy(COLLECTION, {
      supabase_user_id: supabaseUserId,
    });

    return result;
  }

  async create(studentData: any): Promise<{ error: string | null; data: any }> {
    const insertMember = await this.db.insert(COLLECTION, studentData);
    return insertMember;
  }

  async update(
    id: number,
    studentData: any,
  ): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      id: id,
    });

    if (member.error) {
      return member;
    }

    const result = await this.db.update(COLLECTION, { id: id }, studentData);

    return result;
  }

  async delete(id: number): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      id: id,
    });

    if (member.error) {
      return member;
    }

    const result = await this.db.delete(COLLECTION, {
      id: id,
    });

    return result;
  }

  async getBulkById(ids: any[]): Promise<{ error: string | null; data: any }> {
    const result = await this.db.getMultiple(COLLECTION, "id", ids);
    return result;
  }
}
