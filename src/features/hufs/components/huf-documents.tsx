'use client';

import { CheckCircle2, Circle, ExternalLink, FileText, Loader2, Upload, XCircle } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { uploadHufDocument, type HufActionState } from '@/features/hufs/actions';
import { RegistrarLabel, RegistrarTone } from '@/features/hufs/labels';
import type { HufDetail, HufDocumentKind, HufFile } from '@/types/admin-api.types';

/** What each document is and why, worded for a company or a HUF. */
const documentsFor = (company: boolean): { kind: HufDocumentKind; title: string; why: string }[] => (company ? [
  {
    kind: 'AOF',
    title: 'Account opening form (AOF), signed by the authorised signatory',
    why: "Needed before the company can invest: NSE refuses its orders without it (\"AOF IMAGE IS NOT PRESENT OR NOT VALID OR NOT VERIFIED\"), and a company can't have an eLog. Signed with the company stamp; the board resolution and signatory list go with it.",
  },
  {
    kind: 'FATCA_FORM',
    title: 'FATCA / CRS and UBO declaration, signed by the authorised signatory',
    why: "NSE's FATCA form for a non-individual, listing the beneficial owners. Backs up the FATCA declaration already sent; NSE won't take an order until a registrar accepts it.",
  },
  {
    kind: 'CANCELLED_CHEQUE',
    title: "Cancelled cheque of the company's current account",
    why: "Only if NSE's bank check fails. It must show the company's name, account number and IFSC.",
  },
] : [
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
]);

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

/**
 * Why NSE already has this document (or doesn't need it), whatever way it got there, or null. An AOF counts once a
 * registrar has accepted it and none has rejected it, even when it was uploaded on NSE's portal; a cancelled cheque
 * isn't needed once NSE's bank check has passed.
 */
function settledOnNse(kind: HufDocumentKind, huf: HufDetail): string | null {
  const aof = huf.nse?.aof;
  if (kind === 'AOF' && aof) {
    const rejected = aof.cams.status === 'REJECTED' || aof.kfin.status === 'REJECTED';
    if (!rejected && (aof.cams.status === 'ACCEPTED' || aof.kfin.status === 'ACCEPTED')) return 'Already on NSE: nothing to upload.';
  }
  if (kind === 'CANCELLED_CHEQUE' && huf.nse?.bankStatus?.toUpperCase() === 'ACTIVE') {
    return "Not needed: NSE's bank check has passed.";
  }
  return null;
}

const sizeText = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Every file uploaded for one document, newest first, each opening in a new tab exactly as it was sent to NSE. */
function UploadedFiles({ id, files }: { id: string; files: HufFile[] }): React.JSX.Element | null {
  if (!files.length) return null;
  return (
    <ul className="space-y-1.5 pt-1">
      {files.map((f, i) => (
        <li key={f.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
          <FileText className="size-3.5 shrink-0 text-ink-muted" />
          <a
            href={`/onboarding/hufs/${id}/documents/${f.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-deep"
          >
            {f.originalName || f.fileName}
            <ExternalLink className="size-3" />
          </a>
          <span className="text-ink-muted">
            {sizeText(f.bytes)} · {new Date(f.uploadedAt).toLocaleString('en-IN')}
            {f.uploadedBy ? ` · ${f.uploadedBy}` : ''}
          </span>
          <Badge tone={f.ok ? 'success' : 'danger'}>{f.ok ? (i === 0 ? 'Latest, accepted by NSE' : 'Accepted by NSE') : 'Refused by NSE'}</Badge>
          {!f.ok && f.remark ? <span className="basis-full pl-5.5 text-ink-soft">{f.remark}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function DocumentRow({ id, kind, title, why, huf }: { id: string; kind: HufDocumentKind; title: string; why: string; huf: HufDetail }): React.JSX.Element {
  const [state, action] = useActionState(uploadHufDocument, { error: null } as HufActionState);
  const doc = huf.documents[kind];
  const files = (huf.files ?? []).filter((f) => f.kind === kind);
  const settled = settledOnNse(kind, huf);
  const done = Boolean(doc?.ok) || settled !== null;
  const Icon = done ? CheckCircle2 : doc ? XCircle : Circle;
  return (
    <li className="space-y-2 border-b border-line pb-4 last:border-b-0 last:pb-0">
      <div className="flex gap-3">
        <Icon className={`mt-0.5 size-4.5 shrink-0 ${done ? 'text-success' : doc ? 'text-danger' : 'text-ink-muted'}`} />
        <div className="min-w-0 space-y-1">
          <p className="text-[13.5px] font-medium text-ink">{title}</p>
          <p className="text-[12.5px] text-ink-muted">{why}</p>
          {settled ? <p className="text-[12.5px] font-medium text-success">{settled}</p> : null}
          {doc && !files.length ? (
            <p className="text-[12.5px] text-ink-soft">
              {doc.ok ? 'Accepted by NSE' : `NSE refused it: ${doc.remark ?? doc.status}`} · {new Date(doc.uploadedAt).toLocaleString('en-IN')} ·{' '}
              {(doc.bytes / 1024).toFixed(0)} KB · uploaded before files were kept, so it can't be opened here
            </p>
          ) : null}
          <UploadedFiles id={id} files={files} />
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
      {/* Nothing to upload once NSE has it (or no longer needs it); a rejected or missing one can be sent again. */}
      {huf.canUploadDocuments && !done ? (
        <form action={action} className="flex flex-wrap items-center gap-2 pl-7.5">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="kind" value={kind} />
          <input
            type="file"
            name="file"
            required
            accept={kind === 'CANCELLED_CHEQUE' ? 'application/pdf,image/jpeg,image/png,image/tiff' : 'application/pdf,image/jpeg,image/tiff'}
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
 * Files go straight to NSE (PDF, JPG or TIFF; a cheque may also be PNG; up to 3 MB). A sealed copy of each is kept,
 * so staff can open what was sent.
 */
export function HufDocuments({ huf }: { huf: HufDetail }): React.JSX.Element {
  return (
    <Card>
      <CardHeader
        title="Documents on NSE"
        subtitle={huf.canUploadDocuments ? 'Scans of signed paper: PDF, JPG or TIFF (a cheque may also be PNG), up to 3 MB. Sent straight to NSE.' : `Can be uploaded once the ${huf.entityType === 'COMPANY' ? 'company' : 'HUF'} is registered on NSE.`}
      />
      <CardBody>
        <ul className="space-y-4">
          {documentsFor(huf.entityType === 'COMPANY').map((d) => (
            <DocumentRow key={d.kind} id={huf.id} huf={huf} {...d} />
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
