import {
  Lockup,
  LogoColors,
  MarkPath,
  MarkPoint,
  MarkViewBox,
  WordmarkAspectRatio,
  WordmarkBodyPath,
  WordmarkDotsPath,
  WordmarkViewBox,
} from '@/components/layout/logo-geometry';
import { cn } from '@/utils/cn';

/**
 * The RiSips logo, drawn from the brand sheet's data (`logo-geometry.ts`,
 * shared with the mobile app and the website) rather than redrawn here.
 *
 * Two tones only, as on the sheet: blue on paper, and white on blue. The point
 * and the i-dots stay yellow on both.
 */
type MarkTone = 'brand' | 'inverse';

const Ink: Record<MarkTone, string> = { brand: LogoColors.blue, inverse: '#ffffff' };

/** The square mark alone — favicons, the collapsed rail, small places. */
export function BrandMark({ size = 28, tone = 'brand', className }: { size?: number; tone?: MarkTone; className?: string }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox={MarkViewBox} className={cn('shrink-0', className)} aria-hidden="true">
      <path d={MarkPath} fill={Ink[tone]} />
      <circle cx={MarkPoint.x} cy={MarkPoint.y} r={MarkPoint.radius} fill={LogoColors.yellow} />
    </svg>
  );
}

/** "risips" in the brand lettering, sized by height. */
export function BrandWordmark({ height = 22, tone = 'brand', className }: { height?: number; tone?: MarkTone; className?: string }): React.JSX.Element {
  return (
    <svg
      height={height}
      width={height * WordmarkAspectRatio}
      viewBox={WordmarkViewBox}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="RiSips"
    >
      <path d={WordmarkBodyPath} fill={Ink[tone]} />
      <path d={WordmarkDotsPath} fill={LogoColors.yellow} />
    </svg>
  );
}

/** Mark and wordmark together, spaced as on the sheet. */
export function BrandLogo({ height = 28, tone = 'brand', className }: { height?: number; tone?: MarkTone; className?: string }): React.JSX.Element {
  return (
    <svg
      height={height}
      width={height * Lockup.aspectRatio}
      viewBox={Lockup.viewBox}
      className={cn('shrink-0', className)}
      role="img"
      aria-label="RiSips"
    >
      <g transform={`scale(${Lockup.markScale})`}>
        <path d={MarkPath} fill={Ink[tone]} />
        <circle cx={MarkPoint.x} cy={MarkPoint.y} r={MarkPoint.radius} fill={LogoColors.yellow} />
      </g>
      <g transform={Lockup.wordmarkTransform}>
        <path d={WordmarkBodyPath} fill={Ink[tone]} />
        <path d={WordmarkDotsPath} fill={LogoColors.yellow} />
      </g>
    </svg>
  );
}

/** The sign-in screens' logo: the lockup, with which product this is beneath it. */
export function BrandLockup({ tone = 'brand', className }: { tone?: MarkTone; className?: string }): React.JSX.Element {
  return (
    <span className={cn('flex flex-col items-start gap-1.5', className)}>
      <BrandLogo height={34} tone={tone} />
      <span className="text-[10.5px] tracking-[0.12em] uppercase opacity-60">Admin Portal</span>
    </span>
  );
}
