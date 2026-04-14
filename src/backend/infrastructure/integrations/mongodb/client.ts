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
		});
		void this.connect();
	}
}
