import { toSlug } from './slugUtils';

describe('toSlug utility', () => {
  it('should return empty string for empty input', () => {
    expect(toSlug('')).toBe('');
    // @ts-expect-error testing null input
    expect(toSlug(null)).toBe('');
    // @ts-expect-error testing undefined input
    expect(toSlug(undefined)).toBe('');
  });

  it('should convert input to lowercase', () => {
    expect(toSlug('TEST')).toBe('test');
  });

  it('should replace spaces and symbols with hyphens', () => {
    expect(toSlug('Hello World')).toBe('hello-world');
    expect(toSlug('Provision Analytics @ Inc.')).toBe('provision-analytics-inc');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(toSlug('---company---')).toBe('company');
  });

  it('should collapse multiple consecutive hyphens', () => {
    expect(toSlug('company  name')).toBe('company-name');
  });
});
