import { cn } from "@/lib/utils";

export function PhoneScreen({ children, className }) {
  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div
        className={cn(
          "w-full max-w-md min-h-screen relative border-x border-white/5 bg-black",
          className
        )}
        data-testid="phone-screen"
      >
        {children}
      </div>
    </div>
  );
}

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <div className="px-6 pt-8 pb-4 flex items-start justify-between">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-xs">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
