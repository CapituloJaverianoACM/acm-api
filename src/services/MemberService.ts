import { IDatabase } from "../db/database.interface";

const COLLECTION: string = "members";

export class MemberService {
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
      _id: id,
    });

    if (result.error) {
      return { error: "This member do not exist.", data: null };
    }

    return result;
  }

  async create(memberData: any): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      _id: memberData._id,
    });

    if (member.data) {
      return { error: "Member already exist.", data: null };
    }

    const resultInsert = await this.db.insert(COLLECTION, memberData);
    return resultInsert;
  }

  async createMany(
    membersData: any[],
  ): Promise<{ error: string | null; data: any }> {
    const members = await this.db.getAll(COLLECTION);

    if (members.error) {
      return { error: "No members found.", data: null };
    }

    const newMembers = membersData.filter(
      (member: any) => !members.data.some((m: any) => m._id === member._id),
    );

    if (newMembers.length === 0) {
      return { error: "All members already exist.", data: null };
    }

    const resultInsertMany = await this.db.insertMany(COLLECTION, newMembers);
    return resultInsertMany;
  }

  async update(
    id: number,
    memberData: any,
  ): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (member.error) {
      return { error: "This member do not exist.", data: null };
    }

    const result = await this.db.update(COLLECTION, { _id: id }, memberData);
    return result;
  }

  async deactivate(id: number): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (member.error) {
      return { error: "This member do not exist.", data: null };
    }

    if (!member.data.active) {
      return { error: "This member is already deactivated.", data: null };
    }

    member.data.active = false;
    const result = await this.db.update(
      COLLECTION,
      { _id: member.data._id },
      member.data,
    );
    return result;
  }

  async delete(id: number): Promise<{ error: string | null; data: any }> {
    const member = await this.db.getBy(COLLECTION, {
      _id: id,
    });

    if (member.error) {
      return { error: "This member do not exist", data: null };
    }

    const result = await this.db.delete(COLLECTION, {
      _id: id,
    });
    return result;
  }
}
