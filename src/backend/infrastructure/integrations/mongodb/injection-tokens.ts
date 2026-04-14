import type { InjectionToken } from "tsyringe";

export const MongoDBDatabaseNameToken: InjectionToken<string> = Symbol.for("MongoDBDatabaseName");
export const MongoDBUriToken: InjectionToken<string> = Symbol.for("MongoDBUri");
