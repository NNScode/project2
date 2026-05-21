from sqlalchemy.orm import Session
import models
from schemas.room import RoomCreate


def get_rooms(db: Session):
    return db.query(models.Room).order_by(models.Room.id.desc()).all()


def create_room(db: Session, payload: RoomCreate):
    room = models.Room(**payload.dict())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room
