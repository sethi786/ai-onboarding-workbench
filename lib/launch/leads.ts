export interface LeadInput {
  name: string;
  email: string;
  company: string;
  message: string;
  kind: 'contact' | 'demo';
  token: string;
  website: string;
}
export function validateLead(input: unknown): LeadInput | null {
  if (!input || typeof input !== 'object') return null;
  const v = input as Record<string, unknown>;
  if (
    ['name', 'email', 'company', 'message', 'kind', 'token', 'website'].some(
      (k) => typeof v[k] !== 'string',
    )
  )
    return null;
  const lead = Object.fromEntries(
    Object.entries(v).map(([k, val]) => [
      k,
      typeof val === 'string' ? val.trim() : val,
    ]),
  ) as unknown as LeadInput;
  if (
    !lead.name ||
    lead.name.length > 100 ||
    lead.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) ||
    lead.company.length > 150 ||
    lead.message.length < 10 ||
    lead.message.length > 5000 ||
    !['contact', 'demo'].includes(lead.kind) ||
    !lead.token ||
    lead.token.length > 2048 ||
    lead.website
  )
    return null;
  return { ...lead, email: lead.email.toLowerCase() };
}
