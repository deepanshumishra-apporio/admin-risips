import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandLockup } from '@/components/layout/brand-mark';

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

/** The brand panel beside every sign-in step, so the flow reads as one screen. */
export function AuthShell({ title, description, children }: AuthShellProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen">
      <section className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy px-12 py-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: 'radial-gradient(110% 80% at 12% 0%, #0160c2 0%, #020b1b 62%)' }}
        />

        <div className="relative">
          <BrandLockup tone="inverse" className="text-white" />
        </div>

        <div className="relative max-w-sm">
          <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.025em]">
            The control room for your distribution book.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            Sign in to see every investor&apos;s journey, KYC state and investments in one place.
          </p>

          <ul className="mt-7 space-y-3">
            {Highlights.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/75">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
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
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>

          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">{description}</p>

          <div className="mt-7">{children}</div>
        </div>
      </section>
    </div>
  );
}
