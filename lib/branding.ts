import type { DocumentBrand } from '@/workbench/types';

/**
 * Maps a workspace row onto the brand used by every generated document, and
 * validates the fields a user can set. Both the settings form and the server
 * action go through here, so a colour or logo that reaches the database has
 * already been normalised.
 */

/** Evergreen — matches the product's own accent, so unbranded docs still look deliberate. */
export const DEFAULT_BRAND_COLOR = '#1F5F4E';

export const DEFAULT_CONFIDENTIALITY = 'Confidential — Internal Use Only';

export const CONFIDENTIALITY_PRESETS = [
  'Confidential — Internal Use Only',
  'Internal',
  'Restricted',
  'Public',
] as const;

export interface OrgBrandingRow {
  name: string;
  legal_name?: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
  confidentiality_label?: string | null;
  document_footer?: string | null;
}

/**
 * Accepts `#abc`, `abc`, `#aabbcc`, `AABBCC` and returns `#AABBCC`.
 * Returns null for anything else — the caller decides whether that's an error
 * or a reason to fall back to the default.
 */
export function normalizeHexColor(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(v)) {
    return `#${v.toUpperCase().split('').map((c) => c + c).join('')}`;
  }
  if (/^[0-9a-f]{6}$/i.test(v)) return `#${v.toUpperCase()}`;
  return null;
}

/**
 * A logo URL is embedded into documents that get emailed around, so only
 * absolute https URLs are accepted — no `javascript:`, no `data:` payloads, and
 * no plain http that would break as mixed content.
 */
export function normalizeLogoUrl(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return null;
  }
  return url.protocol === 'https:' ? url.toString() : null;
}

export function resolveBranding(org: OrgBrandingRow): DocumentBrand {
  const legal = (org.legal_name ?? '').trim();
  return {
    organizationName: legal || org.name,
    legalName: legal || null,
    logoUrl: normalizeLogoUrl(org.logo_url),
    primaryColor: normalizeHexColor(org.brand_color) ?? DEFAULT_BRAND_COLOR,
    confidentialityLabel:
      (org.confidentiality_label ?? '').trim() || DEFAULT_CONFIDENTIALITY,
    documentFooter: (org.document_footer ?? '').trim() || null,
  };
}

/** True when the workspace has done more than accept every default. */
export function isBranded(brand: DocumentBrand): boolean {
  return (
    brand.logoUrl !== null ||
    brand.legalName !== null ||
    brand.primaryColor !== DEFAULT_BRAND_COLOR ||
    brand.documentFooter !== null
  );
}

/**
 * Readable foreground for text sitting on the brand colour. Uses the WCAG
 * relative-luminance formula rather than a naive average so mid-tone brand
 * colours don't end up with unreadable white text.
 */
export function readableTextOn(hex: string): '#FFFFFF' | '#111111' {
  const c = normalizeHexColor(hex) ?? DEFAULT_BRAND_COLOR;
  const channel = (i: number) => {
    const v = parseInt(c.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  return luminance > 0.45 ? '#111111' : '#FFFFFF';
}
