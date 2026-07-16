import RoleSwitcherChip from "@/components/app/RoleSwitcherChip";

/**
 * ScreenHeader Component
 * Renders consistent titles, subtitles, and actions at the top of pages,
 * including a responsive role switcher chip.
 */
export default function ScreenHeader({ title, subtitle, right }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-3xl lg:text-4xl font-bold tracking-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-lg">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <RoleSwitcherChip />
        {right}
      </div>
    </div>
  );
}
