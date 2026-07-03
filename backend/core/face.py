import json
import warnings
from io import BytesIO

import face_recognition
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning)

FACE_MODEL = "face_recognition"
FACE_VECTOR_VERSION = 2
DEFAULT_TOLERANCE = 0.45


def _bytes_to_rgb(image_bytes: bytes) -> np.ndarray:
    img = face_recognition.load_image_file(BytesIO(image_bytes))
    if img is None or img.size == 0:
        raise ValueError("Không đọc được file ảnh. Vui lòng dùng JPG hoặc PNG.")
    return img


def _crop_cccd_portrait(rgb: np.ndarray) -> np.ndarray:
    """Cắt vùng chân dung CCCD (góc trái dưới sau khi xoay đúng hướng)."""
    h, w = rgb.shape[:2]
    return rgb[int(h * 0.1) : h, 0 : int(w * 0.5)].copy()


def extract_face_vector(image_bytes: bytes) -> str:
    """
    Validate & trích xuất encoding từ ảnh CCCD upload.
    Logic: xoay 4 hướng → crop → face_locations → dừng ngay khi thấy mặt.
    """
    image = _bytes_to_rgb(image_bytes)

    for k in range(4):
        rotated = np.rot90(image, k)
        cropped = _crop_cccd_portrait(rotated)
        locations = face_recognition.face_locations(
            cropped,
            number_of_times_to_upsample=2,
        )
        if not locations:
            continue

        encodings = face_recognition.face_encodings(
            cropped,
            known_face_locations=locations,
        )
        if not encodings:
            continue

        encoding = encodings[0]
        return json.dumps(
            {
                "version": FACE_VECTOR_VERSION,
                "model": FACE_MODEL,
                "encoding": [round(float(x), 6) for x in encoding],
                "rotation_deg": k * 90,
            },
            ensure_ascii=False,
        )

    raise ValueError(
        "Không phát hiện khuôn mặt trên ảnh CCCD. "
        "Đã thử xoay đủ 4 hướng — vui lòng upload ảnh CCCD rõ mặt thí sinh."
    )


def extract_encoding_from_portrait(image_bytes: bytes) -> list[float]:
    """Ảnh chân dung (webcam) — dùng khi so khớp điểm danh."""
    image = _bytes_to_rgb(image_bytes)
    locations = face_recognition.face_locations(image, number_of_times_to_upsample=1)
    if not locations:
        raise ValueError("Không phát hiện khuôn mặt trong ảnh.")

    encodings = face_recognition.face_encodings(image, known_face_locations=locations)
    if not encodings:
        raise ValueError("Không trích xuất được face encoding.")
    return [float(x) for x in encodings[0]]


def load_encoding_from_vector(face_vector_json: str) -> np.ndarray:
    data = json.loads(face_vector_json)
    if data.get("model") != FACE_MODEL or "encoding" not in data:
        raise ValueError(
            "Face vector không hợp lệ hoặc dùng model cũ — vui lòng upload lại ảnh CCCD."
        )
    return np.array(data["encoding"], dtype=np.float64)


def compare_face_distance(stored_vector_json: str, probe_encoding: list[float]) -> float:
    known = load_encoding_from_vector(stored_vector_json)
    probe = np.array(probe_encoding, dtype=np.float64)
    return float(face_recognition.face_distance([known], probe)[0])


def is_same_person(
    stored_vector_json: str,
    probe_encoding: list[float],
    tolerance: float = DEFAULT_TOLERANCE,
) -> tuple[bool, float]:
    distance = compare_face_distance(stored_vector_json, probe_encoding)
    return distance <= tolerance, distance
