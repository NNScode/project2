from sqlalchemy.orm import Session
import models
from schemas.room_student import RoomStudentCreate


def get_room_students(db: Session):
    return db.query(models.RoomStudent).order_by(models.RoomStudent.id.desc()).all()


def create_room_student(db: Session, payload: RoomStudentCreate):
    room_student = models.RoomStudent(**payload.model_dump())
    db.add(room_student)
    db.commit()
    db.refresh(room_student)
    return room_student
