import { rm } from 'node:fs/promises';

// Remove only generated Next output. In particular, stale server/route-cache
// entries must not survive into the next release and serve an older homepage.
await rm(new URL('../.next/', import.meta.url), {
  recursive: true,
  force: true,
});
