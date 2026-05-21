from sqlalchemy.orm import Session
import models
from schemas.exam import ExamCreate


def get_exams(db: Session):
    return db.query(models.Exam).order_by(models.Exam.id.desc()).all()


def create_exam(db: Session, payload: ExamCreate):
    exam = models.Exam(**payload.dict())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam
