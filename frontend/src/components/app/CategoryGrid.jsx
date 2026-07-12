import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function CategoryGrid({ categories, activeSlug, onSelect }) {
  if (!categories?.length) return null;
  return (
    <div className="grid grid-cols-4 gap-2" data-testid="category-grid">
      {categories.map((c) => {
        const active = activeSlug === c.slug;
        const inner = (
          <div
            className={cn(
              "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 p-2 transition-colors",
              active
                ? "border-pink-500/60 bg-pink-500/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            <div className="text-2xl leading-none">{c.icon_url || "🗂️"}</div>
            <div className="text-[10px] font-medium text-white/80 text-center leading-tight line-clamp-2 px-1">
              {c.name}
            </div>
          </div>
        );
        if (onSelect) {
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              data-testid={`category-tile-${c.slug}`}
              className="text-left"
            >
              {inner}
            </button>
          );
        }
        return (
          <Link
            key={c.id}
            to={`/browse/${c.slug}`}
            data-testid={`category-tile-${c.slug}`}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
