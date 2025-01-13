import { Db, InsertOneResult, MongoClient, ServerApiVersion } from "mongodb";
const URI = `mongodb+srv://${Bun.env.MONGO_USER}:${Bun.env.MONGO_PASSWORD}@acm-api.437po.mongodb.net/?retryWrites=true&w=majority&appName=acm-api`;

export default class MongoDB {
    private client : MongoClient;

    constructor() {
        this.client = new MongoClient(URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
    }

    private async connectDB() : Promise<Db> {
        await this.client.connect();
        return (this.client.db('acm-api'))
    }

    private assembleResponse(ack: any) {
        if (!ack.acknowledged) return { error: "Something went bad with mongo", data: null };
        else return { error: null, data: ack.insertedId.toString() };
    }

    public async testConnection() {
        try {
            await (await this.connectDB()).command({ ping: 1});
            console.log("Pinged succesfully");
        } catch(err) {
            return false;
        }

        return true;
    }

    public async insertDocument(collection: string, data: any) {
        const db = await this.connectDB();
        const response = await db.collection(collection).insertOne(data);

        return this.assembleResponse(response);
    }

    public async getOneDocument(collection: string, query: any) {
        const db = await this.connectDB();
        const response = await db.collection(collection).findOne(query);

        return response;
    }
}
