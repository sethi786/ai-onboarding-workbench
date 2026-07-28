/**
 * The brand identity stamped onto every generated document.
 *
 * This lives in `workbench/` (the pure, framework-free core) so report builders
 * can depend on it without reaching into the Next.js app or the database layer.
 * `lib/branding.ts` is what maps a database row onto this shape.
 */
export interface DocumentBrand {
  /** Display name used in headers — the workspace name unless a legal name is set. */
  organizationName: string;
  /** Registered entity name, shown on cover pages when it differs from the above. */
  legalName: string | null;
  /** Absolute https URL to a logo image, or null when none is configured. */
  logoUrl: string | null;
  /** Primary brand colour as `#rrggbb`. Always populated — falls back to a default. */
  primaryColor: string;
  /** Handling marking, e.g. "Confidential — Internal Use Only". */
  confidentialityLabel: string;
  /** Optional line printed at the foot of every page of a printable export. */
  documentFooter: string | null;
}
