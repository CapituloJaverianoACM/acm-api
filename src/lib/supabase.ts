import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default class SupabaseDB {
  private static instance: SupabaseDB | null = null;
  private client: SupabaseClient;

  private constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  public static getInstance(): SupabaseDB {
    if (!this.instance) {
      this.instance = new SupabaseDB();
    }
    return this.instance;
  }

  public async insert<T>(table: string, data: T) {
    const { error, data: result } = await this.client.from(table).insert(data).select();
    return this.assembleResponse(error, result);
  }

  public async insertMany<T>(table: string, data: T[]) {
    const { error, data: result } = await this.client.from(table).insert(data).select();
    return this.assembleResponse(error, result);
  }

  public async getAll(table: string) {
    const { error, data } = await this.client.from(table).select('*');
    if (data && data.length === 0 && error == null) return this.assembleResponse({ message: "No records found" }, null);
    return this.assembleResponse(error, data);
  }

  public async getBy<T>(table: string, query: Partial<T>) {
    const { error, data } = await this.client
      .from(table)
      .select("*")
      .match(query);
    if (data && data.length === 0 && error == null) return this.assembleResponse({ message: "Record(s) not found" }, null);

    return this.assembleResponse(error, data);
  }

  public async update<T>(table: string, query: Partial<T>, data: Partial<T>) {
    let q = this.client.from(table).update(data);
    for (const [key, value] of Object.entries(query)) {
      q = q.eq(key, value);
    }
    const { error, data: result } = await q.select();
    return this.assembleResponse(error, result);
  }

  public async delete<T>(table: string, query: Partial<T>) {
    let q = this.client.from(table).delete();
    for (const [key, value] of Object.entries(query)) {
      q = q.eq(key, value);
    }
    const { error, data } = await q.select();
    return this.assembleResponse(error, data);
  }

  private assembleResponse(error: any, data: any) {
    if (error) return { error: error.message || 'Unknown error', data: null };
    return { error: null, data };
  }
}
