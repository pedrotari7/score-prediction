import { isEmpty } from './utils';

describe('utils', () => {
	describe('isEmpty', () => {
		it('should isEmpty true', () => {
			expect(isEmpty({})).toBe(true);
		});

		it('should isEmpty false', () => {
			expect(isEmpty({ someKey: 'some value' })).toBe(false);
		});
	});
});
