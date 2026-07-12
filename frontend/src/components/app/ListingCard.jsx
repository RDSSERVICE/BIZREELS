import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { resolveMediaUrl } from "@/lib/api";

function fmtPrice(n) {
  if (n == null) return "";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export default function ListingCard({ listing }) {
  const cover = listing.images?.[0]?.url;
  const hasOffer = listing.offer_price != null && listing.offer_price < listing.price;
  return (
    <Link
      to={`/listing/${listing.slug}`}
      className="block group"
      data-testid={`listing-card-${listing.slug}`}
    >
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/5 relative">
        {cover ? (
          <img
            src={resolveMediaUrl(cover)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-white/20">
            📦
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-black/80" />
        {listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && (
          <span data-testid={`sponsored-${listing.slug}`} className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-yellow-400/90 text-black border border-yellow-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Sponsored
          </span>
        )}
        {listing.is_negotiable && !listing.boost_expires_at && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-white border border-white/15">
            Negotiable
          </span>
        )}
        {listing.status === "sold" && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-red-500/80 text-white">
            Sold
          </span>
        )}
        {listing.status === "paused" && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-yellow-500/80 text-black">
            Paused
          </span>
        )}
      </div>
      <div className="mt-2 px-1">
        <div className="text-sm font-heading font-semibold truncate">{listing.title}</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          {hasOffer ? (
            <>
              <span className="text-base font-bold">₹{fmtPrice(listing.offer_price)}</span>
              <span className="text-xs text-white/40 line-through">₹{fmtPrice(listing.price)}</span>
            </>
          ) : (
            <span className="text-base font-bold">₹{fmtPrice(listing.price)}</span>
          )}
        </div>
        {listing.location && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-white/50 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {listing.location.area}, {listing.location.city}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
