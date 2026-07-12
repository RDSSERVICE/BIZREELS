import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Film, X, Loader2 } from "lucide-react";
import { mediaApi, resolveMediaUrl } from "@/lib/api";

const MAX_IMAGES = 10;
const MAX_REEL_SECONDS = 30;

async function readVideoDuration(file) {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.src = url;
      v.onloadedmetadata = () => {
        const d = v.duration || null;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      v.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

export default function MediaUploader({ images = [], reel = null, onChange, folder = "listings/misc" }) {
  const imgInput = useRef(null);
  const reelInput = useRef(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingReel, setUploadingReel] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImages = async (files) => {
    if (!files?.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Max ${MAX_IMAGES} images`);
      return;
    }
    setUploadingImg(true);
    setProgress(0);
    try {
      const uploaded = [];
      for (const f of files) {
        if (!/^image\//.test(f.type)) {
          toast.error(`${f.name}: not an image`);
          continue;
        }
        const { data } = await mediaApi.upload(f, folder, "image", setProgress);
        uploaded.push({
          url: data.url,
          public_id: data.public_id,
          width: data.width,
          height: data.height,
        });
      }
      onChange?.({ images: [...images, ...uploaded], reel });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setUploadingImg(false);
      setProgress(0);
      if (imgInput.current) imgInput.current.value = "";
    }
  };

  const handleReel = async (file) => {
    if (!file) return;
    if (!/^video\//.test(file.type)) {
      toast.error("Please pick a video file");
      return;
    }
    const dur = await readVideoDuration(file);
    if (dur && dur > MAX_REEL_SECONDS) {
      toast.error(`Reel must be ≤ ${MAX_REEL_SECONDS}s (yours is ${Math.round(dur)}s)`);
      return;
    }
    setUploadingReel(true);
    setProgress(0);
    try {
      const { data } = await mediaApi.upload(file, folder, "video", setProgress);
      onChange?.({
        images,
        reel: {
          url: data.url,
          public_id: data.public_id,
          thumbnail_url: data.thumbnail_url || null,
          duration: dur || data.duration || null,
        },
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setUploadingReel(false);
      setProgress(0);
      if (reelInput.current) reelInput.current.value = "";
    }
  };

  const removeImg = (i) => onChange?.({ images: images.filter((_, idx) => idx !== i), reel });
  const removeReel = () => onChange?.({ images, reel: null });

  return (
    <div className="space-y-4" data-testid="media-uploader">
      {/* Images */}
      <div>
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
          Images ({images.length}/{MAX_IMAGES})
        </div>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={img.public_id || i} className="aspect-square rounded-xl overflow-hidden bg-white/5 relative">
              <img src={resolveMediaUrl(img.url)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImg(i)}
                data-testid={`remove-image-${i}`}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              data-testid="upload-image-btn"
              onClick={() => imgInput.current?.click()}
              disabled={uploadingImg}
              className="aspect-square rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-white/60 disabled:opacity-50"
            >
              {uploadingImg ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[10px]">{progress}%</span>
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={imgInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImages(Array.from(e.target.files || []))}
        />
      </div>

      {/* Reel */}
      <div>
        <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">
          Reel (optional, ≤ {MAX_REEL_SECONDS}s)
        </div>
        {reel ? (
          <div className="aspect-[9/16] max-w-[180px] rounded-xl overflow-hidden bg-white/5 relative">
            <video
              src={resolveMediaUrl(reel.url)}
              className="w-full h-full object-cover"
              controls
              muted
              playsInline
            />
            <button
              type="button"
              onClick={removeReel}
              data-testid="remove-reel"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {reel.duration ? (
              <span className="absolute bottom-1 left-1 text-[10px] font-mono bg-black/70 px-1.5 py-0.5 rounded">
                {Math.round(reel.duration)}s
              </span>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            data-testid="upload-reel-btn"
            onClick={() => reelInput.current?.click()}
            disabled={uploadingReel}
            className="aspect-[9/16] max-w-[180px] rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-white/60 disabled:opacity-50"
          >
            {uploadingReel ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">{progress}%</span>
              </>
            ) : (
              <>
                <Film className="h-6 w-6" />
                <span className="text-xs">Add reel</span>
              </>
            )}
          </button>
        )}
        <input
          ref={reelInput}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleReel(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
