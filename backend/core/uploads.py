import uuid
from pathlib import Path

from core.config import UPLOAD_DIR, UPLOAD_URL_PREFIX

STUDENT_UPLOAD_DIR = UPLOAD_DIR / "students"
CHECKIN_UPLOAD_DIR = UPLOAD_DIR / "checkins"
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def ensure_upload_dirs():
    STUDENT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    CHECKIN_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_image(content_type: str | None, size: int) -> str:
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.")
    if size > MAX_IMAGE_BYTES:
        raise ValueError("Ảnh không được lớn hơn 5MB.")
    return ALLOWED_IMAGE_TYPES[content_type]


def save_checkin_image(student_id: int, room_id: int, data: bytes, ext: str) -> str:
    ensure_upload_dirs()
    filename = f"{student_id}_{room_id}_{uuid.uuid4().hex[:12]}{ext}"
    path = CHECKIN_UPLOAD_DIR / filename
    path.write_bytes(data)
    return f"{UPLOAD_URL_PREFIX}/checkins/{filename}"


def save_student_image(student_id: int, data: bytes, ext: str) -> str:
    ensure_upload_dirs()
    filename = f"{student_id}_{uuid.uuid4().hex[:12]}{ext}"
    path = STUDENT_UPLOAD_DIR / filename
    path.write_bytes(data)
    return f"{UPLOAD_URL_PREFIX}/students/{filename}"


def delete_image_by_url(url: str | None) -> None:
    if not url or not url.startswith(UPLOAD_URL_PREFIX):
        return
    relative = url.removeprefix(f"{UPLOAD_URL_PREFIX}/")
    path = UPLOAD_DIR / relative
    if path.is_file():
        path.unlink(missing_ok=True)


def local_path_from_url(url: str | None) -> Path | None:
    if not url or not url.startswith(UPLOAD_URL_PREFIX):
        return None
    relative = url.removeprefix(f"{UPLOAD_URL_PREFIX}/")
    path = UPLOAD_DIR / relative
    return path if path.is_file() else None
