from sqlalchemy.orm import Session
import models
from schemas.exam import ExamCreate, ExamUpdate


def get_exams(db: Session):
    return db.query(models.Exam).order_by(models.Exam.id.desc()).all()


def get_exam_by_id(db: Session, exam_id: int):
    return db.query(models.Exam).filter(models.Exam.id == exam_id).first()


def create_exam(db: Session, payload: ExamCreate):
    exam = models.Exam(**payload.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


def update_exam(db: Session, exam_id: int, payload: ExamUpdate):
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        return None
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(exam, key, value)
    db.commit()
    db.refresh(exam)
    return exam


def delete_exam(db: Session, exam_id: int) -> bool:
    exam = get_exam_by_id(db, exam_id)
    if not exam:
        return False
    db.delete(exam)
    db.commit()
    return True
