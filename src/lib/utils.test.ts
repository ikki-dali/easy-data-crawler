import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'included', false && 'excluded');
    expect(result).toBe('base included');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle empty strings', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle undefined and null', () => {
    const result = cn('class1', undefined, null, 'class2');
    expect(result).toBe('class1 class2');
  });
});

