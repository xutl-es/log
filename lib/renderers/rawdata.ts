import type { RenderData } from '../format.ts';

export default function render(data: RenderData) {
	return JSON.stringify(data.data);
}
