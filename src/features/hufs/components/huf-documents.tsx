'use client';

import { CheckCircle2, Circle, Loader2, Upload, XCircle } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { uploadHufDocument, type HufActionState } from '@/features/hufs/actions';
import { RegistrarLabel, RegistrarTone } from '@/features/hufs/labels';
import type { HufDetail, HufDocumentKind } from '@/types/admin-api.types';

const Documents: { kind: HufDocumentKind; title: string; why: string }[] = [
  {
    kind: 'AOF',
    title: 'Account opening form (AOF), signed by the karta',
    why: "Needed before the HUF can invest. For a non-demat order NSE checks an eLog or AOF is on file, and a HUF can't have an eLog. The karta signs for the HUF, with the HUF stamp.",
  },
  {
    kind: 'FATCA_FORM',
    title: 'FATCA / CRS form, signed by the karta',
    why: "NSE's FATCA form for a HUF or non-individual. Backs up the FATCA declaration already sent, which the registrars check strictly for a HUF.",
  },
  {
    kind: 'CANCELLED_CHEQUE',
    title: "Cancelled cheque of the HUF's account",
    why: "Only if NSE's bank check fails. It must show the HUF's name, account number and IFSC.",
  },
];

function UploadButton(): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-surface-sunken disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
      Send to NSE
    </button>
  );
}

function DocumentRow({ id, kind, title, why, huf }: { id: string; kind: HufDocumentKind; title: string; why: string; huf: HufDetail }): React.JSX.Element {
  const [state, action] = useActionState(uploadHufDocument, { error: null } as HufActionState);
  const doc = huf.documents[kind];
  const Icon = doc?.ok ? CheckCircle2 : doc ? XCircle : Circle;
  return (
    <li className="space-y-2 border-b border-line pb-4 last:border-b-0 last:pb-0">
      <div className="flex gap-3">
        <Icon className={`mt-0.5 size-4.5 shrink-0 ${doc?.ok ? 'text-success' : doc ? 'text-danger' : 'text-ink-muted'}`} />
        <div className="min-w-0 space-y-1">
          <p className="text-[13.5px] font-medium text-ink">{title}</p>
          <p className="text-[12.5px] text-ink-muted">{why}</p>
          {doc ? (
            <p className="text-[12.5px] text-ink-soft">
              {doc.ok ? 'Accepted by NSE' : `NSE refused it: ${doc.remark ?? doc.status}`} · {new Date(doc.uploadedAt).toLocaleString('en-IN')} ·{' '}
              {(doc.bytes / 1024).toFixed(0)} KB
            </p>
          ) : null}
          {kind === 'AOF' && huf.nse?.aof ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(['cams', 'kfin'] as const).map((r) => (
                <Badge key={r} tone={RegistrarTone[huf.nse!.aof![r].status]}>
                  {r === 'cams' ? 'CAMS' : 'KFin'}: {huf.nse!.aof![r].remark ?? RegistrarLabel[huf.nse!.aof![r].status]}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {huf.canUploadDocuments ? (
        <form action={action} className="flex flex-wrap items-center gap-2 pl-7.5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="kind" value={kind} />
          <input
            type="file"
            name="file"
            required
            accept="application/pdf,image/jpeg,image/png,image/tiff"
            className="max-w-full text-[12.5px] text-ink-soft file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-ink"
          />
          <UploadButton />
          {state.error ? <p role="alert" className="w-full text-[12.5px] text-danger">{state.error}</p> : null}
          {state.done ? <p role="status" className="w-full text-[12.5px] text-success">{state.done}</p> : null}
        </form>
      ) : null}
    </li>
  );
}

/**
 * The signed paper a HUF needs on NSE, uploaded once it is registered there.
 * Files go straight to NSE (PDF, JPG, PNG or TIFF, up to 3 MB); only their
 * name, size and fingerprint are kept.
 */
export function HufDocuments({ huf }: { huf: HufDetail }): React.JSX.Element {
  return (
    <Card>
      <CardHeader
        title="Documents on NSE"
        subtitle={huf.canUploadDocuments ? 'Scans of signed paper: PDF, JPG, PNG or TIFF, up to 3 MB. Sent straight to NSE.' : 'Can be uploaded once the HUF is registered on NSE.'}
      />
      <CardBody>
        <ul className="space-y-4">
          {Documents.map((d) => (
            <DocumentRow key={d.kind} id={huf.id} huf={huf} {...d} />
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
