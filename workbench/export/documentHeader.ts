import type { DocumentBrand } from '../types';
import { DRAFT_BANNER } from '../data/constants';

/**
 * The masthead every generated markdown artifact opens with.
 *
 * These files leave the product immediately — they get pasted into a security
 * questionnaire, attached to a change ticket, or emailed to a vendor — so each
 * one has to identify the organization, the tool under review, its handling
 * marking, and the fact that it is a draft, without any surrounding context.
 */
export function documentHeaderLines(
  title: string,
  brand: DocumentBrand | undefined,
  meta: {
    toolName: string;
    platform: string;
    environment: string;
    classification: string;
    generatedAt: string;
  },
): string[] {
  const lines: string[] = [];

  if (brand?.logoUrl) lines.push(`![${brand.organizationName}](${brand.logoUrl})`, '');
  if (brand) lines.push(`**${brand.organizationName}**`, '');

  lines.push(`# ${title}`, '');
  if (brand) lines.push(`_${brand.confidentialityLabel}_`, '');
  lines.push(`> ${DRAFT_BANNER}`, '');

  lines.push(`**Tool under review:** ${meta.toolName} — ${meta.platform}`);
  lines.push(`**Environment:** ${meta.environment} · **Classification:** ${meta.classification}`);
  lines.push(`**Generated:** ${meta.generatedAt}`);
  lines.push('');
  return lines;
}

/** Closing block: attribution plus whatever footer the workspace configured. */
export function documentFooterLines(brand: DocumentBrand | undefined): string[] {
  if (!brand?.documentFooter) return [];
  return ['---', '', `_${brand.documentFooter}_`, ''];
}
