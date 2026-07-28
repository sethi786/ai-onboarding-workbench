'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles, Copy, MessageSquareText } from 'lucide-react';
import { aiAnswerQuestion, aiExecutiveSummary } from '@/lib/actions/ai';
import type { DraftedAnswer } from '@/lib/ai/assist';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AiUnavailable } from '@/components/portal/AiUnavailable';

/**
 * The two things people do with a finished assessment: write the executive
 * summary that fronts the pack, and answer the questions reviewers and
 * customers send back. Both are drafted from the recorded assessment only.
 */
export function AiReviewAssist({
  evalId,
  available,
}: {
  evalId: string;
  available: boolean;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<DraftedAnswer | null>(null);
  const [summaryPending, startSummary] = useTransition();
  const [answerPending, startAnswer] = useTransition();

  if (!available) {
    return (
      <AiUnavailable feature="AI review assistance">
        Drafting the executive summary and answering reviewer questions from this assessment.
      </AiUnavailable>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-electric" />
          <h2 className="font-semibold">Executive summary</h2>
          <span className="text-sm text-muted-foreground">
            The narrative that opens the review pack.
          </span>
          <Button
            type="button"
            variant="outline"
            className="ml-auto"
            disabled={summaryPending}
            onClick={() =>
              startSummary(async () => {
                const res = await aiExecutiveSummary(evalId);
                if (res.error) {
                  toast.error(res.error);
                  return;
                }
                setSummary(res.data ?? null);
              })
            }
          >
            {summaryPending ? 'Writing…' : summary ? 'Rewrite' : 'Draft summary'}
          </Button>
        </div>

        {summary && (
          <div className="mt-3 rounded-md border border-border bg-background p-4">
            {summary.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed last:mb-0">
                {para}
              </p>
            ))}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(summary);
                toast.success('Summary copied');
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <MessageSquareText className="h-4 w-4 shrink-0 text-electric" />
          <h2 className="font-semibold">Answer a reviewer’s question</h2>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Paste a question from a security questionnaire, a risk reviewer, or a customer. The answer
          comes from this assessment — and says so when the assessment doesn’t cover it.
        </p>

        <Textarea
          rows={3}
          className="mt-3"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="How is customer data encrypted at rest and in transit, and who can access it?"
        />
        <Button
          type="button"
          variant="primary"
          className="mt-2"
          disabled={answerPending}
          onClick={() =>
            startAnswer(async () => {
              const res = await aiAnswerQuestion(evalId, question);
              if (res.error) {
                toast.error(res.error);
                return;
              }
              setAnswer(res.data ?? null);
            })
          }
        >
          {answerPending ? 'Answering…' : 'Draft an answer'}
        </Button>

        {answer && (
          <div className="mt-3 rounded-md border border-border bg-background p-4">
            <Badge tone={answer.confidence === 'supported by the assessment' ? 'success' : answer.confidence === 'partially supported' ? 'warning' : 'danger'}>
              {answer.confidence}
            </Badge>
            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed">{answer.answer}</p>

            {answer.gaps.length > 0 && (
              <div className="mt-3 rounded-md bg-warning/10 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.09_75)]">
                  Not covered by this assessment
                </h3>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                  {answer.gaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(answer.answer);
                toast.success('Answer copied');
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
