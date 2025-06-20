import * as OS from 'node:os';
import type { Realm } from './logger.ts';

const ENV = {
	get date() {
		return new Date().toISOString().split('T')[0];
	},
	get time() {
		return new Date()
			.toISOString()
			.split('T')[1]
			.replace(/(?:\.\d+)?Z$/, '');
	},
	home: `${process.env.HOMEDRIVE}${process.env.HOMEPATH}`,
	temp: OS.tmpdir(),
	host: OS.hostname(),
	...OS.userInfo(),
};
const REP = new RegExp(`\\{(${['\\d+', ...Object.keys(ENV)].join('|')})\\}`, 'gi');

export class Pattern {
	#id;
	#expression;
	constructor(pat: string) {
		const parts = splitRealm(pat).map(cleanPatternPart);
		this.#id = parts.join(':');
		const regp = parts.map(patternExpression).join(':');
		this.#expression = new RegExp(`^${regp}$`);
		console.error(this.#id, ' <=> ', this.#expression);
	}
	get id() {
		return this.#id;
	}
	match(realm: Realm) {
		return !!this.#expression.test(realm);
	}
	resolve(realm: Realm, item: string) {
		const parts = splitRealm(realm);
		return item.replaceAll(REP, (sub, idx) => parts[idx] ?? sub);
	}
	static cleanPattern(pattern: string): Realm {
		return splitRealm(pattern).map(cleanPatternPart).join(':');
	}
	static cleanRealm(realm: Realm): Realm {
		return splitRealm(realm).map(cleanRealmPart).join(':');
	}
}

function splitRealm(realm: Realm) {
	return realm
		.toLowerCase()
		.split(':')
		.map((p) => p.trim())
		.filter((p) => !!p);
}
function cleanRealmPart(part: string) {
	if (/^[a-z0-9]+$/.test(part)) return part;
	throw new Error(`invalid realm component: ${part}`);
}
function cleanPatternPart(part: string) {
	if (part === '**') return part;
	if (part === '*') return part;
	if (/^[a-z0-9]+$/.test(part)) return part;
	throw new Error(`invalid realm component: ${part}`);
}
function patternExpression(part: string) {
	if (part === '*') {
		return `[a-z0-9]+`;
	} else if (part === '**') {
		return `[a-z0-9]+(?::[a-z0-9]+)*`;
	} else {
		return `${part}`;
	}
}
