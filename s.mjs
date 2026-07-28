import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await p.screenshot({ path: '/tmp/home.png' });
await b.close();
console.log('ok');
