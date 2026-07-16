import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Smartphone, Shirt, Sofa, Car, Home, 
  Wrench, Utensils, Scissors, Dumbbell, BookOpen, FolderOpen 
} from "lucide-react";

// Mapping category slugs to actual vector Lucide icons instead of emojis
const iconMap = {
  'electronics': Smartphone,
  'fashion': Shirt,
  'home-furniture': Sofa,
  'vehicles': Car,
  'real-estate': Home,
  'services': Wrench,
  'food-grocery': Utensils,
  'beauty-salon': Scissors,
  'health-fitness': Dumbbell,
  'education-coaching': BookOpen
};

export default function CategoryGrid({ categories, activeSlug, onSelect }) {
  if (!categories?.length) return null;
  return (
    <div className="grid grid-cols-4 gap-2" data-testid="category-grid">
      {categories.map((c) => {
        const active = activeSlug === c.slug;
        const IconComponent = iconMap[c.slug] || FolderOpen;
        const inner = (
          <div
            className={cn(
              "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1.5 p-2 transition-all duration-300 group cursor-pointer",
              active
                ? "border-pink-500/60 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95"
            )}
          >
            <div className={cn(
              "flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-300",
              active ? "bg-pink-500/20" : "bg-white/5 group-hover:bg-white/10"
            )}>
              <IconComponent 
                className={cn(
                  "h-4 w-4 transition-all duration-300",
                  active ? "text-pink-500 scale-110" : "text-white/60 group-hover:text-white group-hover:scale-110"
                )} 
              />
            </div>
            <div className="text-[10px] font-medium text-white/80 text-center leading-tight line-clamp-2 px-1 transition-colors group-hover:text-white">
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
