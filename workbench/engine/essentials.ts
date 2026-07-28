import type { Profile } from '../types';

/**
 * The handful of facts every reviewer asks for, regardless of which lens they
 * sit behind.
 *
 * A template can prefill what's true of the product; it cannot know who owns
 * this adoption or why you want it. Those blanks are invisible until they
 * surface as an em-dash on a cover page in front of a risk committee, so they
 * get named before the document is generated rather than after.
 */
export interface MissingEssential {
  field: keyof Profile;
  label: string;
  /** Why a reviewer cares — the reason it's worth going back for. */
  why: string;
}

const ESSENTIALS: MissingEssential[] = [
  {
    field: 'businessOwner',
    label: 'Business owner',
    why: 'Every review asks who is accountable for this tool in the business.',
  },
  {
    field: 'technicalOwner',
    label: 'Technical owner',
    why: 'Security and platform reviews need a named person to answer to.',
  },
  {
    field: 'useCase',
    label: 'Use case',
    why: 'Business review cannot assess value against a blank.',
  },
  {
    field: 'targetUsers',
    label: 'Target users',
    why: 'Scope of exposure — who gets access decides how far the risk reaches.',
  },
];

export function missingEssentials(profile: Profile): MissingEssential[] {
  const blanks = ESSENTIALS.filter((e) => !String(profile[e.field] ?? '').trim());
  if (profile.dataTypes.length === 0) {
    blanks.push({
      field: 'dataTypes',
      label: 'Data types',
      why: 'Privacy, security, and data governance all scope from what the tool touches.',
    });
  }
  return blanks;
}
