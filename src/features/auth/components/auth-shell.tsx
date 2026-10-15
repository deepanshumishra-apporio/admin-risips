import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandLockup, BrandMark } from '@/components/layout/brand-mark';

const Highlights = [
  'Every investor, from signup to first SIP',
  'KYC progress and the cases that are stuck',
  'Two-factor sign-in and an audit trail on every record',
];

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * Every sign-in step, as in the design: always dark, whatever theme the portal
 * is set to — a brand panel fading from blue to navy on the left, and the form
 * in a card on navy on the right.
 */
export function AuthShell({ title, description, children }: AuthShellProps): React.JSX.Element {
  return (
    <div className="theme-dark flex min-h-screen bg-navy text-ink">
      <section
        className="relative hidden w-[56%] flex-col justify-between overflow-hidden px-12 py-12 text-white lg:flex"
        style={{ background: 'linear-gradient(180deg, #0158b0 0%, #003977 32%, #031938 58%, #010a19 78%)' }}
      >
        {/* The mark, large and faint, in the panel's top corner. */}
        <BrandMark size={280} tone="inverse" className="pointer-events-none absolute -top-6 right-10 opacity-[0.07]" />

        <div className="relative">
          <BrandLockup tone="inverse" className="text-white" />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[32px] leading-[1.15] font-semibold tracking-[-0.025em]">
            The control room for your distribution book.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/65">
            Sign in to see every investor&apos;s journey, KYC state and investments in one place.
          </p>

          <ul className="mt-7 space-y-3">
            {Highlights.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/80">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-deep" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/35">
          AMFI registered mutual fund distributor. Investments are subject to market risk.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <BrandLockup tone="inverse" className="text-white" />
          </div>

          <div className="rounded-xl border border-line bg-surface p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-muted">{description}</p>

            <div className="mt-6">{children}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
