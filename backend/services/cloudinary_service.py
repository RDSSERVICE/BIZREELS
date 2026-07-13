"""
Cloudinary media upload service.

Cloudinary keys required from user — currently in DEV MODE with local file storage.
When CLOUDINARY_DEV_MODE=true OR any Cloudinary env var is missing, uploads are saved
to /app/backend/uploads/ and served via the /api/uploads/<filename> static route.
Response shape mirrors real Cloudinary so the frontend doesn't need to know.
"""
from __future__ import annotations
import os
import time
import uuid
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_BYTES = 50 * 1024 * 1024   # 50 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}


class CloudinaryConfigError(RuntimeError):
    pass


def is_dev_mode() -> bool:
    """Reads from platform_settings first, .env as fallback."""
    from services import settings_service
    return settings_service.get_bool("cloudinary", "dev_mode", "CLOUDINARY_DEV_MODE", default=False)


def _has_credentials() -> bool:
    from services import settings_service
    return all([
        settings_service.get_value("cloudinary", "cloud_name", "CLOUDINARY_CLOUD_NAME"),
        settings_service.get_value("cloudinary", "api_key", "CLOUDINARY_API_KEY"),
        settings_service.get_value("cloudinary", "api_secret", "CLOUDINARY_API_SECRET"),
    ])


def _configure_sdk():
    """Lazy-configure Cloudinary SDK."""
    if not _has_credentials():
        raise CloudinaryConfigError(
            "Cloudinary keys missing. Set CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET "
            "or enable CLOUDINARY_DEV_MODE=true for local development."
        )
    from services import settings_service
    import cloudinary
    cloudinary.config(
        cloud_name=settings_service.get_value("cloudinary", "cloud_name", "CLOUDINARY_CLOUD_NAME"),
        api_key=settings_service.get_value("cloudinary", "api_key", "CLOUDINARY_API_KEY"),
        api_secret=settings_service.get_value("cloudinary", "api_secret", "CLOUDINARY_API_SECRET"),
        secure=True,
    )


ALLOWED_FOLDER_PREFIXES = ("users/", "listings/", "uploads/")


def _validate_folder(folder: str) -> str:
    if not folder or not folder.startswith(ALLOWED_FOLDER_PREFIXES):
        raise ValueError("Invalid folder path")
    return folder


def sign_upload(folder: str, resource_type: str = "image") -> dict:
    """Return signed params for a browser -> Cloudinary direct upload.

    In dev mode we return a fake signature; frontend must call our fallback
    /api/v1/media/upload proxy endpoint instead — the response tells it to.
    """
    folder = _validate_folder(folder)
    if is_dev_mode() or not _has_credentials():
        return {
            "mode": "proxy",  # frontend should POST to /api/v1/media/upload
            "mock": True,
            "folder": folder,
            "resource_type": resource_type,
        }
    _configure_sdk()
    import cloudinary.utils
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, settings_service_secret())
    return {
        "mode": "signed",
        "mock": False,
        "signature": signature,
        "timestamp": timestamp,
        "api_key": _s("api_key", "CLOUDINARY_API_KEY"),
        "cloud_name": _s("cloud_name", "CLOUDINARY_CLOUD_NAME"),
        "folder": folder,
        "resource_type": resource_type,
    }


def _s(key: str, env: str) -> str:
    from services import settings_service
    return settings_service.get_value("cloudinary", key, env)


def settings_service_secret() -> str:
    return _s("api_secret", "CLOUDINARY_API_SECRET")


async def upload_file(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    folder: str,
    resource_type: str = "image",
) -> dict:
    """Upload file via SDK (or write to disk in dev mode). Returns Cloudinary-shape dict."""
    folder = _validate_folder(folder)

    # Size / type validation
    if resource_type == "image":
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError(f"Unsupported image type: {content_type}")
        if len(file_bytes) > MAX_IMAGE_BYTES:
            raise ValueError("Image exceeds 10MB limit")
    elif resource_type == "video":
        if content_type not in ALLOWED_VIDEO_TYPES:
            raise ValueError(f"Unsupported video type: {content_type}")
        if len(file_bytes) > MAX_VIDEO_BYTES:
            raise ValueError("Video exceeds 50MB limit")
    else:
        raise ValueError(f"Unknown resource_type: {resource_type}")

    if is_dev_mode() or not _has_credentials():
        return _dev_write(file_bytes, filename, folder, resource_type)

    _configure_sdk()
    import cloudinary.uploader
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )
    return {
        "mock": False,
        "url": result.get("secure_url"),
        "secure_url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "width": result.get("width"),
        "height": result.get("height"),
        "resource_type": result.get("resource_type"),
        "duration": result.get("duration"),  # for videos
        "format": result.get("format"),
    }


def _dev_write(file_bytes: bytes, filename: str, folder: str, resource_type: str) -> dict:
    """Persist file to local uploads dir and return realistic response."""
    ext = Path(filename).suffix.lower() or (".mp4" if resource_type == "video" else ".jpg")
    public_id = f"{folder.rstrip('/')}/{uuid.uuid4().hex}"
    fs_name = public_id.replace("/", "__") + ext
    fs_path = UPLOADS_DIR / fs_name
    fs_path.write_bytes(file_bytes)

    # Best-effort dimension detection for images (via PIL if available)
    width, height, duration = None, None, None
    if resource_type == "image":
        try:
            from PIL import Image  # type: ignore
            with Image.open(fs_path) as im:
                width, height = im.size
        except Exception:  # noqa: BLE001
            pass
    # NOTE: server-side hard-enforcement of reel duration (30s) requires ffprobe or
    # a Cloudinary webhook. For dev mode, duration is soft-recorded from the
    # client-supplied metadata. TODO(phase-1.5): add ffprobe-based duration check.

    return {
        "mock": True,
        "url": f"/api/uploads/{fs_name}",  # relative path served by FastAPI static mount
        "secure_url": f"/api/uploads/{fs_name}",
        "public_id": public_id,
        "width": width,
        "height": height,
        "resource_type": resource_type,
        "duration": duration,
        "format": ext.lstrip("."),
    }


def destroy(public_id: str, resource_type: str = "image") -> None:
    """Delete asset. Best-effort in dev mode (deletes local file)."""
    if is_dev_mode() or not _has_credentials():
        # Local file
        fs_name = public_id.replace("/", "__")
        # We don't know the extension, so glob
        for p in UPLOADS_DIR.glob(f"{fs_name}.*"):
            try:
                p.unlink()
            except OSError:
                pass
        return
    try:
        _configure_sdk()
        import cloudinary.uploader
        cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cloudinary destroy failed for %s: %s", public_id, exc)
