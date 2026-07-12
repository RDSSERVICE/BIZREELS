import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Share2, MessageCircle, MapPin, Eye, Tag } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import { listingApi, resolveMediaUrl } from "@/lib/api";

function fmtPrice(n) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export default function ListingDetail() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listingApi.bySlug(slug)
      .then(({ data }) => setListing(data))
      .catch((err) => setError(err?.response?.data?.detail || "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    const shareData = { title: listing?.title, text: listing?.description, url };
    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch { toast.error("Could not copy link"); }
  };

  if (loading) {
    return (
      <PhoneScreen>
        <div className="px-6 pt-8" data-testid="listing-detail-loading">
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mb-6" />
          <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          <div className="mt-4 h-6 w-3/4 bg-white/10 rounded animate-pulse" />
          <div className="mt-2 h-4 w-1/2 bg-white/10 rounded animate-pulse" />
        </div>
      </PhoneScreen>
    );
  }

  if (error || !listing) {
    return (
      <PhoneScreen>
        <div className="px-6 pt-16 text-center" data-testid="listing-detail-error">
          <div className="text-4xl mb-2">🕳️</div>
          <div className="text-lg font-heading font-semibold">Listing not found</div>
          <Button onClick={() => navigate("/browse")} className="mt-4 rounded-full btn-brand border-0">
            Browse listings
          </Button>
        </div>
      </PhoneScreen>
    );
  }

  const hasOffer = listing.offer_price != null && listing.offer_price < listing.price;
  const activeImg = listing.images?.[imgIdx];

  return (
    <PhoneScreen>
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="glass rounded-full h-10 w-10 flex items-center justify-center"
          data-testid="listing-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={share}
          className="glass rounded-full h-10 w-10 flex items-center justify-center"
          data-testid="listing-share-btn"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Media */}
      <div className="px-6" data-testid="listing-media">
        {listing.reel?.url ? (
          <div className="aspect-[9/16] max-h-[560px] rounded-2xl overflow-hidden bg-white/5">
            <video
              data-testid="listing-reel"
              src={resolveMediaUrl(listing.reel.url)}
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
              playsInline
              loop
            />
          </div>
        ) : activeImg ? (
          <div className="aspect-square rounded-2xl overflow-hidden bg-white/5">
            <img src={resolveMediaUrl(activeImg.url)} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square rounded-2xl bg-white/5 flex items-center justify-center text-5xl text-white/20">
            📦
          </div>
        )}
        {listing.images?.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto -mx-6 px-6" data-testid="listing-thumbnails">
            {listing.images.map((im, i) => (
              <button
                key={im.public_id || i}
                onClick={() => setImgIdx(i)}
                className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border ${
                  i === imgIdx ? "border-pink-500" : "border-white/10"
                }`}
              >
                <img src={resolveMediaUrl(im.url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 mt-5 space-y-6 pb-24">
        <div>
          <h1 className="font-heading text-2xl font-bold leading-tight" data-testid="listing-title">
            {listing.title}
          </h1>
          <div className="mt-2 flex items-center flex-wrap gap-3">
            {hasOffer ? (
              <>
                <span className="text-2xl font-bold" data-testid="listing-price">₹{fmtPrice(listing.offer_price)}</span>
                <span className="text-sm text-white/50 line-through">₹{fmtPrice(listing.price)}</span>
              </>
            ) : (
              <span className="text-2xl font-bold" data-testid="listing-price">₹{fmtPrice(listing.price)}</span>
            )}
            {listing.is_negotiable && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/30">
                {t("listing.negotiable")}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> {t("listing.views", { count: listing.views_count || 0 })}
            </span>
            <span>·</span>
            <span>{listing.category?.name}{listing.sub_category?.name ? ` · ${listing.sub_category.name}` : ""}</span>
          </div>
        </div>

        {/* Vendor */}
        {listing.vendor && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3" data-testid="vendor-card">
            <div className="h-12 w-12 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-lg">
              {(listing.vendor.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50">{t("listing.posted_by")}</div>
              <div className="font-semibold truncate">{listing.vendor.name || "Vendor"}</div>
            </div>
            <Button
              data-testid="chat-vendor-btn"
              onClick={() => toast.info(t("listing.chat_coming_soon"))}
              className="rounded-full btn-brand border-0"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {t("listing.chat_vendor")}
            </Button>
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <section>
            <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
              {t("listing.description")}
            </h3>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed" data-testid="listing-description">
              {listing.description}
            </p>
          </section>
        )}

        {/* Specs */}
        <section>
          <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
            {t("listing.specs")}
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="listing-specs">
            <Spec label={t("listing.condition")} value={listing.condition} />
            <Spec label={t("listing.warranty")} value={listing.warranty} />
            <Spec label={t("listing.stock")} value={listing.stock != null ? String(listing.stock) : null} />
            <Spec label={t("listing.service_charges_type")} value={listing.service_charges_type} />
            <Spec label={t("listing.experience_years")} value={listing.experience_years ? `${listing.experience_years} yrs` : null} />
            <Spec label={t("listing.service_area_km")} value={listing.service_area_km ? `${listing.service_area_km} km` : null} />
          </dl>
        </section>

        {/* Location */}
        <section>
          <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
            {t("listing.location")}
          </h3>
          <div className="glass rounded-2xl p-4 flex items-start gap-3" data-testid="listing-location">
            <MapPin className="h-4 w-4 mt-1 text-pink-300" />
            <div className="text-sm">
              <div>{listing.location.area}, {listing.location.city}</div>
              <div className="text-white/50 text-xs mt-0.5">
                {listing.location.state ? `${listing.location.state} · ` : ""}
                {listing.location.pincode}
              </div>
              {listing.location.address && (
                <div className="text-white/60 text-xs mt-1">{listing.location.address}</div>
              )}
            </div>
          </div>
        </section>

        {/* Tags */}
        {listing.tags?.length > 0 && (
          <section>
            <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
              {t("listing.tags")}
            </h3>
            <div className="flex flex-wrap gap-2" data-testid="listing-tags">
              {listing.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="pt-2">
          <Link to="/browse" className="text-sm text-pink-300 hover:text-pink-200">
            ← Back to browse
          </Link>
        </div>
      </div>
    </PhoneScreen>
  );
}

function Spec({ label, value }) {
  if (!value) return null;
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] text-white/50 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium mt-0.5 capitalize">{String(value).replace(/_/g, " ")}</div>
    </div>
  );
}
