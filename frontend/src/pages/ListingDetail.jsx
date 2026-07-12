import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { ArrowLeft, Share2, MessageCircle, MapPin, Eye, Tag, Heart, Bookmark, BellRing, Sparkles } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/app/ListingCard";
import WatchListingModal from "@/components/app/WatchListingModal";
import { ReviewsSection } from "@/components/app/Reviews";
import { ReportButton } from "@/components/app/ReportModal";
import { BoostButton, BoostModal } from "@/components/app/BoostModal";
import { listingApi, seoApi, interactionApi, followApi, resolveMediaUrl, trackApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function fmtPrice(n) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n); }

const RECENT_KEY = "emergent_recent_viewed";
function pushRecent(item) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const filtered = list.filter((x) => x.slug !== item.slug);
    filtered.unshift({ slug: item.slug, title: item.title, image: item.images?.[0]?.url, price: item.offer_price || item.price });
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch {}
}

export default function ListingDetail() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saves, setSaves] = useState(0);
  const [following, setFollowing] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    setLoading(true); setError(null);
    Promise.all([listingApi.bySlug(slug), seoApi.listing(slug).catch(() => ({ data: null }))])
      .then(([lRes, seoRes]) => {
        const l = lRes.data;
        setListing(l);
        setSeo(seoRes?.data);
        setLikes(l.likes_count || 0);
        setSaves(l.saves_count || 0);
        setLiked(l.viewer_state?.liked || false);
        setSaved(l.viewer_state?.saved || false);
        pushRecent(l);
        // Related (same category)
        if (l.category_id) {
          listingApi.list({ category_id: l.category_id, limit: 7 })
            .then(({ data }) => setRelated((data.items || []).filter((x) => x.id !== l.id).slice(0, 6)));
        }
      })
      .catch((err) => setError(err?.response?.data?.detail || "Not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    if (listing?.id) { try { trackApi.listing(listing.id, "share").catch(() => {}); } catch {} }
    if (navigator.share) { try { await navigator.share({ title: listing?.title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch {}
  };

  const clickWA = () => {
    if (listing?.id) { try { trackApi.listing(listing.id, "wa_click").catch(() => {}); } catch {} }
  };

  useEffect(() => {
    if (listing && searchParams.get("open_boost") === "1" && user && listing.vendor && user.id === listing.vendor.id) {
      setBoostOpen(true);
    }
  }, [listing, searchParams, user]);

  const requireAuth = () => {
    if (!user) { setWatchOpen(true); return true; }
    return false;
  };

  const toggleLike = async () => {
    if (requireAuth()) return;
    setLiked((v) => !v); setLikes((n) => n + (liked ? -1 : 1));
    try { const { data } = await interactionApi.toggleLike(listing.id); setLiked(data.active); setLikes(data.count); } catch { setLiked(!liked); }
  };
  const toggleSave = async () => {
    if (requireAuth()) return;
    setSaved((v) => !v); setSaves((n) => n + (saved ? -1 : 1));
    try { const { data } = await interactionApi.toggleSave(listing.id); setSaved(data.active); setSaves(data.count); } catch { setSaved(!saved); }
  };
  const toggleFollow = async () => {
    if (!user) return navigate("/login");
    try {
      if (following) { await followApi.unfollow(listing.vendor.id); setFollowing(false); }
      else { await followApi.follow(listing.vendor.id); setFollowing(true); }
    } catch { toast.error("Failed"); }
  };

  if (loading) {
    return (
      <PhoneScreen>
        <div className="px-6 pt-8" data-testid="listing-detail-loading">
          <div className="h-4 w-16 bg-white/10 rounded animate-pulse mb-6" />
          <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
          <div className="mt-4 h-6 w-3/4 bg-white/10 rounded animate-pulse" />
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
          <Button onClick={() => navigate("/browse")} className="mt-4 rounded-full btn-brand border-0">Browse listings</Button>
        </div>
      </PhoneScreen>
    );
  }

  const hasOffer = listing.offer_price != null && listing.offer_price < listing.price;
  const activeImg = listing.images?.[imgIdx];
  const isAnon = !user;

  return (
    <PhoneScreen>
      {seo && (
        <Helmet>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          {seo.image ? <meta property="og:image" content={resolveMediaUrl(seo.image)} /> : null}
          <meta property="og:url" content={seo.url} />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
      )}

      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="glass rounded-full h-10 w-10 flex items-center justify-center" data-testid="listing-back-btn"><ArrowLeft className="h-4 w-4" /></button>
        <button onClick={share} className="glass rounded-full h-10 w-10 flex items-center justify-center" data-testid="listing-share-btn"><Share2 className="h-4 w-4" /></button>
      </div>

      {/* Media */}
      <div className="px-6" data-testid="listing-media">
        {listing.reel?.url ? (
          <div className="aspect-[9/16] max-h-[560px] rounded-2xl overflow-hidden bg-white/5">
            <video data-testid="listing-reel" src={resolveMediaUrl(listing.reel.url)} className="w-full h-full object-cover" controls autoPlay muted playsInline loop />
          </div>
        ) : activeImg ? (
          <div className="aspect-square rounded-2xl overflow-hidden bg-white/5">
            <img src={resolveMediaUrl(activeImg.url)} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square rounded-2xl bg-white/5 flex items-center justify-center text-5xl text-white/20">📦</div>
        )}
        {listing.images?.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto -mx-6 px-6">
            {listing.images.map((im, i) => (
              <button key={im.public_id || i} onClick={() => setImgIdx(i)} className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border ${i === imgIdx ? "border-pink-500" : "border-white/10"}`}>
                <img src={resolveMediaUrl(im.url)} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 mt-5 space-y-6 pb-24">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date() && (
              <span data-testid="sponsored-badge" className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                <Sparkles className="h-3 w-3" /> Sponsored
              </span>
            )}
          </div>
          <h1 className="font-heading text-2xl font-bold leading-tight" data-testid="listing-title">{listing.title}</h1>
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
                Negotiable
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {listing.views_count || 0} views</span>
            <span>·</span>
            <span>{listing.category?.name}{listing.sub_category?.name ? ` · ${listing.sub_category.name}` : ""}</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2" data-testid="listing-action-bar">
          <Button onClick={toggleLike} data-testid="listing-like-btn" variant="outline" className={`rounded-full h-11 flex-1 border-white/10 hover:bg-white/10 ${liked ? "bg-pink-500/15 text-pink-300" : "bg-white/5 text-white"}`}>
            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-pink-500" : ""}`} /> {likes}
          </Button>
          <Button onClick={toggleSave} data-testid="listing-save-btn" variant="outline" className={`rounded-full h-11 flex-1 border-white/10 hover:bg-white/10 ${saved ? "bg-white/15" : "bg-white/5"} text-white`}>
            <Bookmark className={`h-4 w-4 mr-1 ${saved ? "fill-white" : ""}`} /> {saves}
          </Button>
          <Button onClick={share} data-testid="listing-share-inline-btn" variant="outline" className="rounded-full h-11 flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white">
            <Share2 className="h-4 w-4 mr-1" /> Share
          </Button>
        </div>

        {/* Owner-only boost bar */}
        {user && listing.vendor && user.id === listing.vendor.id && (
          <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3" data-testid="owner-boost-bar">
            <div>
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">Boost your reach</div>
              <div className="text-sm mt-0.5">
                {listing.boost_expires_at && new Date(listing.boost_expires_at) > new Date()
                  ? `Active until ${new Date(listing.boost_expires_at).toLocaleDateString()}`
                  : "Not boosted"}
              </div>
            </div>
            <BoostButton listing={listing} onBoosted={() => listingApi.bySlug(slug).then(({ data }) => setListing(data))} />
          </div>
        )}

        {/* Report anyone can report */}
        {user && listing.vendor && user.id !== listing.vendor.id && (
          <div className="flex justify-end -mt-2" data-testid="listing-report-row">
            <ReportButton targetType="listing" targetId={listing.id} />
          </div>
        )}

        {/* Anon soft-gate */}
        {isAnon && (
          <button
            type="button"
            onClick={() => setWatchOpen(true)}
            data-testid="watch-listing-btn"
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-white/10"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-brand flex items-center justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-heading font-semibold">Watch this listing</div>
              <div className="text-xs text-white/60">Get an SMS on price drop or when the vendor updates.</div>
            </div>
          </button>
        )}

        {/* Vendor */}
        {listing.vendor && (
          <div className="glass rounded-2xl p-4 flex items-center gap-3" data-testid="vendor-card">
            <Link to={`/vendor/${listing.vendor.id}`} className="h-12 w-12 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-lg">
              {(listing.vendor.name || "?").charAt(0).toUpperCase()}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/50">Posted by</div>
              <Link to={`/vendor/${listing.vendor.id}`} className="font-semibold truncate hover:underline">{listing.vendor.name || "Vendor"}</Link>
            </div>
            {user && user.id !== listing.vendor.id && (
              <Button onClick={toggleFollow} data-testid="follow-vendor-btn" size="sm" className={`rounded-full border-0 ${following ? "bg-white/10 hover:bg-white/15" : "btn-brand"}`}>
                {following ? "Following" : "Follow"}
              </Button>
            )}
            <Button onClick={async () => {
              if (!user) return navigate("/login");
              try {
                const { data } = await import("@/lib/api").then(m => m.chatApi.createThread({
                  peer_user_id: listing.vendor.id,
                  context_type: "listing",
                  context_id: listing.id,
                }));
                navigate(`/chat/${data.id}`);
              } catch { toast.error("Could not open chat"); }
            }} data-testid="chat-vendor-btn" size="sm" className="rounded-full btn-brand border-0">
              <MessageCircle className="h-4 w-4 mr-1" />Chat
            </Button>
          </div>
        )}

        {listing.description && (
          <section>
            <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Description</h3>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed" data-testid="listing-description">{listing.description}</p>
          </section>
        )}

        <section>
          <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Details</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm" data-testid="listing-specs">
            <Spec label="Condition" value={listing.condition} />
            <Spec label="Warranty" value={listing.warranty} />
            <Spec label="Stock" value={listing.stock != null ? String(listing.stock) : null} />
            <Spec label="Charges type" value={listing.service_charges_type} />
            <Spec label="Experience" value={listing.experience_years ? `${listing.experience_years} yrs` : null} />
            <Spec label="Service area" value={listing.service_area_km ? `${listing.service_area_km} km` : null} />
          </dl>
        </section>

        <section>
          <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Location</h3>
          <div className="glass rounded-2xl p-4 flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-1 text-pink-300" />
            <div className="text-sm">
              <div>{listing.location.area}, {listing.location.city}</div>
              <div className="text-white/50 text-xs mt-0.5">{listing.location.state ? `${listing.location.state} · ` : ""}{listing.location.pincode}</div>
            </div>
          </div>
        </section>

        {listing.tags?.length > 0 && (
          <section>
            <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/80">
                  <Tag className="h-3 w-3" /> {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section data-testid="related-section">
            <h3 className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">You may also like</h3>
            <div className="grid grid-cols-2 gap-3">
              {related.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {listing.vendor && <ReviewsSection targetType="vendor" targetId={listing.vendor.id} />}
      </div>

      <WatchListingModal open={watchOpen} onOpenChange={setWatchOpen} listingId={listing.id} />
      <BoostModal open={boostOpen} onOpenChange={setBoostOpen} listing={listing} onBoosted={() => listingApi.bySlug(slug).then(({ data }) => setListing(data))} />
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
