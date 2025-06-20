import type * as Util from 'node:util';
import { Format, default as Formats } from './format.ts';
import type { PipeMode, PipeModes } from './logpipe.ts';
import { LogPipe } from './logpipe.ts';
import { Pattern } from './pattern.ts';

export type FormatID = keyof typeof Formats;
export type LoggerConfig = {
	[pattern: string]: {
		format?: FormatID;
		destination: string;
		mode?: PipeModes;
		options?: Omit<Util.InspectOptions, 'maxArrayLength' | 'maxStringLength' | 'breakLength' | 'compact'>;
	};
};

const DefaultConfig: LoggerConfig = {
	info: { format: 'Console', destination: 'stderr' },
	error: { format: 'Console', destination: 'stderr' },
};

export type Primitive = string | number | boolean | null;
export type MetaData = { [key: string]: Primitive };
export type NoMeta = MetaData & Record<string, never>;
export type Realm = 'debug' | 'trace' | 'info' | 'state' | 'warn' | 'error' | string;
export type LogData<Meta extends MetaData> = {
	timestamp: number;
	realm: Realm;
	message: string;
	arguments?: unknown[];
	metadata?: Meta;
};

export class Logger<Meta extends MetaData> {
	#metadata: Meta;
	constructor(metadata: Meta) {
		this.#metadata = metadata;
	}
	#patterns: Record<string, { pattern: Pattern; format: Format<Meta>; destination: string; pipemode: PipeMode }> = {};
	add(pattern: string, destination: string, format: Format<Meta>, pipemode: PipeMode) {
		const id = Pattern.cleanPattern(pattern);
		this.#patterns[id] = { pattern: new Pattern(pattern), format, destination, pipemode };
	}
	delete(pattern: string) {
		delete this.#patterns[Pattern.cleanPattern(pattern)];
	}
	#pipes: Record<string, LogPipe> = {};
	#write(data: LogData<Meta>) {
		const realm = Pattern.cleanRealm(data.realm);
		for (const { pattern, format, destination, pipemode } of Object.values(this.#patterns)) {
			if (!pattern.match(realm)) continue;
			const pipename = pattern.resolve(realm, destination);
			const pipe = (this.#pipes[pipename] = this.#pipes[pipename] ?? new LogPipe(pipename, pipemode));
			const line = format.format({ ...data, realm });
			pipe.write(line);
		}
	}
	create(realm: Realm) {
		return (message: string, ...args: unknown[]) =>
			this.#write({
				timestamp: Date.now(),
				realm,
				message,
				arguments: args,
				metadata: this.#metadata,
			});
	}
	[Symbol.dispose]() {
		for (const pipe of Object.values(this.#pipes)) {
			pipe[Symbol.dispose]();
		}
		this.#pipes = {};
	}
	debug(message: string, ...args: unknown[]) {
		return this.#write({
			timestamp: Date.now(),
			realm: 'debug',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	trace(message: string, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'trace',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	info(message: string, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'info',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	state(message: string, state: any, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'state',
			message,
			arguments: [...args, state],
			metadata: this.#metadata,
		});
	}
	warn(message: string, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'warn',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	error(message: string, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'error',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	fatal(message: string, ...args: unknown[]) {
		this.#write({
			timestamp: Date.now(),
			realm: 'fatal',
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	static define<Meta extends MetaData>(metadata: Meta, cfg: LoggerConfig = {}) {
		const logger = new Logger(metadata);
		for (const [pattern, { format = 'JSONLog', destination, mode = 'STREAM', options }] of Object.entries({
			...DefaultConfig,
			...cfg,
		})) {
			logger.add(pattern, destination, new Format(Formats[format], options), LogPipe[mode]);
		}
		return logger;
	}
	static #global?: Logger<NoMeta>;
	static get global() {
		this.#global = this.#global ?? Logger.define({});
		return this.#global as Logger<NoMeta>;
	}
}
