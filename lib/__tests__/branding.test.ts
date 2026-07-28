import { describe, it, expect } from 'vitest';
import {
  normalizeHexColor,
  normalizeLogoUrl,
  resolveBranding,
  readableTextOn,
  isBranded,
  DEFAULT_BRAND_COLOR,
  DEFAULT_CONFIDENTIALITY,
} from '../branding';

describe('normalizeHexColor', () => {
  it('accepts long and short form, with or without the hash', () => {
    expect(normalizeHexColor('#1f5f4e')).toBe('#1F5F4E');
    expect(normalizeHexColor('1f5f4e')).toBe('#1F5F4E');
    expect(normalizeHexColor('#abc')).toBe('#AABBCC');
    expect(normalizeHexColor('  #ABC  ')).toBe('#AABBCC');
  });

  it('rejects anything that is not a hex colour', () => {
    for (const bad of ['', null, undefined, 'red', '#12345', 'rgb(0,0,0)', '#gggggg']) {
      expect(normalizeHexColor(bad)).toBeNull();
    }
  });
});

describe('normalizeLogoUrl', () => {
  it('accepts absolute https URLs', () => {
    expect(normalizeLogoUrl('https://cdn.acme.com/logo.png')).toBe(
      'https://cdn.acme.com/logo.png',
    );
  });

  it('rejects schemes that could execute or smuggle content', () => {
    // These end up inside documents that get emailed around, so http and
    // javascript:/data: are refused rather than sanitised.
    for (const bad of [
      'javascript:alert(1)',
      'data:image/svg+xml;base64,AAAA',
      'http://acme.com/logo.png',
      '/logo.png',
      'acme.com/logo.png',
      '',
    ]) {
      expect(normalizeLogoUrl(bad), bad).toBeNull();
    }
  });
});

describe('resolveBranding', () => {
  it('falls back to workspace name and defaults when nothing is set', () => {
    const b = resolveBranding({ name: 'Acme' });
    expect(b.organizationName).toBe('Acme');
    expect(b.legalName).toBeNull();
    expect(b.primaryColor).toBe(DEFAULT_BRAND_COLOR);
    expect(b.confidentialityLabel).toBe(DEFAULT_CONFIDENTIALITY);
    expect(isBranded(b)).toBe(false);
  });

  it('prefers the legal name for document headers', () => {
    const b = resolveBranding({ name: 'Acme', legal_name: 'Acme Holdings Inc.' });
    expect(b.organizationName).toBe('Acme Holdings Inc.');
    expect(b.legalName).toBe('Acme Holdings Inc.');
  });

  it('drops an invalid colour or logo rather than writing it into a document', () => {
    const b = resolveBranding({ name: 'Acme', brand_color: 'nope', logo_url: 'javascript:x' });
    expect(b.primaryColor).toBe(DEFAULT_BRAND_COLOR);
    expect(b.logoUrl).toBeNull();
  });

  it('treats whitespace-only fields as unset', () => {
    const b = resolveBranding({ name: 'Acme', legal_name: '   ', document_footer: '  ' });
    expect(b.legalName).toBeNull();
    expect(b.documentFooter).toBeNull();
  });
});

describe('readableTextOn', () => {
  it('puts dark text on light brand colours and light text on dark ones', () => {
    expect(readableTextOn('#FFFFFF')).toBe('#111111');
    expect(readableTextOn('#FFE600')).toBe('#111111');
    expect(readableTextOn('#000000')).toBe('#FFFFFF');
    expect(readableTextOn(DEFAULT_BRAND_COLOR)).toBe('#FFFFFF');
  });
});
