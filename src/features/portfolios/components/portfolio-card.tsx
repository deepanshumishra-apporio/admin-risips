'use client';

import { Pencil, Rocket, Trash2, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { AssetClasses, AssetColor } from '@/data/asset-colors';
import type { ModelPortfolio } from '@/types/portfolio.types';
import { formatCount, formatInr } from '@/utils/format';
import { PortfolioStatusTone } from '@/utils/tone';

type PortfolioCardProps = {
  portfolio: ModelPortfolio;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PortfolioCard({ portfolio, onPublish, onDelete }: PortfolioCardProps): React.JSX.Element {
  return (
    <article className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{portfolio.name}</h3>
          <p className="mt-1 text-[12px] font-medium text-brand-deep">{portfolio.goalTag}</p>
        </div>
        <Badge tone={PortfolioStatusTone[portfolio.status]} dot>
          {portfolio.status}
        </Badge>
      </div>

      <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-muted">{portfolio.description}</p>

      <div className="mt-4">
        <div className="flex h-2 overflow-hidden rounded-full">
          {AssetClasses.map((assetClass) => (
            <span
              key={assetClass}
              style={{
                width: `${portfolio.allocation[assetClass]}%`,
                backgroundColor: AssetColor[assetClass],
              }}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {AssetClasses.map((assetClass) => (
            <li key={assetClass} className="flex items-center gap-1.5 text-[11.5px] text-ink-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: AssetColor[assetClass] }} />
              {assetClass} <span className="tabular font-semibold text-ink-soft">{portfolio.allocation[assetClass]}%</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-surface-sunken px-3 py-2.5">
        <div>
          <dt className="text-[11px] text-ink-muted">Investors</dt>
          <dd className="tabular flex items-center gap-1 text-[13px] font-semibold text-ink">
            <Users className="size-3.5 text-ink-muted" />
            {formatCount(portfolio.investorCount)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-muted">AUM</dt>
          <dd className="tabular text-[13px] font-semibold text-ink">{formatInr(portfolio.aum)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink-muted">Min SIP</dt>
          <dd className="tabular text-[13px] font-semibold text-ink">
            {formatInr(portfolio.minimumSip, { compact: false })}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3.5">
        <Link
          href={`/model-portfolios/${portfolio.id}`}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-line-strong text-[13px] font-medium text-ink hover:bg-surface-sunken"
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>

        {portfolio.status === 'Draft' ? (
          <button
            type="button"
            onClick={() => onPublish(portfolio.id)}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-brand text-[13px] font-medium text-white hover:bg-brand-strong"
          >
            <Rocket className="size-3.5" />
            Publish
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onDelete(portfolio.id)}
          aria-label={`Delete ${portfolio.name}`}
          className="inline-flex size-8 items-center justify-center rounded-md border border-line-strong text-ink-muted hover:border-danger/30 hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </article>
  );
}
