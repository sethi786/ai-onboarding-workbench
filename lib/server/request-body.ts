/** Enforce actual byte limits, including chunked requests without Content-Length. */
export async function readBody(request: Request, limit = 16000) {
  if (Number(request.headers.get('content-length')) > limit)
    throw new Error('Request too large');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let text = '',
    bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('Request too large');
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
