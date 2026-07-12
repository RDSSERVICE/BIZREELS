import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Bookmark, Share2, Volume2, VolumeX, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import { interactionApi, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * A single vertical reel item. Autoplays muted, taps to mute/unmute.
 * Right-hand action rail: like, save, share, chat.
 */
export default function ReelItem({ listing, videoRef, onOpenLogin }) {
  const { user } = useAuth();
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(listing.viewer_state?.liked || false);
  const [saved, setSaved] = useState(listing.viewer_state?.saved || false);
  const [likes, setLikes] = useState(listing.likes_count || 0);
  const [saves, setSaves] = useState(listing.saves_count || 0);

  useEffect(() => {
    setLiked(listing.viewer_state?.liked || false);
    setSaved(listing.viewer_state?.saved || false);
    setLikes(listing.likes_count || 0);
    setSaves(listing.saves_count || 0);
  }, [listing.id, listing.viewer_state?.liked, listing.viewer_state?.saved, listing.likes_count, listing.saves_count]);

  const needAuth = () => {
    if (!user) {
      toast.info("Sign in to like, save & follow");
      onOpenLogin?.();
      return true;
    }
    return false;
  };

  const like = async () => {
    if (needAuth()) return;
    setLiked((v) => !v); setLikes((n) => n + (liked ? -1 : 1));
    try {
      const { data } = await interactionApi.toggleLike(listing.id);
      setLiked(data.active); setLikes(data.count);
    } catch { setLiked(!liked); setLikes(likes); }
  };
  const save = async () => {
    if (needAuth()) return;
    setSaved((v) => !v); setSaves((n) => n + (saved ? -1 : 1));
    try {
      const { data } = await interactionApi.toggleSave(listing.id);
      setSaved(data.active); setSaves(data.count);
    } catch { setSaved(!saved); setSaves(saves); }
  };
  const share = async () => {
    const url = `${window.location.origin}/listing/${listing.slug}`;
    if (navigator.share) { try { await navigator.share({ title: listing.title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch {}
  };

  return (
    <div className="snap-start h-[calc(100vh-64px)] w-full relative bg-black" data-testid={`reel-${listing.slug}`}>
      {listing.reel?.url ? (
        <video
          ref={videoRef}
          src={resolveMediaUrl(listing.reel.url)}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted={muted}
          playsInline
          onClick={() => setMuted((m) => !m)}
          data-testid={`reel-video-${listing.slug}`}
        />
      ) : listing.images?.[0]?.url ? (
        <img src={resolveMediaUrl(listing.images[0].url)} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      {/* Overlay gradients */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent" />

      {/* Mute indicator */}
      <button
        onClick={() => setMuted((m) => !m)}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/10"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-4 px-5 z-10 flex items-end gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          {listing.vendor && (
            <Link to={`/vendor/${listing.vendor.id}`} className="inline-flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center font-heading font-bold text-xs">
                {(listing.vendor.name || "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold group-hover:underline">{listing.vendor.name}</span>
            </Link>
          )}
          <Link to={`/listing/${listing.slug}`} className="block">
            <div className="text-lg font-heading font-bold leading-tight truncate">{listing.title}</div>
            <div className="text-sm text-white/85 line-clamp-2">
              {listing.description || `₹${new Intl.NumberFormat("en-IN").format(listing.offer_price || listing.price)}${listing.location ? ` · ${listing.location.area}, ${listing.location.city}` : ""}`}
            </div>
          </Link>
          <div className="text-base font-bold">
            ₹{new Intl.NumberFormat("en-IN").format(listing.offer_price || listing.price)}
            {listing.offer_price ? <span className="ml-2 text-xs text-white/50 line-through">₹{new Intl.NumberFormat("en-IN").format(listing.price)}</span> : null}
          </div>
        </div>

        {/* Action rail */}
        <div className="flex flex-col items-center gap-4 pb-1">
          <ActionButton icon={<Heart className={`h-6 w-6 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />} label={likes} onClick={like} testId={`like-${listing.slug}`} />
          <ActionButton icon={<Bookmark className={`h-6 w-6 ${saved ? "fill-white" : ""}`} />} label={saves} onClick={save} testId={`save-${listing.slug}`} />
          <ActionButton icon={<Share2 className="h-6 w-6" />} label="Share" onClick={share} testId={`share-${listing.slug}`} />
          <Link to={`/listing/${listing.slug}`} data-testid={`reel-detail-${listing.slug}`}>
            <ActionButton icon={<MessageCircle className="h-6 w-6" />} label="View" as="span" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, testId, as }) {
  const Comp = as || "button";
  return (
    <Comp
      onClick={onClick}
      data-testid={testId}
      type="button"
      className="flex flex-col items-center gap-0.5 text-white/95 hover:text-white transition-colors"
    >
      <span className="h-11 w-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/10">
        {icon}
      </span>
      <span className="text-[10px] font-semibold">{label}</span>
    </Comp>
  );
}
