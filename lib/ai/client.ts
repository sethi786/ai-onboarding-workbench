import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

/**
 * The single place the product talks to Claude.
 *
 * AI here is assistive, never authoritative: it drafts the answers a reviewer
 * would otherwise stare at a blank box for, and a human edits and owns them.
 * That shapes the contract below — every call can fail or be unavailable, and
 * every caller has to render something useful when it does. A governance tool
 * that breaks because an API key is missing would be worse than one with no AI
 * at all.
 */

export const AI_MODEL = 'claude-opus-5';

/** False when no key is configured — the whole feature stays dark, no errors. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export interface AiFailure {
  error: string;
  /** True when retrying the same request could plausibly succeed. */
  retryable: boolean;
}

export type AiResult<T> = { data: T; error?: undefined } | AiFailure;

export function isAiFailure<T>(r: AiResult<T>): r is AiFailure {
  return 'error' in r && r.error !== undefined;
}

/**
 * Turn SDK exceptions into something a reviewer can act on. The raw messages
 * are written for the developer calling the API, not for somebody halfway
 * through a privacy assessment.
 */
function describe(err: unknown): AiFailure {
  if (err instanceof Anthropic.RateLimitError) {
    return { error: 'The AI assistant is rate limited right now. Try again in a moment.', retryable: true };
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return { error: 'The configured AI credentials were rejected. Check ANTHROPIC_API_KEY.', retryable: false };
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return { error: 'The configured AI credentials do not have access to this model.', retryable: false };
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { error: 'Could not reach the AI service. Check network access and try again.', retryable: true };
  }
  if (err instanceof Anthropic.InternalServerError) {
    return { error: 'The AI service had an internal error. Try again in a moment.', retryable: true };
  }
  if (err instanceof Anthropic.APIError) {
    return { error: `The AI request failed: ${err.message}`, retryable: false };
  }
  return { error: 'The AI request failed unexpectedly.', retryable: true };
}

interface StructuredRequest {
  system: string;
  prompt: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}

/**
 * Ask for a JSON object matching `schema`.
 *
 * Structured output is what makes this safe to render into a form: the caller
 * gets fields it can place, not prose it has to parse. Refusals are checked
 * before the content is read — a refused response has no usable content block,
 * and treating it as data would surface an empty draft with no explanation.
 */
export async function structured<T>({
  system,
  prompt,
  schema,
  maxTokens = 8000,
}: StructuredRequest): Promise<AiResult<T>> {
  if (!isAiConfigured()) {
    return { error: 'The AI assistant is not configured for this deployment.', retryable: false };
  }

  try {
    const message = await getClient().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: prompt }],
      output_config: { format: { type: 'json_schema', schema } },
    });

    if (message.stop_reason === 'refusal') {
      return {
        error: 'The AI assistant declined to answer this request. Try rephrasing what you pasted.',
        retryable: false,
      };
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    if (!text.trim()) {
      return { error: 'The AI assistant returned an empty response.', retryable: true };
    }

    try {
      return { data: JSON.parse(text) as T };
    } catch {
      // Schema-constrained output should always parse; if it doesn't, say so
      // rather than handing the caller a half-built object.
      return { error: 'The AI assistant returned a malformed response.', retryable: true };
    }
  } catch (err) {
    return describe(err);
  }
}

/** Free-text generation, for narrative output where a schema adds nothing. */
export async function prose({
  system,
  prompt,
  maxTokens = 4000,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<AiResult<string>> {
  if (!isAiConfigured()) {
    return { error: 'The AI assistant is not configured for this deployment.', retryable: false };
  }

  try {
    const message = await getClient().messages.create({
      model: AI_MODEL,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    if (message.stop_reason === 'refusal') {
      return { error: 'The AI assistant declined to answer this request.', retryable: false };
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) return { error: 'The AI assistant returned an empty response.', retryable: true };
    return { data: text };
  } catch (err) {
    return describe(err);
  }
}
