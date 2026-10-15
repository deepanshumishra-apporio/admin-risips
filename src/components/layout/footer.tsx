const Links = [
  'Support',
  'System status',
  'Careers',
  'Terms of use',
  'Report an issue',
  'Privacy policy',
];

export function Footer(): React.JSX.Element {
  return (
    <footer className="mt-auto border-t border-line bg-chrome">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-4">
        {Links.map((link) => (
          <button
            key={link}
            type="button"
            className="text-[12.5px] text-ink-soft transition-colors hover:text-brand"
          >
            {link}
          </button>
        ))}
        <span className="text-[12.5px] text-ink-muted">
          AMFI registered distributor · © 2026 RiSips
        </span>
      </div>
    </footer>
  );
}
