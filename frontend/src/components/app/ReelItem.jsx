import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, Bookmark, Share2, Volume2, VolumeX, MessageCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { interactionApi, resolveMediaUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Instagram-style vertical reel:
 * - Autoplays via IntersectionObserver (only when ≥50% visible)
 * - Pauses + rewinds when out of view (saves bandwidth)
 * - Global mute state (single tap on ANY reel unmutes the whole stream)
 * - Preloads eagerly for the first 2 reels, metadata-only for the rest
 * - Falls back to a full-viewport image when the listing has no reel
 * - Snap-align + full-height so the browser handles the physical snapping
 */

// Module-level global mute state — persisted so scrolling never re-mutes.
let _globalMuted = true;
const _muteListeners = new Set();
function setGlobalMuted(v) {
  _globalMuted = v;
  _muteListeners.forEach((fn) => fn(v));
}
function useGlobalMute() {
  const [muted, setMuted] = useState(_globalMuted);
  useEffect(() => {
    _muteListeners.add(setMuted);
    return () => _muteListeners.delete(setMuted);
  }, []);
  return [muted, setGlobalMuted];
}

export default function ReelItem({ listing, index = 0, onOpenLogin }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const rootRef = useRef(null);
  const [muted, setMutedGlobal] = useGlobalMute();
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);
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

  // Keep <video>.muted in sync with the global mute state.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // IntersectionObserver → autoplay when in view, pause + rewind when out.
  useEffect(() => {
    const el = rootRef.current;
    const v = videoRef.current;
    if (!el || !v) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Enter view → try to play
            const p = v.play();
            if (p && typeof p.then === "function") {
              p.then(() => {
                setIsPlaying(true);
                setNeedsTapToPlay(false);
              }).catch(() => {
                // Autoplay blocked (usually because non-muted OR user hasn't gestured yet).
                // Fall back to muted playback which browsers universally allow.
                v.muted = true;
                setMutedGlobal(true);
                v.play()
                  .then(() => setIsPlaying(true))
                  .catch(() => setNeedsTapToPlay(true));
              });
            }
          } else {
            v.pause();
            v.currentTime = 0;
            setIsPlaying(false);
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [setMutedGlobal]);

  const needAuth = () => {
    if (!user) {
      toast.info("Sign in to like, save & follow");
      onOpenLogin?.();
      return true;
    }
    return false;
  };

  const toggleMute = useCallback(() => setMutedGlobal(!muted), [muted, setMutedGlobal]);

  const handleVideoTap = useCallback(() => {
    // First tap: if paused (autoplay blocked), start playing. Otherwise toggle mute.
    const v = videoRef.current;
    if (v && v.paused) {
      v.play().then(() => {
        setIsPlaying(true);
        setNeedsTapToPlay(false);
      }).catch(() => {});
      return;
    }
    toggleMute();
  }, [toggleMute]);

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
    const isSaved = saved;
    setSaved(!isSaved); setSaves((n) => n + (isSaved ? -1 : 1));
    try {
      const res = isSaved 
        ? await interactionApi.unsave(listing.id)
        : await interactionApi.save(listing.id);
      const resData = res.data?.data || res.data;
      setSaved(resData.active !== undefined ? resData.active : !isSaved);
      setSaves(resData.count !== undefined ? resData.count : saves + (isSaved ? -1 : 1));
    } catch { setSaved(isSaved); setSaves(saves); }
  };
  const share = async () => {
    const url = `${window.location.origin}/listing/${listing.slug}`;
    if (navigator.share) { try { await navigator.share({ title: listing.title, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); toast.success("Link copied"); } catch {}
  };

  const hasVideo = !!listing.reel?.url;
  const hasImage = !!listing.images?.[0]?.url;

  return (
    <div
      ref={rootRef}
      className="snap-start snap-always h-[calc(100vh-64px)] w-full relative bg-black overflow-hidden"
      data-testid={`reel-${listing.slug}`}
    >
      {hasVideo ? (
        <video
          ref={videoRef}
          src={resolveMediaUrl(listing.reel.url)}
          poster={listing.reel.thumbnail_url ? resolveMediaUrl(listing.reel.thumbnail_url) : undefined}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          loop
          muted={muted}
          playsInline
          preload={index < 2 ? "auto" : "metadata"}
          onClick={handleVideoTap}
          onPlaying={() => { setIsPlaying(true); setNeedsTapToPlay(false); }}
          onPause={() => setIsPlaying(false)}
          data-testid={`reel-video-${listing.slug}`}
        />
      ) : hasImage ? (
        <img
          src={resolveMediaUrl(listing.images[0].url)}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover"
          loading={index < 2 ? "eager" : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
          No media
        </div>
      )}

      {/* Overlay gradients */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

      {/* Play overlay when autoplay was blocked */}
      {hasVideo && needsTapToPlay && !isPlaying && (
        <button
          onClick={handleVideoTap}
          className="absolute inset-0 z-10 flex items-center justify-center"
          aria-label="Tap to play"
          data-testid={`reel-tap-play-${listing.slug}`}
        >
          <span className="h-20 w-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Play className="h-8 w-8 fill-white text-white" />
          </span>
        </button>
      )}

      {/* Mute indicator */}
      {hasVideo && (
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/10 z-10"
          aria-label={muted ? "Unmute" : "Mute"}
          data-testid={`reel-mute-${listing.slug}`}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

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
