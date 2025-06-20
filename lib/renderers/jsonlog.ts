import type { RenderData } from '../format.ts';

export default function render(data: RenderData) {
	const { timestamp, ...rest } = data;
	return JSON.stringify({
		timestamp: new Date(timestamp).toISOString(),
		...rest,
	});
}
