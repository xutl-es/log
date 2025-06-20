import { describe, it } from 'node:test';
import * as Assert from 'node:assert/strict';
import * as Util from 'node:util';

import JSONLog from './jsonlog.ts';
import RawData from './rawdata.ts';
import Console from './console.ts';

describe('render', () => {
	const timestamp = Date.now(),
		realm = 'test:realm',
		message = 'this is the message',
		data = { a: 1, c: 2, b: 'it' },
		meta = { machine: 'local' };

	it('JSONLog', () =>
		Assert.strictEqual(
			JSONLog({ ...meta, data, timestamp, realm, message }),
			JSON.stringify({ timestamp: new Date(timestamp).toISOString(), realm, message, data, ...meta }),
		));
	it('RawData', () => Assert.strictEqual(RawData({ ...meta, data, timestamp, realm, message }), JSON.stringify(data)));
	it('Console', () => {
		const now = Date.now();
		Console({ ...meta, data, timestamp: now, realm, message });
		Assert.deepStrictEqual(
			Console({ ...meta, data, timestamp: now + 5, realm, message }).map((x) => Util.stripVTControlCharacters(x)),
			[
				`     +5ms [${realm}] ${Util.stripVTControlCharacters(message)}`,
				...Util.formatWithOptions({ colors: true, compact: true }, '%O', data)
					.split(/\r?\n/)
					.map((l) => `\t${Util.stripVTControlCharacters(l)}`),
			],
		);
	});
});
