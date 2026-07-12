import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Phone as PhoneIcon, MessageCircle, BadgeCheck, Share2 } from "lucide-react";
import { PhoneScreen } from "@/components/app/PhoneScreen";
import { Button } from "@/components/ui/button";
import ListingCard from "@/components/app/ListingCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReviewsSection, ReviewModal } from "@/components/app/Reviews";
import { vendorApi, followApi, trustApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function VendorProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [trust, setTrust] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    trustApi.score(vendorId).then(({ data }) => setTrust(data)).catch(() => {});
  }, [vendorId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([vendorApi.get(vendorId), vendorApi.listings(vendorId)])
      .then(([v, ls]) => {
        if (!alive) return;
        setVendor(v.data);
        setFollowing(v.data.viewer_following);
        setFollowerCount(v.data.followers_count || 0);
        setListings(ls.data.items || []);
      })
      .catch(() => setVendor(null))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [vendorId]);

  const toggleFollow = async () => {
    if (!user) return navigate("/login");
    try {
      if (following) {
        const { data } = await followApi.unfollow(vendorId);
        setFollowing(false); setFollowerCount(data.followers_count);
      } else {
        const { data } = await followApi.follow(vendorId);
        setFollowing(true); setFollowerCount(data.followers_count);
      }
    } catch { toast.error("Failed"); }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: vendor?.name, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch {}
  };

  if (loading) {
    return (
      <PhoneScreen>
        <div className="p-6 space-y-4" data-testid="vendor-loading">
          <div className="h-24 w-24 rounded-full bg-white/5 animate-pulse mx-auto" />
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse mx-auto" />
        </div>
      </PhoneScreen>
    );
  }

  if (!vendor) {
    return (
      <PhoneScreen>
        <div className="p-8 text-center">
          <div className="text-4xl mb-2">🕳️</div>
          <div className="text-lg font-heading font-semibold">Vendor not found</div>
          <Button onClick={() => navigate("/browse")} className="mt-4 rounded-full btn-brand border-0">Browse listings</Button>
        </div>
      </PhoneScreen>
    );
  }

  const products = listings.filter((l) => l.type !== "service");
  const services = listings.filter((l) => l.type === "service");
  const reels = listings.filter((l) => l.reel?.url);
  const isVerified = vendor.kyc_status === "verified" || (vendor.kyc_status === "approved");
  const tierColor = {newcomer:"bg-white/10 text-white/70", trusted:"bg-blue-500/20 text-blue-300", "top-rated":"bg-green-500/20 text-green-300", elite:"bg-purple-500/20 text-purple-300"}[trust?.tier] || "bg-white/10 text-white/70";
  const waLink = vendor.phone ? `https://wa.me/91${vendor.phone}?text=${encodeURIComponent(`Hi ${vendor.name}, saw your listings on Emergent`)}` : null;

  return (
    <PhoneScreen>
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="glass rounded-full h-10 w-10 flex items-center justify-center" data-testid="vendor-back-btn">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={share} className="glass rounded-full h-10 w-10 flex items-center justify-center" data-testid="vendor-share-btn">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Header */}
      <div className="px-6 text-center" data-testid="vendor-header">
        <div className="mx-auto h-24 w-24 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-4xl">
          {(vendor.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <h1 className="font-heading text-2xl font-bold">{vendor.name || "Vendor"}</h1>
          {isVerified && <BadgeCheck className="h-5 w-5 text-blue-400" />}
        </div>
        <div className="mt-1 text-xs text-white/60">
          {t("vendor_profile.followers", { count: followerCount })} · {t("vendor_profile.listings", { count: vendor.listings_count })}
        </div>
        {trust && (
          <div className="mt-2 inline-flex items-center gap-2" data-testid="trust-chip">
            <span className={`text-[10px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${tierColor}`}>
              {trust.tier} · {trust.score}
            </span>
          </div>
        )}

        <div className="mt-5 flex gap-2 justify-center">
          {user?.id !== vendor.id && (
            <Button
              onClick={toggleFollow}
              data-testid="follow-toggle-btn"
              className={`rounded-full h-11 px-6 font-semibold border-0 ${following ? "bg-white/10 hover:bg-white/15 text-white" : "btn-brand"}`}
            >
              {following ? t("vendor_profile.following") : t("vendor_profile.follow")}
            </Button>
          )}
          <Button
            onClick={() => toast.info("Chat coming in Phase 3")}
            data-testid="vendor-chat-btn"
            variant="outline"
            className="rounded-full h-11 px-4 bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <MessageCircle className="h-4 w-4 mr-1" /> {t("vendor_profile.chat")}
          </Button>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer" data-testid="vendor-whatsapp-btn">
              <Button variant="outline" className="rounded-full h-11 px-4 bg-white/5 border-white/10 hover:bg-white/10 text-white">
                <PhoneIcon className="h-4 w-4 mr-1" /> {t("vendor_profile.whatsapp")}
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-8 pb-24" data-testid="vendor-tabs">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-full h-11">
            <TabsTrigger data-testid="tab-all" value="all" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">All</TabsTrigger>
            <TabsTrigger data-testid="tab-products" value="products" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">Products</TabsTrigger>
            <TabsTrigger data-testid="tab-services" value="services" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">Services</TabsTrigger>
            <TabsTrigger data-testid="tab-reels" value="reels" className="rounded-full data-[state=active]:bg-gradient-brand data-[state=active]:text-white">Reels</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4"><Grid items={listings} /></TabsContent>
          <TabsContent value="products" className="mt-4"><Grid items={products} /></TabsContent>
          <TabsContent value="services" className="mt-4"><Grid items={services} /></TabsContent>
          <TabsContent value="reels" className="mt-4"><Grid items={reels} /></TabsContent>
        </Tabs>
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">Ratings & Reviews</div>
            {user && user.id !== vendor.id && (
              <button onClick={() => setReviewOpen(true)} data-testid="write-review-btn" className="text-xs text-pink-300 hover:text-pink-200">Write a review</button>
            )}
          </div>
          <ReviewsSection targetType="vendor" targetId={vendor.id} />
        </div>
      </div>
      <ReviewModal open={reviewOpen} onOpenChange={setReviewOpen} targetType="vendor" targetId={vendor.id} />
    </PhoneScreen>
  );
}

function Grid({ items }) {
  if (!items?.length) {
    return <div className="glass rounded-2xl p-8 text-center text-white/60 text-sm">No listings yet.</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((l) => <ListingCard key={l.id} listing={l} />)}
    </div>
  );
}
