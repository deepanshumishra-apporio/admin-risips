'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Rocket, Save } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { AllocationStep } from '@/features/portfolios/components/steps/allocation-step';
import { BasicsStep } from '@/features/portfolios/components/steps/basics-step';
import { FundsStep } from '@/features/portfolios/components/steps/funds-step';
import { GoalRiskStep } from '@/features/portfolios/components/steps/goal-risk-step';
import { ReviewStep } from '@/features/portfolios/components/steps/review-step';
import { EmptyDraft, usePortfolioDraft } from '@/features/portfolios/use-portfolio-draft';
import type { PortfolioDraft } from '@/types/portfolio.types';
import { cn } from '@/utils/cn';

const Steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'goal-risk', label: 'Goal & risk' },
  { id: 'allocation', label: 'Allocation' },
  { id: 'funds', label: 'Funds' },
  { id: 'review', label: 'Review' },
] as const;

type PortfolioWizardProps = {
  initial?: PortfolioDraft;
  mode?: 'create' | 'edit';
};

export function PortfolioWizard({ initial = EmptyDraft, mode = 'create' }: PortfolioWizardProps): React.JSX.Element {
  const api = usePortfolioDraft(initial);
  const [stepIndex, setStepIndex] = useState(0);
  const [published, setPublished] = useState(false);

  const step = Steps[stepIndex];
  const canPublish = api.check.balanced && api.check.fundsMatched && api.draft.name.trim().length > 0;

  if (published) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="size-6 text-success" />
          </span>
          <h2 className="text-[18px] font-semibold text-ink">
            {api.draft.name} is {mode === 'edit' ? 'republished' : 'live'}
          </h2>
          <p className="max-w-sm text-[13.5px] text-ink-muted">
            A new category card has been added to the model portfolio library. Agents can map investors to it from
            their next review meeting.
          </p>
          <Link
            href="/model-portfolios"
            className="mt-2 inline-flex h-9.5 items-center rounded-md bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-strong"
          >
            Back to model portfolios
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={mode === 'edit' ? `Edit ${api.draft.name}` : 'Create a model portfolio'}
        subtitle="Suggestions stay in Draft until you publish them. Only Live portfolios reach investors."
        action={
          <span className="tabular text-[12.5px] text-ink-muted">
            Step {stepIndex + 1} of {Steps.length}
          </span>
        }
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-line px-5 py-3">
        {Steps.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setStepIndex(index)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              index === stepIndex
                ? 'bg-brand-soft text-brand-deep'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink-soft',
            )}
          >
            <span
              className={cn(
                'tabular flex size-5 items-center justify-center rounded-full text-[11px] font-semibold',
                index === stepIndex ? 'bg-brand text-white' : 'bg-surface-sunken text-ink-muted',
              )}
            >
              {index + 1}
            </span>
            {entry.label}
          </button>
        ))}
      </nav>

      <CardBody>
        {step.id === 'basics' ? <BasicsStep {...api} /> : null}
        {step.id === 'goal-risk' ? <GoalRiskStep {...api} /> : null}
        {step.id === 'allocation' ? <AllocationStep {...api} /> : null}
        {step.id === 'funds' ? <FundsStep {...api} /> : null}
        {step.id === 'review' ? <ReviewStep {...api} /> : null}
      </CardBody>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
        <Button
          icon={<ArrowLeft className="size-4" />}
          variant="ghost"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button icon={<Save className="size-4" />}>Save draft</Button>

          {stepIndex < Steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStepIndex((index) => index + 1)}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={<Rocket className="size-4" />}
              disabled={!canPublish}
              onClick={() => setPublished(true)}
            >
              Publish portfolio
            </Button>
          )}
        </div>
      </footer>
    </Card>
  );
}
