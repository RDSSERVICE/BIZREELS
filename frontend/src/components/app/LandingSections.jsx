import { Star, Award } from "lucide-react";
import FastRespondersPanel from "@/components/app/FastRespondersPanel";

const CATEGORIES = [
  { name: "Electronics", emoji: "📱" },
  { name: "Fashion", emoji: "👗" },
  { name: "Home", emoji: "🏠" },
  { name: "Vehicles", emoji: "🚗" },
  { name: "Real Estate", emoji: "🏢" },
  { name: "Services", emoji: "🛠️" },
  { name: "Food", emoji: "🍱" },
  { name: "Beauty", emoji: "💄" },
  { name: "Health", emoji: "💪" },
  { name: "Education", emoji: "📚" },
];

const TESTIMONIALS = [
  { name: "Rahul S.", city: "Delhi", text: "Sold my old MacBook in 2 hours flat. Buyer was 3km away, dealt on chat, done.", rating: 5 },
  { name: "Priya P.", city: "Mumbai", text: "As a wedding photographer, Emergent brings me 3-4 leads a week. Way better than referrals.", rating: 5 },
  { name: "Anjali M.", city: "Bengaluru", text: "Verified badge + trust score made me trust the vendor immediately. Bought a used Royal Enfield.", rating: 5 },
  { name: "Vikram R.", city: "Hyderabad", text: "Reel discovery is 🔥 — found my AC repair vendor by watching a 15-sec video.", rating: 4 },
];

const PRESS_LOGOS = ["TechCrunch India", "YourStory", "Inc42", "ET Panache"];

export function CategoryShowcase() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6" data-testid="landing-categories">
      <h2 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">Explore categories</h2>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {CATEGORIES.map((c) => (
          <div key={c.name} className="glass rounded-2xl p-3 text-center hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-2xl mb-1">{c.emoji}</div>
            <div className="text-[10px] md:text-xs text-white/70">{c.name}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6" data-testid="landing-testimonials">
      <h2 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
        <Award className="h-3.5 w-3.5 text-yellow-300" /> Real stories from real users
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="glass rounded-2xl p-4" data-testid={`testimonial-${i}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-xs">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{t.name} <span className="text-white/50 text-xs font-normal">· {t.city}</span></div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`h-3 w-3 ${j < t.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-white/80">{t.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CityChampions() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6" data-testid="landing-city-champions">
      <h2 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-3">City champions this week</h2>
      <FastRespondersPanel city={null} limit={4} />
    </section>
  );
}

export function PressLogos() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-4" data-testid="landing-press-logos">
      <div className="text-[10px] text-white/40 uppercase tracking-widest text-center mb-2">As featured in</div>
      <div className="flex items-center justify-around gap-2 opacity-60">
        {PRESS_LOGOS.map((p) => (
          <span key={p} className="text-xs font-heading font-semibold text-white/70">{p}</span>
        ))}
      </div>
    </section>
  );
}
