from datetime import datetime

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
import models
from schemas.common import make_paged, normalize_pagination
from schemas.attendance import AttendanceCreate, AttendanceUpdate
from core.face import (
    compare_face_distance,
    extract_encoding_from_portrait,
)
from core.uploads import delete_image_by_url, save_checkin_image, validate_image
from crud.student import get_student_model_by_user_id

LIVENESS_MIN_THRESHOLD = 0.70
MATCH_FAILED_BELOW = 0.45
MATCH_SUCCESS_ABOVE = 0.55


def _to_read(rec: models.AttendanceRecord) -> dict:
    return {
        "id": rec.id,
        "room_id": rec.room_id,
        "student_id": rec.student_id,
        "status": rec.status,
        "check_in_time": rec.check_in_time,
        "captured_image_url": rec.captured_image_url,
        "liveness_score": rec.liveness_score,
        "match_score": rec.match_score,
        "proctor_note": rec.proctor_note,
        "student_number": rec.student.student_number if rec.student else None,
        "full_name": rec.student.user.full_name if rec.student and rec.student.user else None,
        "room_name": rec.room.room_name if rec.room else None,
    }


def _attendance_query(
    db: Session,
    proctor_id: int | None = None,
    search: str | None = None,
    status: models.AttendanceStatus | None = None,
    room_id: int | None = None,
):
    q = (
        db.query(models.AttendanceRecord)
        .options(
            joinedload(models.AttendanceRecord.student).joinedload(models.Student.user),
            joinedload(models.AttendanceRecord.room),
        )
    )
    if proctor_id is not None or room_id is not None or search:
        q = q.join(models.Room, models.AttendanceRecord.room_id == models.Room.id)
    if proctor_id is not None:
        q = q.filter(models.Room.proctor_id == proctor_id)
    if room_id is not None:
        q = q.filter(models.AttendanceRecord.room_id == room_id)
    if status is not None:
        q = q.filter(models.AttendanceRecord.status == status)
    if search:
        term = f"%{search.strip()}%"
        q = (
            q.join(models.Student, models.AttendanceRecord.student_id == models.Student.id)
            .join(models.User, models.Student.user_id == models.User.id)
            .filter(
                or_(
                    models.Student.student_number.ilike(term),
                    models.User.full_name.ilike(term),
                    models.Room.room_name.ilike(term),
                )
            )
        )
    return q


def get_attendance_records(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    proctor_id: int | None = None,
    search: str | None = None,
    status: models.AttendanceStatus | None = None,
    room_id: int | None = None,
):
    page, page_size, offset = normalize_pagination(page, page_size)
    q = _attendance_query(db, proctor_id, search, status, room_id)
    total = q.count()
    rows = q.order_by(models.AttendanceRecord.id.desc()).offset(offset).limit(page_size).all()
    return make_paged([_to_read(r) for r in rows], total, page, page_size)


def get_attendance_by_id(db: Session, record_id: int):
    rec = (
        db.query(models.AttendanceRecord)
        .options(
            joinedload(models.AttendanceRecord.student).joinedload(models.Student.user),
            joinedload(models.AttendanceRecord.room),
        )
        .filter(models.AttendanceRecord.id == record_id)
        .first()
    )
    return _to_read(rec) if rec else None


CHECKIN_MAX_ATTEMPTS = 3


def _status_rank(status: models.AttendanceStatus) -> int:
    order = {
        models.AttendanceStatus.SUCCESS: 3,
        models.AttendanceStatus.NEEDS_REVIEW: 2,
        models.AttendanceStatus.PENDING: 1,
        models.AttendanceStatus.FAILED: 0,
    }
    return order.get(status, 0)


def _is_better_attempt(
    old_match: float | None,
    old_status: models.AttendanceStatus | None,
    new_match: float,
    new_status: models.AttendanceStatus,
) -> bool:
    if old_match is None:
        return True
    if new_match > old_match:
        return True
    if new_match == old_match and _status_rank(new_status) > _status_rank(old_status or models.AttendanceStatus.FAILED):
        return True
    return False


def _resolve_status(match_score: float) -> models.AttendanceStatus:
    if match_score < MATCH_FAILED_BELOW:
        return models.AttendanceStatus.FAILED
    if match_score <= MATCH_SUCCESS_ABOVE:
        return models.AttendanceStatus.NEEDS_REVIEW
    return models.AttendanceStatus.SUCCESS


def student_check_in(
    db: Session,
    user_id: int,
    room_id: int,
    image_bytes: bytes,
    content_type: str | None,
    liveness_score: float | None = None,
):
    student = get_student_model_by_user_id(db, user_id)
    if not student:
        raise ValueError("Chưa có hồ sơ thí sinh")
    if not student.face_vector or not student.face_vector.strip():
        raise ValueError("Chưa có ảnh CCCD — liên hệ quản trị")

    assigned = (
        db.query(models.RoomStudent)
        .filter(
            models.RoomStudent.student_id == student.id,
            models.RoomStudent.room_id == room_id,
        )
        .first()
    )
    if not assigned:
        raise ValueError("Bạn không được gán vào phòng thi này")

    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise ValueError("Không tìm thấy phòng thi")

    now = datetime.now()
    if now < room.start_time:
        raise ValueError("Chưa đến giờ bắt đầu thi")
    if now > room.end_time:
        raise ValueError("Đã hết giờ thi — không thể điểm danh")

    existing_success = (
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.student_id == student.id,
            models.AttendanceRecord.room_id == room_id,
            models.AttendanceRecord.status == models.AttendanceStatus.SUCCESS,
        )
        .first()
    )
    if existing_success:
        raise ValueError("Bạn đã điểm danh thành công")

    existing_review = (
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.student_id == student.id,
            models.AttendanceRecord.room_id == room_id,
            models.AttendanceRecord.status == models.AttendanceStatus.NEEDS_REVIEW,
        )
        .first()
    )
    if existing_review:
        raise ValueError("Đã ghi nhận — chờ giám thị duyệt")

    ext = validate_image(content_type, len(image_bytes))
    if liveness_score is None or liveness_score < LIVENESS_MIN_THRESHOLD:
        raise ValueError("Liveness chưa đạt — nháy mắt lại")

    probe = extract_encoding_from_portrait(image_bytes)
    distance = compare_face_distance(student.face_vector, probe)
    match_score = round(max(0.0, 1.0 - distance), 4)
    status = _resolve_status(match_score)
    same = match_score >= MATCH_FAILED_BELOW

    record = (
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.student_id == student.id,
            models.AttendanceRecord.room_id == room_id,
        )
        .order_by(models.AttendanceRecord.id.desc())
        .first()
    )

    if record and (record.check_in_attempt_count or 0) >= CHECKIN_MAX_ATTEMPTS:
        raise ValueError("Đã hết 3 lần điểm danh — liên hệ giám thị")

    next_attempt = (record.check_in_attempt_count or 0) + 1 if record else 1
    kept_previous_best = False

    if record is None or _is_better_attempt(record.match_score, record.status, match_score, status):
        image_url = save_checkin_image(student.id, room_id, image_bytes, ext)
        if record:
            if record.captured_image_url and record.captured_image_url != image_url:
                delete_image_by_url(record.captured_image_url)
            record.status = status
            record.check_in_time = now
            record.captured_image_url = image_url
            record.liveness_score = liveness_score
            record.match_score = match_score
            record.check_in_attempt_count = next_attempt
        else:
            record = models.AttendanceRecord(
                room_id=room_id,
                student_id=student.id,
                status=status,
                check_in_time=now,
                captured_image_url=image_url,
                liveness_score=liveness_score,
                match_score=match_score,
                check_in_attempt_count=next_attempt,
            )
            db.add(record)
    else:
        kept_previous_best = True
        record.check_in_attempt_count = next_attempt

    db.commit()
    db.refresh(record)

    attempts_remaining = max(0, CHECKIN_MAX_ATTEMPTS - record.check_in_attempt_count)
    messages = {
        models.AttendanceStatus.SUCCESS: "Điểm danh thành công",
        models.AttendanceStatus.NEEDS_REVIEW: "Đã ghi nhận — chờ giám thị duyệt",
        models.AttendanceStatus.FAILED: "Không khớp khuôn mặt — điểm danh thất bại",
    }
    if kept_previous_best:
        message = "Kết quả lần này thấp hơn — giữ kết quả tốt nhất trước đó"
    else:
        message = messages.get(record.status, "Đã ghi nhận")

    return {
        "id": record.id,
        "status": record.status,
        "match_score": record.match_score,
        "liveness_score": record.liveness_score,
        "distance": round(distance, 4),
        "tolerance": MATCH_SUCCESS_ABOVE,
        "is_same_person": same,
        "message": message,
        "attempt_count": record.check_in_attempt_count,
        "attempts_remaining": attempts_remaining,
        "kept_previous_best": kept_previous_best,
        "exam_url": room.exam_url if record.status == models.AttendanceStatus.SUCCESS else None,
    }


def create_attendance_record(db: Session, payload: AttendanceCreate):
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if not student:
        raise ValueError("Không tìm thấy thí sinh")
    room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not room:
        raise ValueError("Không tìm thấy phòng thi")

    record = models.AttendanceRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return get_attendance_by_id(db, record.id)


def update_attendance_record(db: Session, record_id: int, payload: AttendanceUpdate):
    record = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.id == record_id).first()
    if not record:
        return None
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(record, k, v)
    db.commit()
    return get_attendance_by_id(db, record_id)


def delete_attendance_record(db: Session, record_id: int) -> bool:
    record = db.query(models.AttendanceRecord).filter(models.AttendanceRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_dashboard_summary(db: Session):
    needs_review = (
        db.query(func.count(models.AttendanceRecord.id))
        .filter(models.AttendanceRecord.status == models.AttendanceStatus.NEEDS_REVIEW)
        .scalar()
        or 0
    )
    return {
        "role": "ADMIN",
        "total_users": db.query(func.count(models.User.id)).scalar() or 0,
        "total_students": db.query(func.count(models.Student.id)).scalar() or 0,
        "total_exams": db.query(func.count(models.Exam.id)).scalar() or 0,
        "total_rooms": db.query(func.count(models.Room.id)).scalar() or 0,
        "total_room_students": db.query(func.count(models.RoomStudent.id)).scalar() or 0,
        "total_attendance_records": db.query(func.count(models.AttendanceRecord.id)).scalar() or 0,
        "needs_review": needs_review,
    }


def get_proctor_dashboard(db: Session, proctor_id: int):
    now = datetime.now()
    rooms = (
        db.query(models.Room)
        .options(joinedload(models.Room.exam))
        .filter(models.Room.proctor_id == proctor_id)
        .order_by(models.Room.start_time)
        .all()
    )
    room_ids = [r.id for r in rooms]
    if not room_ids:
        return {
            "role": "PROCTOR",
            "my_rooms": 0,
            "assigned_students": 0,
            "attendance_success": 0,
            "needs_review": 0,
            "rooms": [],
        }
    assigned = (
        db.query(func.count(models.RoomStudent.id))
        .filter(models.RoomStudent.room_id.in_(room_ids))
        .scalar()
        or 0
    )
    success = (
        db.query(func.count(models.AttendanceRecord.id))
        .filter(
            models.AttendanceRecord.room_id.in_(room_ids),
            models.AttendanceRecord.status == models.AttendanceStatus.SUCCESS,
        )
        .scalar()
        or 0
    )
    review = (
        db.query(func.count(models.AttendanceRecord.id))
        .filter(
            models.AttendanceRecord.room_id.in_(room_ids),
            models.AttendanceRecord.status == models.AttendanceStatus.NEEDS_REVIEW,
        )
        .scalar()
        or 0
    )
    rooms_out = []
    for room in rooms:
        student_count = (
            db.query(func.count(models.RoomStudent.id))
            .filter(models.RoomStudent.room_id == room.id)
            .scalar()
            or 0
        )
        room_review = (
            db.query(func.count(models.AttendanceRecord.id))
            .filter(
                models.AttendanceRecord.room_id == room.id,
                models.AttendanceRecord.status == models.AttendanceStatus.NEEDS_REVIEW,
            )
            .scalar()
            or 0
        )
        rooms_out.append({
            "room_id": room.id,
            "room_name": room.room_name,
            "exam_name": room.exam.name if room.exam else f"Kỳ thi #{room.exam_id}",
            "start_time": room.start_time,
            "end_time": room.end_time,
            "student_count": student_count,
            "needs_review": room_review,
            "is_active": room.start_time <= now <= room.end_time,
        })
    return {
        "role": "PROCTOR",
        "my_rooms": len(room_ids),
        "assigned_students": assigned,
        "attendance_success": success,
        "needs_review": review,
        "rooms": rooms_out,
    }


def get_student_dashboard(db: Session, user_id: int):
    from crud.student import get_student_exam_context

    ctx = get_student_exam_context(db, user_id)
    if not ctx:
        return {"role": "STUDENTS", "has_profile": False, "rooms": []}
    return {
        "role": "STUDENTS",
        "has_profile": True,
        "has_face_vector": ctx["has_face_vector"],
        "full_name": ctx["full_name"],
        "rooms": ctx["rooms"],
    }
