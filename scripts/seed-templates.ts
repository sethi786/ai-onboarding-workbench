/**
 * Seeds the tool_templates table from data/tool-templates.ts (service role).
 * Run: npm run seed:templates  (loads .env.local via node --env-file)
 *
 * The app renders the library from the static module too, so seeding is optional
 * — it exists so the library can later be queried/extended per-tenant.
 */
import { createAdminClient } from '../lib/supabase/admin';
import { TOOL_TEMPLATES } from '../data/tool-templates';

async function main() {
  const supabase = createAdminClient();
  const rows = TOOL_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    vendor: t.vendor,
    platform: t.platform,
    tool_type: t.toolType,
    tool_category: t.defaults.toolCategory ?? 'AI / ML system',
    self_hosted: t.defaults.selfHosted ?? false,
    summary: t.summary,
    category: t.category,
    defaults: t.defaults,
    suggested_assessments: t.suggested,
    is_active: true,
    sort_order: t.sortOrder,
  }));
  const { error } = await supabase.from('tool_templates').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} tool templates.`);
}

main();
