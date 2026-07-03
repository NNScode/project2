from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from schemas.room import RoomCreate, RoomUpdate
from schemas.common import make_paged, normalize_pagination


def _needs_review_counts(db: Session, room_ids: list[int]) -> dict[int, int]:
    if not room_ids:
        return {}
    rows = (
        db.query(models.AttendanceRecord.room_id, func.count(models.AttendanceRecord.id))
        .filter(
            models.AttendanceRecord.room_id.in_(room_ids),
            models.AttendanceRecord.status == models.AttendanceStatus.NEEDS_REVIEW,
        )
        .group_by(models.AttendanceRecord.room_id)
        .all()
    )
    return {room_id: count for room_id, count in rows}


def _to_read(room: models.Room, needs_review: int = 0) -> dict:
    return {
        "id": room.id,
        "exam_id": room.exam_id,
        "room_name": room.room_name,
        "start_time": room.start_time,
        "end_time": room.end_time,
        "exam_url": room.exam_url,
        "proctor_id": room.proctor_id,
        "needs_review": needs_review,
    }


def get_room_read(db: Session, room_id: int):
    room = get_room_by_id(db, room_id)
    if not room:
        return None
    counts = _needs_review_counts(db, [room_id])
    return _to_read(room, counts.get(room_id, 0))


def _rooms_query(
    db: Session,
    search: str | None = None,
    exam_id: int | None = None,
    proctor_id: int | None = None,
):
    q = db.query(models.Room)
    if exam_id is not None:
        q = q.filter(models.Room.exam_id == exam_id)
    if proctor_id is not None:
        q = q.filter(models.Room.proctor_id == proctor_id)
    if search:
        q = q.filter(models.Room.room_name.ilike(f"%{search.strip()}%"))
    return q


def get_rooms(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    exam_id: int | None = None,
    proctor_id: int | None = None,
):
    page, page_size, offset = normalize_pagination(page, page_size)
    q = _rooms_query(db, search, exam_id, proctor_id)
    total = q.count()
    rows = q.order_by(models.Room.id.desc()).offset(offset).limit(page_size).all()
    counts = _needs_review_counts(db, [r.id for r in rows])
    items = [_to_read(r, counts.get(r.id, 0)) for r in rows]
    return make_paged(items, total, page, page_size)


def get_room_by_id(db: Session, room_id: int):
    return db.query(models.Room).filter(models.Room.id == room_id).first()


def create_room(db: Session, payload: RoomCreate):
    room = models.Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return get_room_read(db, room.id)


def update_room(db: Session, room_id: int, payload: RoomUpdate):
    room = get_room_by_id(db, room_id)
    if not room:
        return None
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(room, key, value)
    db.commit()
    db.refresh(room)
    return get_room_read(db, room_id)


def delete_room(db: Session, room_id: int) -> bool:
    room = get_room_by_id(db, room_id)
    if not room:
        return False
    db.delete(room)
    db.commit()
    return True
