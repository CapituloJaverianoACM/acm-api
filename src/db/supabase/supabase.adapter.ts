import { IDatabase } from "./database.interface";
import SupabaseDB from "./supabase";

export class SupabaseAdapter implements IDatabase {
  private db = SupabaseDB.getInstance();

  async insert<T>(table: string, data: T) {
    return this.db.insert(table, data);
  }

  async insertMany<T>(table: string, data: T[]) {
    return this.db.insertMany(table, data);
  }

  async getAll(
    table: string,
    order?: {
      column: string;
      asc?: boolean;
    },
    suborder?: {
      column: string;
      asc?: boolean;
    },
    limit?: number,
    offset?: number,
  ) {
    return this.db.getAll(table, order, suborder, limit, offset);
  }

  async getBy<T>(
    table: string,
    query: Partial<T>,
    order?: {
      column: string;
      asc?: boolean;
    },
    suborder?: {
      column: string;
      asc?: boolean;
    },
    limit?: number,
    offset?: number,
  ) {
    return this.db.getBy<T>(table, query, order, suborder, limit, offset);
  }

  async update<T>(table: string, query: Partial<T>, data: Partial<T>) {
    return this.db.update<T>(table, query, data);
  }

  async delete<T>(table: string, query: Partial<T>) {
    return this.db.delete<T>(table, query);
  }
}
