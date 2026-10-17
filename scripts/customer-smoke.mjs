import assert from 'node:assert/strict';
const origin = process.argv[2] || 'http://localhost:3001';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  throw new Error(
    'This smoke suite is only for an isolated local build with no live credentials.',
  );
for (let i = 0; i < 40; i++) {
  try {
    if ((await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok) break;
  } catch {
    /* server boot */
  }
  if (i === 39) throw new Error('Server did not start');
  await new Promise((resolve) => setTimeout(resolve, 500));
}
const routes = new Set([
  '/',
  '/tools',
  '/assessments',
  '/pricing',
  '/contact',
  '/book',
  '/privacy',
  '/terms',
  '/security',
  '/platform',
  '/about',
  '/launch-status',
  '/robots.txt',
  '/sitemap.xml',
]);
const catalogue = await (await fetch(`${origin}/tools`)).text();
for (const match of catalogue.matchAll(/href="(\/tools\/[^"?#]+)"/g))
  routes.add(match[1]);
let checked = 0;
for (const path of routes) {
  const response = await fetch(`${origin}${path}`);
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
  assert.equal(response.headers.get('x-frame-options'), 'DENY', path);
  const body = await response.text();
  if (path === '/')
    assert.ok(
      body.includes('Know your AI risks.'),
      'Homepage value proposition',
    );
  if (path === '/pricing') {
    assert.ok(body.includes('$99'));
    assert.ok(!body.includes('$499'));
  }
  if (['/contact', '/book'].includes(path)) {
    assert.ok(body.includes('Enquiries open soon'));
    assert.ok(!body.includes('<form'), 'No fake intake');
  }
  if (path === '/tools/lovable')
    assert.ok(
      body.includes('template%3Dlovable'),
      'Starter intent in signup link',
    );
  if (path === '/robots.txt')
    assert.ok(body.includes('Disallow: /'), 'Preview is not indexed');
  checked++;
}
for (const path of [
  '/signup',
  '/login',
  '/portal',
  '/portal/start?template=lovable',
]) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  assert.ok([200, 307, 308].includes(response.status), path);
  const body = await response.text();
  assert.ok(
    response.headers.get('location')?.includes('/launch-status') ||
      body.includes('/launch-status'),
    `Unavailable auth safely redirects: ${path}`,
  );
}
for (const path of [
  '/api/leads',
  '/api/billing/checkout',
  '/api/billing/portal',
  '/api/billing/webhook',
]) {
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', origin },
    body: '{}',
  });
  assert.equal(
    response.status,
    503,
    `${path} fails closed without configured services`,
  );
}
assert.equal((await fetch(`${origin}/tools/not-a-real-tool`)).status, 404);
assert.equal((await fetch(`${origin}/api/health`)).status, 503);
console.log(
  `PASS: ${checked} public routes, tool signup intent, preview indexing, security headers, unavailable-service paths, and unknown-tool 404.`,
);
