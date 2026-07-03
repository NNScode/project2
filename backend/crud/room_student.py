from sqlalchemy.orm import Session, joinedload
import models
from schemas.room_student import RoomStudentCreate, RoomStudentUpdate


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


def get_room_students(db: Session):
    rows = (
        db.query(models.RoomStudent)
        .options(
            joinedload(models.RoomStudent.student).joinedload(models.Student.user),
            joinedload(models.RoomStudent.room).joinedload(models.Room.exam),
        )
        .order_by(models.RoomStudent.id.desc())
        .all()
    )
    return [_to_read(r) for r in rows]


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
