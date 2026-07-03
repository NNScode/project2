from datetime import datetime

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import models
from schemas.attendance import AttendanceCreate, AttendanceUpdate
from core.face import (
    DEFAULT_TOLERANCE,
    extract_encoding_from_portrait,
    is_same_person,
)
from core.uploads import save_checkin_image, validate_image
from crud.student import get_student_model_by_user_id

LIVENESS_REVIEW_THRESHOLD = 0.70
MATCH_REVIEW_DISTANCE = 0.35


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


def get_attendance_records(db: Session, proctor_id: int | None = None):
    q = (
        db.query(models.AttendanceRecord)
        .options(
            joinedload(models.AttendanceRecord.student).joinedload(models.Student.user),
            joinedload(models.AttendanceRecord.room),
        )
    )
    if proctor_id is not None:
        q = q.join(models.Room).filter(models.Room.proctor_id == proctor_id)
    rows = q.order_by(models.AttendanceRecord.id.desc()).all()
    return [_to_read(r) for r in rows]


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


def _resolve_status(same_person: bool, distance: float, liveness_score: float | None) -> models.AttendanceStatus:
    if not same_person:
        return models.AttendanceStatus.FAILED
    if distance > MATCH_REVIEW_DISTANCE:
        return models.AttendanceStatus.NEEDS_REVIEW
    if liveness_score is not None and liveness_score < LIVENESS_REVIEW_THRESHOLD:
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

    ext = validate_image(content_type, len(image_bytes))
    probe = extract_encoding_from_portrait(image_bytes)
    same, distance = is_same_person(student.face_vector, probe)
    match_score = round(max(0.0, 1.0 - distance), 4)
    status = _resolve_status(same, distance, liveness_score)
    image_url = save_checkin_image(student.id, room_id, image_bytes, ext)

    record = (
        db.query(models.AttendanceRecord)
        .filter(
            models.AttendanceRecord.student_id == student.id,
            models.AttendanceRecord.room_id == room_id,
        )
        .order_by(models.AttendanceRecord.id.desc())
        .first()
    )
    if record and record.status != models.AttendanceStatus.SUCCESS:
        record.status = status
        record.check_in_time = now
        record.captured_image_url = image_url
        record.liveness_score = liveness_score
        record.match_score = match_score
    else:
        record = models.AttendanceRecord(
            room_id=room_id,
            student_id=student.id,
            status=status,
            check_in_time=now,
            captured_image_url=image_url,
            liveness_score=liveness_score,
            match_score=match_score,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    messages = {
        models.AttendanceStatus.SUCCESS: "Điểm danh thành công",
        models.AttendanceStatus.NEEDS_REVIEW: "Đã ghi nhận — chờ giám thị duyệt",
        models.AttendanceStatus.FAILED: "Không khớp khuôn mặt — điểm danh thất bại",
    }
    return {
        "id": record.id,
        "status": record.status,
        "match_score": match_score,
        "liveness_score": liveness_score,
        "distance": round(distance, 4),
        "tolerance": DEFAULT_TOLERANCE,
        "is_same_person": same,
        "message": messages.get(status, "Đã ghi nhận"),
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
