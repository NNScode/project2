from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from datetime import datetime
import models
from schemas.student import StudentCreate, StudentUpdate
from schemas.common import make_paged, normalize_pagination
from core.face import extract_face_vector
from core.uploads import delete_image_by_url, save_student_image, validate_image


def _to_read(student: models.Student) -> dict:
    return {
        "id": student.id,
        "user_id": student.user_id,
        "student_number": student.student_number,
        "cccd_number": student.cccd_number,
        "cccd_image_url": student.cccd_image_url,
        "has_face_vector": bool(student.face_vector and student.face_vector.strip()),
        "full_name": student.user.full_name if student.user else None,
        "user_name": student.user.user_name if student.user else None,
    }


def _students_query(db: Session, search: str | None = None):
    q = db.query(models.Student).options(joinedload(models.Student.user))
    if search:
        term = f"%{search.strip()}%"
        q = q.join(models.User).filter(
            or_(
                models.Student.student_number.ilike(term),
                models.Student.cccd_number.ilike(term),
                models.User.full_name.ilike(term),
                models.User.user_name.ilike(term),
            )
        )
    return q


def get_students(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
):
    page, page_size, offset = normalize_pagination(page, page_size)
    q = _students_query(db, search)
    total = q.count()
    rows = q.order_by(models.Student.id.desc()).offset(offset).limit(page_size).all()
    return make_paged([_to_read(s) for s in rows], total, page, page_size)


def get_student_by_id(db: Session, student_id: int):
    student = (
        db.query(models.Student)
        .options(joinedload(models.Student.user))
        .filter(models.Student.id == student_id)
        .first()
    )
    return _to_read(student) if student else None


def get_student_model(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()


def get_student_model_by_user_id(db: Session, user_id: int):
    return db.query(models.Student).filter(models.Student.user_id == user_id).first()


def create_student(db: Session, payload: StudentCreate):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise ValueError("Không tìm thấy người dùng")
    if user.role != models.UserRole.STUDENTS:
        raise ValueError("Chỉ gán hồ sơ cho tài khoản thí sinh")
    existing = db.query(models.Student).filter(models.Student.user_id == payload.user_id).first()
    if existing:
        raise ValueError("Người dùng đã có hồ sơ thí sinh")

    student = models.Student(**payload.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return get_student_by_id(db, student.id)


def update_student(db: Session, student_id: int, payload: StudentUpdate):
    student = get_student_model(db, student_id)
    if not student:
        return None
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(student, k, v)
    db.commit()
    return get_student_by_id(db, student_id)


def save_student_cccd_image(
    db: Session,
    student_id: int,
    file_bytes: bytes,
    content_type: str | None,
):
    student = get_student_model(db, student_id)
    if not student:
        return None

    ext = validate_image(content_type, len(file_bytes))
    face_vector = extract_face_vector(file_bytes)
    delete_image_by_url(student.cccd_image_url)

    image_url = save_student_image(student_id, file_bytes, ext)
    student.cccd_image_url = image_url
    student.face_vector = face_vector
    db.commit()
    return get_student_by_id(db, student_id)


def delete_student_cccd_image(db: Session, student_id: int):
    student = get_student_model(db, student_id)
    if not student:
        return None
    delete_image_by_url(student.cccd_image_url)
    student.cccd_image_url = None
    student.face_vector = None
    db.commit()
    return get_student_by_id(db, student_id)


def delete_student(db: Session, student_id: int) -> bool:
    student = get_student_model(db, student_id)
    if not student:
        return False
    delete_image_by_url(student.cccd_image_url)
    db.delete(student)
    db.commit()
    return True


def get_student_exam_context(db: Session, user_id: int):
    student = (
        db.query(models.Student)
        .options(joinedload(models.Student.user))
        .filter(models.Student.user_id == user_id)
        .first()
    )
    if not student:
        return None

    now = datetime.now()
    assignments = (
        db.query(models.RoomStudent)
        .options(
            joinedload(models.RoomStudent.room).joinedload(models.Room.exam),
        )
        .filter(models.RoomStudent.student_id == student.id)
        .all()
    )

    rooms = []
    for rs in assignments:
        room = rs.room
        if not room:
            continue
        exam = room.exam
        record = (
            db.query(models.AttendanceRecord)
            .filter(
                models.AttendanceRecord.student_id == student.id,
                models.AttendanceRecord.room_id == room.id,
            )
            .order_by(models.AttendanceRecord.id.desc())
            .first()
        )
        att_status = record.status.value if record else None
        in_window = room.start_time <= now <= room.end_time
        has_face = bool(student.face_vector and student.face_vector.strip())
        already_ok = att_status == models.AttendanceStatus.SUCCESS.value
        rooms.append({
            "room_id": room.id,
            "room_name": room.room_name,
            "exam_id": room.exam_id,
            "exam_name": exam.name if exam else f"Kỳ thi #{room.exam_id}",
            "start_time": room.start_time,
            "end_time": room.end_time,
            "exam_url": room.exam_url if already_ok else None,
            "attendance_status": att_status,
            "check_in_attempt_count": record.check_in_attempt_count if record else 0,
            "can_check_in": in_window and has_face and not already_ok,
        })

    rooms.sort(key=lambda r: r["start_time"])
    return {
        "student_id": student.id,
        "full_name": student.user.full_name if student.user else "",
        "has_face_vector": bool(student.face_vector and student.face_vector.strip()),
        "rooms": rooms,
    }
