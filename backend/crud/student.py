from sqlalchemy.orm import Session
import models
from schemas.student import StudentCreate


def get_students(db: Session):
    return db.query(models.Student).order_by(models.Student.id.desc()).all()


def create_student(db: Session, payload: StudentCreate):
    student = models.Student(**payload.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student
