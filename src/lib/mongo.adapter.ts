import { ObjectId } from "mongodb";
import { IDatabase } from "./database.interface";
import MongoDB from "./mongo";

export class MongoAdapter implements IDatabase {
  private db = MongoDB.getInstance();

  async insert<T>(collection: string, data: T) {
    return this.db.insertDocument(collection, data);
  }

  async insertMany<T>(collection: string, data: T[]) {
    return this.db.insertManyDocuments(collection, data);
  }

  async getAll(
    collection: string,
    order?: {
      column: string;
      asc?: boolean;
    },
    suborder?: {
      column: string;
      asc?: boolean;
    },
    limit?: number,
  ) {
    return this.db.getAllDocuments(collection, order, suborder, limit);
  }

  // Por alguna razón este getBy siempre esta limitado a solo 1 documento.
  // No se implementa order y limit por la misma razón.

  async getBy<T>(
    collection: string,
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
  ) {
    //@ts-expect-error
    if (collection == "members" && query._id)
      query._id = parseInt(query._id as string);
    //@ts-expect-error
    else if (query._id) query._id = new ObjectId(query._id as string);
    return await this.db.getOneDocument(collection, query);
  }

  async update<T>(collection: string, query: Partial<T>, data: Partial<T>) {
    return this.db.updateOneDocument(collection, query, data);
  }

  async delete<T>(collection: string, query: Partial<T>) {
    return this.db.deleteOneDocument(collection, query);
  }
}
