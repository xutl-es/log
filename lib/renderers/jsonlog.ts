import type { RenderData } from '../format.ts';

export default function render(logdata: RenderData) {
	const { timestamp, realm, message, data, ...rest } = logdata;
	return JSON.stringify({
		timestamp: new Date(timestamp).toISOString(),
		realm,
		message,
		data,
		...rest,
	});
}
