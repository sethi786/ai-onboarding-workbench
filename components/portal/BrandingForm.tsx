'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { updateBranding } from '@/lib/actions/organizations';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import {
  CONFIDENTIALITY_PRESETS,
  DEFAULT_BRAND_COLOR,
  normalizeHexColor,
  readableTextOn,
} from '@/lib/branding';
import type { DocumentBrand } from '@/workbench/types';

/**
 * Branding is easier to get right when you can see the result, so the cover-page
 * masthead previews live as the fields change — the same layout the printable
 * export renders.
 */
export function BrandingForm({
  orgId,
  orgSlug,
  brand,
  disabled,
}: {
  orgId: string;
  orgSlug: string;
  brand: DocumentBrand;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [legalName, setLegalName] = useState(brand.legalName ?? '');
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl ?? '');
  const [color, setColor] = useState(brand.primaryColor);
  const [marking, setMarking] = useState(brand.confidentialityLabel);
  const [footer, setFooter] = useState(brand.documentFooter ?? '');

  const previewColor = normalizeHexColor(color) ?? DEFAULT_BRAND_COLOR;

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          const res = await updateBranding(orgId, orgSlug, fd);
          if (res?.error) toast.error(res.error);
          else toast.success('Branding saved — new documents will use it');
        })
      }
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <fieldset disabled={disabled || pending} className="space-y-4">
        <Field
          label="Legal entity name"
          hint="Used on document cover pages when it differs from the workspace name."
        >
          <Input
            name="legal_name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder={brand.organizationName}
          />
        </Field>

        <Field label="Logo URL" hint="Must be a full https:// link to an image.">
          <Input
            name="logo_url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://acme.com/logo.svg"
          />
        </Field>

        <Field label="Brand colour" hint="Hex value. Applied to headings, rules, and the readiness ring.">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={previewColor}
              onChange={(e) => setColor(e.target.value.toUpperCase())}
              aria-label="Pick brand colour"
              className="h-9 w-12 cursor-pointer rounded border border-border bg-background p-1"
            />
            <Input
              name="brand_color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder={DEFAULT_BRAND_COLOR}
              className="font-mono"
            />
          </div>
        </Field>

        <Field label="Handling marking" hint="Printed on every generated document.">
          <Select
            name="confidentiality_label"
            value={marking}
            onChange={(e) => setMarking(e.target.value)}
          >
            {CONFIDENTIALITY_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Document footer" hint="Optional. A legal or distribution line for the foot of each export.">
          <Input
            name="document_footer"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            placeholder="© Acme Holdings Inc. Not for external distribution."
          />
        </Field>

        <Button type="submit" variant="primary" disabled={disabled || pending}>
          {pending ? 'Saving…' : 'Save branding'}
        </Button>
        {disabled && (
          <p className="text-xs text-muted-foreground">
            Only owners and admins can change workspace branding.
          </p>
        )}
      </fieldset>

      {/* Live cover-page masthead — mirrors the printable export. */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Document preview
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div className="h-2" style={{ backgroundColor: previewColor }} />
          <div className="p-5">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                // Arbitrary customer-hosted URL — next/image would need a remote
                // pattern per tenant, so this stays a plain img.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="max-h-7 max-w-[120px] object-contain" />
              ) : null}
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {legalName.trim() || brand.organizationName}
              </span>
            </div>
            <p
              className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: previewColor }}
            >
              {marking}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-tight text-[#1A1A1A]">
              Tool Adoption Review
            </h3>
            <p className="text-xs text-[#4A4A4A]">Example CRM · Production</p>
            <div className="mt-5 flex items-center gap-3">
              <span
                className="rounded px-2 py-1 text-[10px] font-semibold"
                style={{ backgroundColor: previewColor, color: readableTextOn(previewColor) }}
              >
                Conditional Go
              </span>
              <span className="text-[10px] text-[#7A7A7A]">Readiness 74/100</span>
            </div>
            <div className="mt-5 border-t border-[#E6E2DA] pt-2 text-[9px] text-[#7A7A7A]">
              {footer.trim() || 'Draft only. Requires official review.'}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mb-1.5 block text-xs text-muted-foreground">{hint}</span>
      {children}
    </label>
  );
}
