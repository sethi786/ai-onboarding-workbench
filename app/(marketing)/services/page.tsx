import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/marketing/PageHero';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Services' };

const services = [
  {
    t: 'AI Readiness Evaluation',
    d: 'Self-evaluate any AI tool across 20 enterprise review lenses with controls, evidence, blockers, and a live readiness score.',
  },
  {
    t: 'Governance Control Tower',
    d: 'A portfolio view of every AI tool in flight — readiness, risk grade, blockers, and owners in one dashboard.',
  },
  {
    t: 'Evidence Factory',
    d: 'Generate draft SAR, PIA, architecture, agent-governance, and go/no-go packs from your evaluation data.',
  },
  {
    t: 'Agent & Connector Governance',
    d: 'Purpose-built controls for autonomy, tool permissions, identity, kill switches, OAuth scopes, and DLP.',
  },
  {
    t: 'Workflow & Approvals',
    d: 'Track the 25-stage onboarding lifecycle from intake to retirement with owners, due dates, and sign-offs.',
  },
  {
    t: 'Prefilled Tool Library',
    d: 'Instantiate the world’s major AI tools as pre-populated evaluations with suggested answers to start fast.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Product"
        title="Everything you need to clear AI for the enterprise"
        subtitle="Aegis turns opaque, multi-team review into a structured, evidence-backed readiness workflow."
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.t}>
              <CardHeader>
                <CardTitle>{s.t}</CardTitle>
                <CardDescription>{s.d}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-12">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-electric px-6 text-[15px] font-medium text-white hover:opacity-90"
          >
            Start free
          </Link>
        </div>
      </section>
    </>
  );
}
