import { Sparkles } from 'lucide-react';

/**
 * Shown wherever an AI affordance would be if the deployment had a key.
 *
 * Being explicit beats hiding the feature: an admin who sees this knows exactly
 * what to configure, and a user who doesn't have it isn't left wondering
 * whether the button failed or never existed.
 */
export function AiUnavailable({
  feature,
  children,
}: {
  feature: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="flex gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">{feature} is unavailable</h3>
          {children && <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>}
          <p className="mt-1.5 text-xs text-muted-foreground">
            The AI assistant needs an <code className="font-mono">ANTHROPIC_API_KEY</code> set on
            this deployment. Everything else works without it.
          </p>
        </div>
      </div>
    </div>
  );
}
