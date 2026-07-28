import type { Profile, TeamId } from '../types';
import { isAiTool } from '../types';

/**
 * Regulatory frameworks the review evidences.
 *
 * A hard line runs through this file: Aegis maps *evidence* to obligations. It
 * does not classify an AI system as high-risk under Article 6, and it does not
 * certify conformity — both are legal determinations that need a human who is
 * accountable for getting them wrong. What this gives a compliance officer is
 * the thing they actually lack: a defensible answer to "show me where you
 * addressed Article 14", pointing at controls somebody already assessed.
 *
 * The mapping is deployer-first, because that is who uses this product. You are
 * adopting somebody else's AI far more often than you are shipping your own, so
 * Article 26 carries as much weight here as Articles 9–15.
 */

export type FrameworkId = 'eu-ai-act' | 'iso-42001' | 'nist-ai-rmf';

export interface FrameworkClause {
  id: string;
  /** Citable reference, exactly as a regulator or auditor would write it. */
  ref: string;
  title: string;
  /** What the obligation actually requires, in a sentence. */
  requires: string;
  /** The lenses whose controls produce evidence for this clause. */
  lenses: TeamId[];
}

export interface Framework {
  id: FrameworkId;
  name: string;
  short: string;
  authority: string;
  /** Why this framework is in play, shown to the reviewer. */
  trigger: string;
  appliesWhen: (p: Profile) => boolean;
  clauses: FrameworkClause[];
}

/**
 * EU AI Act, Regulation (EU) 2024/1689.
 *
 * High-risk obligations apply from August 2026. Articles 9–15 bind providers;
 * Article 26 binds deployers, which is the role most Aegis users are in.
 */
const EU_AI_ACT: Framework = {
  id: 'eu-ai-act',
  name: 'EU AI Act',
  short: 'EU AI Act',
  authority: 'Regulation (EU) 2024/1689',
  trigger: 'This tool is an AI system, or has AI capability enabled.',
  appliesWhen: (p) => isAiTool(p),
  clauses: [
    {
      id: 'art-4',
      ref: 'Article 4',
      title: 'AI literacy',
      requires:
        'Providers and deployers must ensure staff dealing with the system have a sufficient level of AI literacy.',
      lenses: ['adoption', 'ai-enablement'],
    },
    {
      id: 'art-9',
      ref: 'Article 9',
      title: 'Risk management system',
      requires:
        'A continuous, iterative risk management process across the system lifecycle, covering foreseeable misuse.',
      lenses: ['qrm-risk', 'security-sar'],
    },
    {
      id: 'art-10',
      ref: 'Article 10',
      title: 'Data and data governance',
      requires:
        'Training, validation and testing data governed for relevance, representativeness and error handling.',
      lenses: ['data-governance', 'privacy-pia'],
    },
    {
      id: 'art-11',
      ref: 'Article 11',
      title: 'Technical documentation',
      requires:
        'Documentation demonstrating the system meets Section 2 requirements, kept current.',
      lenses: ['solution-architecture', 'enterprise-architecture'],
    },
    {
      id: 'art-12',
      ref: 'Article 12',
      title: 'Record-keeping',
      requires: 'Automatic logging of events over the system lifetime, enabling traceability.',
      lenses: ['operations', 'security-sar'],
    },
    {
      id: 'art-13',
      ref: 'Article 13',
      title: 'Transparency and information to deployers',
      requires:
        'Instructions for use that let a deployer interpret output and use the system appropriately.',
      lenses: ['vendor-risk', 'legal'],
    },
    {
      id: 'art-14',
      ref: 'Article 14',
      title: 'Human oversight',
      requires:
        'Design and measures allowing a competent person to oversee, interpret, override, and stop the system.',
      lenses: ['qrm-risk', 'agent-governance'],
    },
    {
      id: 'art-15',
      ref: 'Article 15',
      title: 'Accuracy, robustness and cybersecurity',
      requires:
        'Appropriate accuracy and resilience against error, faults, and attempts to alter behaviour.',
      lenses: ['ai-engineering', 'security-sar'],
    },
    {
      id: 'art-26',
      ref: 'Article 26',
      title: 'Obligations of deployers',
      requires:
        'Use per instructions, assign competent human oversight, ensure input data is relevant, monitor operation, retain logs for at least six months, and inform affected workers before workplace use.',
      lenses: ['adoption', 'iam', 'operations', 'qrm-risk'],
    },
  ],
};

/**
 * ISO/IEC 42001 — AI management system.
 *
 * Annex A holds 38 controls across nine objectives (A.2–A.10). Which apply is
 * decided by the organization's Statement of Applicability, so this maps the
 * objectives rather than asserting individual controls.
 */
const ISO_42001: Framework = {
  id: 'iso-42001',
  name: 'ISO/IEC 42001',
  short: 'ISO 42001',
  authority: 'ISO/IEC 42001:2023, Annex A',
  trigger: 'This tool is an AI system, or has AI capability enabled.',
  appliesWhen: (p) => isAiTool(p),
  clauses: [
    { id: 'a2', ref: 'A.2', title: 'AI policy', requires: 'An AI policy, aligned to business objectives and reviewed.', lenses: ['ai-enablement'] },
    { id: 'a3', ref: 'A.3', title: 'Internal organisation', requires: 'Defined roles, responsibilities, and reporting for AI.', lenses: ['business', 'ai-enablement'] },
    { id: 'a4', ref: 'A.4', title: 'Resources for AI systems', requires: 'Documented data, tooling, compute, and human resources.', lenses: ['platform-cloud', 'finance'] },
    { id: 'a5', ref: 'A.5', title: 'AI system impact assessment', requires: 'Assessment of impact on individuals and groups.', lenses: ['qrm-risk', 'privacy-pia'] },
    { id: 'a6', ref: 'A.6', title: 'AI system life cycle', requires: 'Responsible design, development, verification and deployment.', lenses: ['ai-engineering', 'secure-sdlc'] },
    { id: 'a7', ref: 'A.7', title: 'Data for AI systems', requires: 'Provenance, quality, and preparation of data used by the system.', lenses: ['data-governance'] },
    { id: 'a8', ref: 'A.8', title: 'Information for interested parties', requires: 'Documented information available to users and affected parties.', lenses: ['legal', 'adoption'] },
    { id: 'a9', ref: 'A.9', title: 'Responsible use of AI', requires: 'Defined intended use, and controls against misuse.', lenses: ['agent-governance', 'adoption'] },
    { id: 'a10', ref: 'A.10', title: 'Third-party relationships', requires: 'Allocation of responsibility across suppliers and customers.', lenses: ['vendor-risk', 'legal'] },
  ],
};

/** NIST AI RMF 1.0 — voluntary, but the vocabulary US reviewers use. */
const NIST_AI_RMF: Framework = {
  id: 'nist-ai-rmf',
  name: 'NIST AI Risk Management Framework',
  short: 'NIST AI RMF',
  authority: 'NIST AI 100-1',
  trigger: 'This tool is an AI system, or has AI capability enabled.',
  appliesWhen: (p) => isAiTool(p),
  clauses: [
    { id: 'govern', ref: 'GOVERN', title: 'Govern', requires: 'A culture of risk management: policies, accountability, and oversight structures.', lenses: ['ai-enablement', 'business', 'legal'] },
    { id: 'map', ref: 'MAP', title: 'Map', requires: 'Context established and risks to the system identified.', lenses: ['solution-architecture', 'data-governance', 'privacy-pia'] },
    { id: 'measure', ref: 'MEASURE', title: 'Measure', requires: 'Risks analysed, assessed, benchmarked and monitored.', lenses: ['ai-engineering', 'qrm-risk'] },
    { id: 'manage', ref: 'MANAGE', title: 'Manage', requires: 'Risks prioritised, treated, and responded to over time.', lenses: ['operations', 'security-sar', 'agent-governance'] },
  ],
};

export const FRAMEWORKS: Framework[] = [EU_AI_ACT, ISO_42001, NIST_AI_RMF];

export const FRAMEWORK_BY_ID: Record<FrameworkId, Framework> = {
  'eu-ai-act': EU_AI_ACT,
  'iso-42001': ISO_42001,
  'nist-ai-rmf': NIST_AI_RMF,
};

export function frameworksFor(profile: Profile): Framework[] {
  return FRAMEWORKS.filter((f) => f.appliesWhen(profile));
}

/**
 * Shown wherever framework coverage is. Non-negotiable: the moment somebody
 * reads a percentage as "we are compliant", this product has done harm.
 */
export const FRAMEWORK_DISCLAIMER =
  'This maps your review evidence to obligations. It is not a conformity assessment and does not ' +
  'determine whether a system is high-risk under Article 6 — those are legal determinations. Use ' +
  'it to show a reviewer where each obligation was addressed, not to claim the obligation is met.';
