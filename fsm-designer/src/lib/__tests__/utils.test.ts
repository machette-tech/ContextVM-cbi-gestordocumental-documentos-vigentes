import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
  });

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', true && 'visible');
    expect(result).toContain('base');
    expect(result).toContain('visible');
    expect(result).not.toContain('hidden');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'extra');
    expect(result).toContain('base');
    expect(result).toContain('extra');
  });

  it('merges tailwind classes correctly with tailwind-merge', () => {
    // tailwind-merge should remove conflicting classes
    const result = cn('px-2', 'px-4');
    // Should only contain the last padding class
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('handles complex class combinations', () => {
    const isActive = true;
    const result = cn(
      'base-class',
      isActive && 'active-class',
      !isActive && 'inactive-class',
      'another-class'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
    expect(result).toContain('another-class');
    expect(result).not.toContain('inactive-class');
  });
});
