import type { RenderData } from '../format.ts';
import * as Util from 'node:util';

const _COLORS = {
	black: 0,
	red: 0,
	green: 0,
	yellow: 0,
	blue: 0,
	magenta: 0,
	cyan: 0,
	white: 0,
	gray: 0,
	redBright: 0,
	greenBright: 0,
	yellowBright: 0,
	blueBright: 0,
	magentaBright: 0,
	cyanBright: 0,
	whiteBright: 0,
};
const COLORNAMES = Object.keys(_COLORS) as (keyof typeof _COLORS)[];

const colors: Record<string, keyof typeof _COLORS> = {
	error: 'red',
	warn: 'redBright',
	state: 'blue',
	info: 'magenta',
};

export default function render(logdata: RenderData) {
	const { timestamp, realm, message, data } = logdata;
	const main = [formatTime(timestamp), formatRealm(realm), message].join(' ');
	const lines = [main];
	if (data && Object.keys(data).length) {
		lines.push(
			...Util.formatWithOptions({ colors: true, compact: true }, '%O', data)
				.split(/\r?\n/)
				.map((l) => `\t${l}`),
		);
	}
	return lines;
}

let last = Date.now();
function formatTime(timestamp: number) {
	const timedif = timestamp - last;
	last = timestamp;
	const txt = `${new Array(6).fill(' ').join('')}+${timedif}ms`.slice(-9);
	return Util.styleText(['bgYellow', 'blue'], txt);
}

function formatRealm(realm: string) {
	while (realm.length > 25) {
		const bits = realm.split(':');
		if (realm.length < 3) break;
		bits[1] = '';
		realm = bits.join(':');
	}
	const color = (colors[realm] = colors[realm] ?? COLORNAMES[Math.floor(Math.random() * COLORNAMES.length)]);
	return Util.styleText(color, `[${realm}]`);
}
