import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('returns a single class unchanged', () => {
    expect(cn('p-4')).toBe('p-4');
  });

  it('merges multiple classes', () => {
    expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm');
  });

  it('deduplicates conflicting Tailwind classes — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'ignored', 'included')).toBe('base included');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('p-4', undefined, null as any)).toBe('p-4');
  });

  it('merges conflicting text colours — last wins', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
