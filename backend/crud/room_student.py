from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
import models
from schemas.room_student import RoomStudentCreate, RoomStudentUpdate
from schemas.common import make_paged, normalize_pagination


def _to_read(rs: models.RoomStudent) -> dict:
    return {
        "id": rs.id,
        "student_id": rs.student_id,
        "room_id": rs.room_id,
        "student_number": rs.student.student_number if rs.student else None,
        "full_name": rs.student.user.full_name if rs.student and rs.student.user else None,
        "room_name": rs.room.room_name if rs.room else None,
        "exam_name": rs.room.exam.name if rs.room and rs.room.exam else None,
    }


def _room_students_query(db: Session, search: str | None = None, room_id: int | None = None):
    q = (
        db.query(models.RoomStudent)
        .options(
            joinedload(models.RoomStudent.student).joinedload(models.Student.user),
            joinedload(models.RoomStudent.room).joinedload(models.Room.exam),
        )
    )
    if room_id is not None:
        q = q.filter(models.RoomStudent.room_id == room_id)
    if search:
        term = f"%{search.strip()}%"
        q = (
            q.join(models.Student, models.RoomStudent.student_id == models.Student.id)
            .join(models.User, models.Student.user_id == models.User.id)
            .join(models.Room, models.RoomStudent.room_id == models.Room.id)
            .filter(
                or_(
                    models.Student.student_number.ilike(term),
                    models.User.full_name.ilike(term),
                    models.Room.room_name.ilike(term),
                )
            )
        )
    return q


def get_room_students(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    room_id: int | None = None,
):
    page, page_size, offset = normalize_pagination(page, page_size)
    q = _room_students_query(db, search, room_id)
    total = q.count()
    rows = q.order_by(models.RoomStudent.id.desc()).offset(offset).limit(page_size).all()
    return make_paged([_to_read(r) for r in rows], total, page, page_size)


def get_room_student_by_id(db: Session, rs_id: int):
    rs = (
        db.query(models.RoomStudent)
        .options(
            joinedload(models.RoomStudent.student).joinedload(models.Student.user),
            joinedload(models.RoomStudent.room).joinedload(models.Room.exam),
        )
        .filter(models.RoomStudent.id == rs_id)
        .first()
    )
    return _to_read(rs) if rs else None


def create_room_student(db: Session, payload: RoomStudentCreate):
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if not student:
        raise ValueError("Không tìm thấy thí sinh")
    room = db.query(models.Room).filter(models.Room.id == payload.room_id).first()
    if not room:
        raise ValueError("Không tìm thấy phòng thi")
    dup = (
        db.query(models.RoomStudent)
        .filter(
            models.RoomStudent.student_id == payload.student_id,
            models.RoomStudent.room_id == payload.room_id,
        )
        .first()
    )
    if dup:
        raise ValueError("Thí sinh đã được gán vào phòng này")

    rs = models.RoomStudent(**payload.model_dump())
    db.add(rs)
    db.commit()
    db.refresh(rs)
    return get_room_student_by_id(db, rs.id)


def create_room_students_bulk(db: Session, room_id: int, student_ids: list[int]):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise ValueError("Không tìm thấy phòng thi")

    unique_ids = list(dict.fromkeys(student_ids))
    students = db.query(models.Student).filter(models.Student.id.in_(unique_ids)).all()
    if len(students) != len(unique_ids):
        raise ValueError("Có thí sinh không tồn tại")

    existing = {
        sid
        for (sid,) in db.query(models.RoomStudent.student_id)
        .filter(
            models.RoomStudent.room_id == room_id,
            models.RoomStudent.student_id.in_(unique_ids),
        )
        .all()
    }
    to_add = [sid for sid in unique_ids if sid not in existing]
    for sid in to_add:
        db.add(models.RoomStudent(room_id=room_id, student_id=sid))
    if to_add:
        db.commit()
    return {"created": len(to_add), "skipped": len(unique_ids) - len(to_add)}


def update_room_student(db: Session, rs_id: int, payload: RoomStudentUpdate):
    rs = db.query(models.RoomStudent).filter(models.RoomStudent.id == rs_id).first()
    if not rs:
        return None
    data = payload.model_dump(exclude_unset=True)
    new_student_id = data.get("student_id", rs.student_id)
    new_room_id = data.get("room_id", rs.room_id)
    dup = (
        db.query(models.RoomStudent)
        .filter(
            models.RoomStudent.student_id == new_student_id,
            models.RoomStudent.room_id == new_room_id,
            models.RoomStudent.id != rs_id,
        )
        .first()
    )
    if dup:
        raise ValueError("Thí sinh đã được gán vào phòng này")
    for k, v in data.items():
        setattr(rs, k, v)
    db.commit()
    return get_room_student_by_id(db, rs_id)


def delete_room_student(db: Session, rs_id: int) -> bool:
    rs = db.query(models.RoomStudent).filter(models.RoomStudent.id == rs_id).first()
    if not rs:
        return False
    db.delete(rs)
    db.commit()
    return True
