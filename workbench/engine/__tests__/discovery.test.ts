import { describe, it, expect } from 'vitest';
import { discoverFromText, provisionalProfile } from '../discovery';
import { computeRisk } from '../scoring';

describe('discoverFromText', () => {
  it('identifies library tools from a plain SSO application list', () => {
    const names = discoverFromText(
      ['Microsoft 365 Copilot', 'Salesforce Sales Cloud', 'Slack', 'Snowflake'].join('\n'),
    ).map((d) => d.name);
    expect(names).toContain('Microsoft 365 Copilot');
    expect(names).toContain('Slack');
    expect(names).toContain('Snowflake');
  });

  it('survives the noise a real export actually contains', () => {
    const csv = [
      '"Microsoft 365 Copilot",owner@acme.com,2026-03-14,142 users',
      'https://app.slack.com/client | Slack | 88 seats',
      '\t\tGrammarly;;;12',
    ].join('\n');
    const names = discoverFromText(csv).map((d) => d.name);
    expect(names).toContain('Microsoft 365 Copilot');
    expect(names).toContain('Slack');
    expect(names).toContain('Grammarly');
  });

  it('prefers the longest alias so specific tools beat generic ones', () => {
    // "GitHub Copilot" must not be swallowed by a bare "copilot" match.
    const [d] = discoverFromText('GitHub Copilot Business');
    expect(d.name).toBe('GitHub Copilot');
  });

  it('links a library match to its template so the review starts prefilled', () => {
    const [d] = discoverFromText('Microsoft 365 Copilot');
    expect(d.source).toBe('library');
    expect(d.templateId).toBe('m365-copilot');
  });

  it('keeps lines it cannot identify rather than quietly dropping them', () => {
    const found = discoverFromText('Some Internal Tool We Built');
    expect(found).toHaveLength(1);
    expect(found[0].source).toBe('unmatched');
    // Guessing a vendor for an unknown line would be a fabrication.
    expect(found[0].vendor).toBe('');
    expect(found[0].name).toBe('Some Internal Tool We Built');
  });

  it('deduplicates the same tool appearing several times', () => {
    const found = discoverFromText(['Slack', 'slack.com', 'SLACK'].join('\n'));
    expect(found.filter((d) => d.name === 'Slack')).toHaveLength(1);
  });

  it('ignores blank and junk lines', () => {
    expect(discoverFromText('\n\n   \n,\n')).toHaveLength(0);
  });

  it('flags AI tools nobody has reviewed as shadow AI', () => {
    const found = discoverFromText(['Grammarly', 'Otter.ai', 'Zoom'].join('\n'));
    const shadow = found.filter((d) => d.shadowAi).map((d) => d.name);
    expect(shadow).toContain('Grammarly');
    expect(shadow).toContain('Otter.ai');
    // Zoom is not an AI tool, so it isn't shadow AI.
    expect(shadow).not.toContain('Zoom');
  });

  it('stops calling a tool shadow AI once it is under review', () => {
    const found = discoverFromText('Grammarly', { alreadyReviewed: ['Grammarly'] });
    expect(found[0].shadowAi).toBe(false);
    expect(found[0].ai).toBe(true);
  });
});

describe('provisionalProfile', () => {
  it('inherits the template defaults for a known tool', () => {
    const [d] = discoverFromText('Microsoft 365 Copilot');
    const p = provisionalProfile(d);
    expect(p.toolCategory).toBe('AI / ML system');
    expect(p.pii).toBe(true);
    expect(p.dataTypes.length).toBeGreaterThan(0);
  });

  it('assumes production and confidential data for anything unrecognised', () => {
    // A tool nobody declared is being used right now, on unknown data. Ranking
    // it as a harmless sandbox trial would defeat the point of looking.
    const [d] = discoverFromText('Mystery Vendor Portal');
    const p = provisionalProfile(d);
    expect(p.environment).toBe('Production');
    expect(p.dataClassification).toBe('Confidential');
  });

  it('ranks an unreviewed AI tool above an ordinary business app', () => {
    const [ai] = discoverFromText('Otter.ai');
    const [saas] = discoverFromText('DocuSign');
    const order = ['Low', 'Medium', 'High', 'Critical'];
    const aiRisk = computeRisk(provisionalProfile(ai), false);
    const saasRisk = computeRisk(provisionalProfile(saas), false);
    expect(order.indexOf(aiRisk)).toBeGreaterThanOrEqual(order.indexOf(saasRisk));
  });
});
