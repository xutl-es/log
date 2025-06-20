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
	#patterns: Record<string, { pattern: Pattern; destination: string; format: Format<Meta>; pipemode: PipeMode }> = {};
	add(
		pattern: string,
		destination: string = 'stderr',
		format: Format<Meta> = new Format<Meta>(
			['stderr', 'stdout'].includes(destination) ? Formats.Console : Formats.JSONLog,
			{},
		),
		mode: PipeModes = 'STREAM',
	) {
		const id = Pattern.cleanPattern(pattern);
		this.#patterns[id] = { pattern: new Pattern(pattern), format, destination, pipemode: LogPipe[mode] };
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
	[Symbol.dispose]() {
		for (const pipe of Object.values(this.#pipes)) {
			pipe[Symbol.dispose]();
		}
		this.#pipes = {};
	}
	log(realm: Realm, message: string, ...args: any[]) {
		return this.#write({
			timestamp: Date.now(),
			realm,
			message,
			arguments: args,
			metadata: this.#metadata,
		});
	}
	create(realm: Realm) {
		return this.log.bind(this, realm);
	}
	debug = this.create('debug');
	trace = this.create('trace');
	info = this.create('info');
	state = this.create('state');
	warn = this.create('warn');
	error = this.create('error');

	static define<Meta extends MetaData>(metadata: Meta, cfg: LoggerConfig = {}) {
		const logger = new Logger(metadata);
		for (const [pattern, { format = 'JSONLog', destination, mode, options }] of Object.entries({
			...DefaultConfig,
			...cfg,
		})) {
			logger.add(pattern, destination, new Format(Formats[format], options), mode);
		}
		return logger;
	}
	static #global?: Logger<NoMeta>;
	static get global() {
		this.#global = this.#global ?? Logger.define({});
		return this.#global as Logger<NoMeta>;
	}
}
