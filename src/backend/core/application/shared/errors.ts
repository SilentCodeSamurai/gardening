export type ApplicationErrorCode =
	| "BAD_REQUEST"
	| "UNAUTHORIZED"
	| "ACCESS_DENIED"
	| "NOT_FOUND"
	| "CONFLICT"
	| "VALIDATION"
	| "INTERNAL";

export type ApplicationErrorData = Record<string, unknown>;

export class ApplicationError extends Error {
	public readonly discriminator = "application_error";
	private readonly _code: ApplicationErrorCode;
	public readonly i18nMessageKey: string;
	public readonly source: string;
	public readonly data: ApplicationErrorData | undefined;

	public get code(): ApplicationErrorCode {
		return this._code;
	}

	constructor(params: {
		code: ApplicationErrorCode;
		message: string;
		i18nMessageKey: string;
		source: string;
		data?: ApplicationErrorData;
		cause?: unknown;
	}) {
		super(params.message, { cause: params.cause });
		this.name = new.target.name;
		this._code = params.code;
		this.i18nMessageKey = params.i18nMessageKey;
		this.source = params.source;
		this.data = params.data;
	}
}
