import { EOL } from 'node:os';
import * as Util from 'node:util';

import type { LogData, MetaData } from './logger.ts';

export type RenderData = {
	timestamp: number;
	realm: string;
	message: string;
	data: Record<string, unknown>;
	[key: string]: unknown;
};
export type LogRender = (data: RenderData) => string | string[];

export class Format<Meta extends MetaData> {
	#render: LogRender;
	#opts: Util.InspectOptions;
	constructor(render: LogRender, options: Util.InspectOptions = {}) {
		this.#render = render;
		const {
			showHidden,
			depth = 5,
			colors = false,
			customInspect,
			showProxy,
			maxArrayLength = Number.POSITIVE_INFINITY,
			maxStringLength = Number.POSITIVE_INFINITY,
			breakLength = Number.POSITIVE_INFINITY,
			compact = Number.POSITIVE_INFINITY,
			sorted,
			getters,
			numericSeparator,
		} = options;
		this.#opts = {
			showHidden,
			depth,
			colors,
			customInspect,
			showProxy,
			maxArrayLength,
			maxStringLength,
			breakLength,
			compact,
			sorted,
			getters,
			numericSeparator,
		};
	}
	format(logdata: LogData<Meta>) {
		const { timestamp, realm, message: format, arguments: rawargs = [], metadata = {} as Meta } = logdata;
		const args = rawargs.splice(0, parameterCount(format));
		const message = Util.formatWithOptions(this.#opts, format, args);
		const data: Record<string, unknown> = rawargs.reduce(reduceData, {} as Record<string, unknown>);
		const rendered = this.#render({ timestamp, realm, message, data, ...metadata });
		const lines = Array.isArray(rendered) ? rendered : [rendered];
		const out = this.#opts.colors ? lines : lines.map((l) => Util.stripVTControlCharacters(l));
		return out.join(EOL) + EOL;
	}
}

function parameterCount(format: string): number {
	return format.split(/%[sdifjoOc]/).length - 1;
}

type RealError = ErrorConstructor & { isError: (e: unknown) => e is Error };
function reduceData(agg: Record<string, unknown>, item: unknown, index: number): Record<string, unknown> {
	if ('object' !== typeof item || Array.isArray(item)) {
		agg[index] = item;
		return agg;
	}
	if (!item) return agg;
	if (!agg.error && (Error as RealError).isError(item)) {
		const { message, stack, code } = item as any;
		agg.error = { message, code, stack: stack.split(/\r?\n/).slice(1) };
		return agg;
	}
	return Object.assign(agg, item);
}

import Console from './renderers/console.ts';
import JSONLog from './renderers/jsonlog.ts';
import RawData from './renderers/rawdata.ts';
export default {
	Console,
	JSONLog,
	RawData,
};
