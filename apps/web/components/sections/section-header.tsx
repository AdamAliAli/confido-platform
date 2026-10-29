// Shared heading row for the expertise list and About introduction.
export function SectionHeader({ label, title, accent, headingId, padded = true }: {
  label: string; title: string; accent: string; headingId: string; padded?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-10 md:flex-row md:items-start md:justify-between ${padded ? 'px-6 py-[90px] md:px-[50px]' : ''}`}>
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em]">
        <span className="h-2 w-2 bg-mint" aria-hidden="true" />{label}
      </div>
      <h2 id={headingId} className="min-w-0 break-words text-right text-[clamp(40px,4vw,64px)] font-light leading-tight tracking-[-0.04em]">
        <span className="block">{title}</span>
        <span className="block font-semibold text-mint">{accent}</span>
      </h2>
    </div>
  );
}
