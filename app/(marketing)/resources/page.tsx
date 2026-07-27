import type { Metadata } from 'next';
import { PageHero } from '@/components/marketing/PageHero';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Resources' };

const resources = [
  { t: 'Enterprise AI Governance Checklist', d: 'The controls every AI tool must clear before production — across all 20 review lenses.' },
  { t: 'Agent Governance Playbook', d: 'Ownership, autonomy, tool permissions, identity, audit, and kill-switch requirements for AI agents.' },
  { t: 'RAG & Data Governance Guide', d: 'Permission trimming, vector lifecycle, source citations, and classification for retrieval apps.' },
  { t: 'Go / No-Go Decision Template', d: 'The sign-off matrix, residual-risk acceptance, and launch checklist for AI onboarding.' },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Guides for safe AI adoption"
        subtitle="Practical, review-ready references for teams onboarding AI into regulated environments."
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((r) => (
            <Card key={r.t}>
              <CardHeader>
                <CardTitle>{r.t}</CardTitle>
                <CardDescription>{r.d}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Downloadable resources are provided to signed-in workspaces. Create a free account to access them.
        </p>
      </section>
    </>
  );
}
