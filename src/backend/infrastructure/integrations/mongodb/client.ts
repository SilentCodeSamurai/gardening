import { MongoClient, ServerApiVersion } from "mongodb";
import { inject, injectable } from "tsyringe";
import { MongoDBUriToken } from "./injection-tokens";

@injectable()
export class MongoDBClient extends MongoClient {
	constructor(@inject(MongoDBUriToken) uri: string) {
		super(uri, {
			serverApi: {
				version: ServerApiVersion.v1,
				strict: true,
				deprecationErrors: true,
			},
			// Keep below Lambda's request budget so connection errors surface as
			// real exceptions instead of being masked by the runtime's hard kill.
			serverSelectionTimeoutMS: 5_000,
			connectTimeoutMS: 5_000,
		});
		void this.connect();
	}
}
