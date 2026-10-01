import { BrandMark } from '@/components/layout/brand-mark';

type PhonePreviewProps = {
  title: string;
  body: string;
  deepLink: string;
};

/** How the message lands on a locked phone. Copy that reads fine in a text
 *  field often does not survive two lines on a lock screen. */
export function PhonePreview({ title, body, deepLink }: PhonePreviewProps): React.JSX.Element {
  return (
    <div className="rounded-[26px] border-[6px] border-navy bg-navy p-1 shadow-[0_16px_40px_rgba(11,21,36,0.24)]">
      <div
        className="relative overflow-hidden rounded-[20px] px-3 pt-10 pb-16"
        style={{ background: 'radial-gradient(120% 90% at 20% 0%, #0160c2 0%, #020b1b 65%)' }}
      >
        <div className="absolute top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-navy" />

        <p className="mb-1 text-center text-[11px] tracking-[0.06em] text-white/50 uppercase">Monday 3 September</p>
        <p className="mb-5 text-center text-[34px] leading-none font-light text-white">09:41</p>

        <div className="rounded-2xl bg-white/12 p-3 backdrop-blur-md">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="flex size-4 items-center justify-center rounded-[5px] bg-white">
              <BrandMark size={12} />
            </span>
            <span className="text-[10.5px] font-medium tracking-[0.04em] text-white/70 uppercase">RiSips</span>
            <span className="ml-auto text-[10.5px] text-white/50">now</span>
          </div>

          <p className="text-[13px] leading-snug font-semibold text-white">
            {title.trim().length > 0 ? title : 'Notification title'}
          </p>
          <p className="mt-0.5 line-clamp-3 text-[12px] leading-snug text-white/75">
            {body.trim().length > 0 ? body : 'The message body appears here, trimmed after about three lines.'}
          </p>
        </div>

        <p className="mt-3 truncate text-center text-[10.5px] text-white/40">Opens {deepLink}</p>
      </div>
    </div>
  );
}
