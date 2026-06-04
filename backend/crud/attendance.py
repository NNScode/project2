from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from schemas.attendance import AttendanceCreate


def get_attendance_records(db: Session):
    return db.query(models.AttendanceRecord).order_by(models.AttendanceRecord.id.desc()).all()


def create_attendance_record(db: Session, payload: AttendanceCreate):
    record = models.AttendanceRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_dashboard_summary(db: Session):
    return {
        "total_users": db.query(func.count(models.User.id)).scalar() or 0,
        "total_students": db.query(func.count(models.Student.id)).scalar() or 0,
        "total_exams": db.query(func.count(models.Exam.id)).scalar() or 0,
        "total_rooms": db.query(func.count(models.Room.id)).scalar() or 0,
        "total_room_students": db.query(func.count(models.RoomStudent.id)).scalar() or 0,
        "total_attendance_records": db.query(func.count(models.AttendanceRecord.id)).scalar() or 0,
    }
