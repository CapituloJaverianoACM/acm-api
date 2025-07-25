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

  async getAll(collection: string) {
    return this.db.getAllDocuments(collection);
  }

  async getBy<T>(collection: string, query: Partial<T>) {
    return await this.db.getOneDocument(collection, query);
  }

  async update<T>(collection: string, query: Partial<T>, data: Partial<T>) {
    return this.db.updateOneDocument(collection, query, data);
  }

  async delete<T>(collection: string, query: Partial<T>) {
    return this.db.deleteOneDocument(collection, query);
  }
}
