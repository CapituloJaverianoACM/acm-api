import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

export default class SupabaseDB {
    private static instance: SupabaseDB | null = null;
    private client: SupabaseClient;

    private constructor() {
        this.client = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_ANON_KEY!,
        );
    }

    public static getInstance(): SupabaseDB {
        if (!this.instance) {
            this.instance = new SupabaseDB();
        }
        return this.instance;
    }

    public async insert<T>(table: string, data: T) {
        const { error, data: result } = await this.client
            .from(table)
            .insert(data)
            .select();
        return this.assembleResponse(error, result);
    }

    public async insertMany<T>(table: string, data: T[]) {
        const { error, data: result } = await this.client
            .from(table)
            .insert(data)
            .select();
        return this.assembleResponse(error, result);
    }

    public async getMultiple(
        table: string,
        column: string,
        options: any[],
    ): Promise<{ error: string | null; data: any }> {
        const { data: result, error } = await this.client
            .from(table)
            .select("*")
            .in(column, options);

        return this.assembleResponse(error, result);
    }

    public async getAll(
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
        let req = this.client.from(table).select("*");

        if (order) {
            req = req.order(order.column, {
                ascending: order.asc ?? false,
            });
        }

        if (suborder) {
            req = req.order(suborder.column, {
                ascending: suborder.asc ?? false,
            });
        }

        if (offset) {
            req = req.range(offset, offset + (limit || 1000) - 1);
        } else if (limit) {
            req = req.limit(limit);
        }

        const { error, data } = await req;

        if (data && data.length === 0 && error == null)
            return this.assembleResponse({ message: "No records found" }, null);
        return this.assembleResponse(error, data);
    }

    public async getBy<T>(
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
        let req = this.client.from(table).select("*").match(query);

        if (order) {
            req = req.order(order.column, {
                ascending: order.asc ?? false,
            });
        }

        if (suborder) {
            req = req.order(suborder.column, {
                ascending: suborder.asc ?? false,
            });
        }

        if (offset) {
            req = req.range(offset, offset + (limit || 1000) - 1);
        } else if (limit) {
            req = req.limit(limit);
        }

        const { data, error } = await req;

        if (data && data.length === 0 && error == null)
            return this.assembleResponse({ message: "Record(s) not found" }, null);

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
        if (error) return { error: error.message || "Unknown error", data: null };
        return { error: null, data };
    }

    public async verifySignedJWT(token: string): Promise<User | null> {
        const { data, error } = await this.client.auth.getUser(token);
        if (error) {
            console.log(error);
        }
        return data.user;
    }
}
