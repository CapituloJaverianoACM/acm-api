import { Db, MongoClient, ServerApiVersion } from "mongodb";
const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@acm-api.437po.mongodb.net/?retryWrites=true&w=majority&appName=acm-api`;

export default class MongoDB {
  private client: MongoClient;
  private static instance: MongoDB | null = null;

  private constructor() {
    this.client = new MongoClient(URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }

  public static getInstance(): MongoDB {
    if (MongoDB.instance == null) MongoDB.instance = new MongoDB();
    return MongoDB.instance;
  }

  private async connectDB(): Promise<Db> {
    await this.client.connect();
    return this.client.db("acm-api");
  }

  private assembleResponse(ack: boolean, data: any) {
    if (!ack) return { error: "Something went bad with mongo", data: null };
    else return { error: null, data };
  }

  public async testConnection() {
    try {
      await (await this.connectDB()).command({ ping: 1 });
      console.log("Pinged succesfully");
    } catch (err) {
      return false;
    }

    return true;
  }

  public async insertDocument(collection: string, data: any) {
    const db = await this.connectDB();
    const response = await db.collection(collection).insertOne(data);

    return this.assembleResponse(response.acknowledged, {
      _id: response.insertedId.toString(),
    });
  }

  public async insertManyDocuments(collection: string, data: any) {
    const db = await this.connectDB();
    const response = await db.collection(collection).insertMany(data);
    return this.assembleResponse(response.acknowledged, {
      insertedIds: response.insertedIds,
    });
  }

  public async getOneDocument(collection: string, query: any) {
    const db = await this.connectDB();
    const response = await db.collection(collection).findOne(query);
    if (response == null) return { error: "Record(s) not found", data: null };

    return this.assembleResponse(response != null, response);
  }

  public async getAllDocuments(
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
    const db = await this.connectDB();
    let response = db.collection(collection).find();

    const sortObj: Record<string, 1 | -1> = {};

    if (order) {
      sortObj[order.column] = order.asc ? 1 : -1;
    }
    if (suborder) {
      sortObj[suborder.column] = suborder.asc ? 1 : -1;
    }

    if (order || suborder) {
      response = response.sort(sortObj);
    }

    if (limit) {
      response = response.limit(limit);
    }

    const docs = await response.toArray();
    if (docs.length === 0) return { error: "No records found", data: null };

    return this.assembleResponse(response != null, docs);
  }

  public async deleteOneDocument(collection: string, query: any) {
    const db = await this.connectDB();
    const response = await db.collection(collection).deleteOne(query);

    return this.assembleResponse(response.acknowledged, {
      deletedCount: response.deletedCount,
    });
  }

  public async updateOneDocument(collection: string, query: any, data: any) {
    const db = await this.connectDB();
    const updatedObj = {
      $set: data,
    };
    const response = await db
      .collection(collection)
      .updateOne(query, updatedObj);
    return this.assembleResponse(response.acknowledged, {
      modifiedCount: response.modifiedCount,
    });
  }
}
