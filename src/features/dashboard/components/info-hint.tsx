import { Info } from 'lucide-react';

/** A small (i) that explains a figure on hover or focus. */
export function InfoHint({ text }: { text: string }): React.JSX.Element {
  return (
    <span title={text} aria-label={text} tabIndex={0} className="inline-flex cursor-help text-ink-muted outline-none focus-visible:text-brand">
      <Info className="size-3.5" />
    </span>
  );
}
