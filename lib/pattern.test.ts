import * as Assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Pattern } from './pattern.ts';

describe('pattern', () => {
	it('cleanPattern', () => {
		Assert.strictEqual(Pattern.cleanPattern('log:**::pattern:*:done'), 'log:**:pattern:*:done');
	});
	it('cleanRealm', () => {
		Assert.throws(() => Pattern.cleanRealm('log:**::pattern:*:done'));
	});
	describe('match', () => {
		const pattern1 = new Pattern('a:*:c');
		const pattern2 = new Pattern('a:**:c');
		it('a:*:c == a:b:c', () => Assert.ok(pattern1.match('a:b:c')));
		it('a:*:c == a:b:x', () => Assert.ok(!pattern1.match('a:b:x')));
		it('a:*:c != a:b:x:c', () => Assert.ok(!pattern1.match('a:b:x:c')));
		it('a:**:c == a:b:c', () => Assert.ok(pattern2.match('a:b:c')));
		it('a:**:c == a:b:x:c', () => Assert.ok(pattern2.match('a:b:x:c')));
		it('a:**:c != a:b:x:x', () => Assert.ok(!pattern2.match('a:b:x:x')));
	});
});
