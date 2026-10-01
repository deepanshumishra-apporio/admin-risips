import { BadgeCheck, Mail, MapPin, Phone } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Card, CardBody } from '@/components/ui/card';
import type { InvestorDetail } from '@/types/admin-api.types';
import { formatDate, humanize } from '@/utils/format';

function Row({ label, value }: { label: string; value: string | null }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[12.5px] text-ink-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{value ?? '—'}</dd>
    </div>
  );
}

export function ContactCard({ detail }: { detail: InvestorDetail }): React.JSX.Element {
  const { summary, user, profile } = detail;
  const name = summary.name ?? 'Unnamed investor';
  const address = profile?.addresses[0];

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} tone="violet" className="size-11 text-[14px]" />
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold text-ink">{name}</p>
            <p className="text-[12.5px] text-ink-muted">Signed up {formatDate(summary.signedUpAt)}</p>
          </div>
        </div>

        <ul className="space-y-2 border-t border-line pt-3.5">
          <li className="flex items-center gap-2 text-[13px] text-ink-soft">
            <Mail className="size-3.5 shrink-0 text-ink-muted" />
            <span className="truncate">{summary.email ?? 'No email'}</span>
            {user.emailVerifiedAt ? <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified" /> : null}
          </li>
          <li className="flex items-center gap-2 text-[13px] text-ink-soft">
            <Phone className="size-3.5 shrink-0 text-ink-muted" />
            <span className="tabular">{summary.phone}</span>
            {user.phoneVerifiedAt ? <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified" /> : null}
          </li>
          {address ? (
            <li className="flex items-center gap-2 text-[13px] text-ink-soft">
              <MapPin className="size-3.5 shrink-0 text-ink-muted" />
              {[address.city, address.state].filter(Boolean).join(', ') || address.postalCode}
            </li>
          ) : null}
        </ul>

        <dl className="space-y-2 border-t border-line pt-3.5">
          <Row label="PAN" value={summary.pan} />
          <Row label="Date of birth" value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : null} />
          <Row label="Gender" value={profile?.gender ? humanize(profile.gender) : null} />
          <Row label="Occupation" value={profile?.occupation ? humanize(profile.occupation) : null} />
          <Row label="Income" value={profile?.incomeSlab ? humanize(profile.incomeSlab) : null} />
          <Row label="Tax status" value={profile?.taxStatus ? humanize(profile.taxStatus) : null} />
          <Row label="Account status" value={humanize(summary.status)} />
        </dl>
      </CardBody>
    </Card>
  );
}
