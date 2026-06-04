from sqlalchemy.orm import Session
import models
from schemas.room import RoomCreate, RoomUpdate


def get_rooms(db: Session):
    return db.query(models.Room).order_by(models.Room.id.desc()).all()


def get_room_by_id(db: Session, room_id: int):
    return db.query(models.Room).filter(models.Room.id == room_id).first()


def create_room(db: Session, payload: RoomCreate):
    room = models.Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


def update_room(db: Session, room_id: int, payload: RoomUpdate):
    room = get_room_by_id(db, room_id)
    if not room:
        return None
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(room, key, value)
    db.commit()
    db.refresh(room)
    return room


def delete_room(db: Session, room_id: int) -> bool:
    room = get_room_by_id(db, room_id)
    if not room:
        return False
    db.delete(room)
    db.commit()
    return True
