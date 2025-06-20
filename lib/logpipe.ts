import { appendFileSync, createWriteStream } from 'node:fs';
import { Writable } from 'node:stream';

class DevNull extends Writable {
	readonly writable: boolean = true;
	_write(_chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		if (callback) callback(null);
	}
	static readonly instance = new DevNull();
}
class Sync extends Writable {
	#filename;
	constructor(filename: string) {
		super();
		this.#filename = filename;
	}
	readonly writable: boolean = true;
	_write(_chunk: any, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		appendFileSync(this.#filename, _chunk, { flush: true, encoding: 'utf8' });
		if (callback) callback(null);
	}
}

export type PipeMode = 0 | 1;
export type PipeModes = 'STREAM' | 'SYNC';

export class LogPipe {
	#stream: Writable;
	constructor(filename: string | 'stderr' | 'stdout' | 'null', pipemode: PipeMode) {
		switch (filename) {
			case 'stderr':
				this.#stream = process.stderr;
				break;
			case 'stdout':
				this.#stream = process.stdout;
				break;
			case 'null':
				this.#stream = DevNull.instance;
				break;
			default:
				if (pipemode === LogPipe.STREAM) {
					this.#stream = createWriteStream(filename, {
						flags: 'a',
						encoding: 'utf-8',
					});
				} else {
					this.#stream = new Sync(filename);
				}
		}
	}
	write(str: string) {
		this.#stream.write(str);
	}
	[Symbol.dispose]() {
		this.#stream.end();
	}

	static readonly STREAM: PipeMode = 0;
	static readonly SYNC: PipeMode = 1;
}
