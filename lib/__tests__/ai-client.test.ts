import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAiConfigured, isAiFailure, structured, prose } from '../ai/client';

/**
 * The unconfigured path is the one that runs in every deployment without a key,
 * so it's the one worth pinning: it must fail cleanly and describably rather
 * than throwing, because a governance tool that breaks on a missing optional
 * key would be worse than one with no AI at all.
 */

const original = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = original;
});

describe('isAiConfigured', () => {
  it('is false when the key is absent or blank', () => {
    expect(isAiConfigured()).toBe(false);
    process.env.ANTHROPIC_API_KEY = '   ';
    expect(isAiConfigured()).toBe(false);
  });

  it('is true once a key is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    expect(isAiConfigured()).toBe(true);
  });
});

describe('without a key', () => {
  it('structured() returns a non-retryable failure instead of throwing', async () => {
    const result = await structured({ system: 's', prompt: 'p', schema: { type: 'object' } });
    expect(isAiFailure(result)).toBe(true);
    if (isAiFailure(result)) {
      expect(result.retryable).toBe(false);
      expect(result.error).toMatch(/not configured/i);
    }
  });

  it('prose() fails the same way', async () => {
    const result = await prose({ system: 's', prompt: 'p' });
    expect(isAiFailure(result)).toBe(true);
    if (isAiFailure(result)) expect(result.retryable).toBe(false);
  });
});

describe('isAiFailure', () => {
  it('narrows a success result to its data', () => {
    const ok = { data: { x: 1 } } as const;
    expect(isAiFailure(ok)).toBe(false);
  });
});
