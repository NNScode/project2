from sqlalchemy.orm import Session
from sqlalchemy import or_
import models
from schemas.exam import ExamCreate, ExamUpdate
from schemas.common import make_paged, normalize_pagination


def _exams_query(
    db: Session,
    search: str | None = None,
    status: models.ExamStatus | None = None,
):
    q = db.query(models.Exam)
    if status is not None:
        q = q.filter(models.Exam.status == status)
    if search:
        term = f"%{search.strip()}%"
        q = q.filter(
            or_(
                models.Exam.name.ilike(term),
                models.Exam.description.ilike(term),
            )
        )
    return q


def get_exams(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: models.ExamStatus | None = None,
):
    page, page_size, offset = normalize_pagination(page, page_size)
    q = _exams_query(db, search, status)
    total = q.count()
    rows = q.order_by(models.Exam.id.desc()).offset(offset).limit(page_size).all()
    return make_paged(rows, total, page, page_size)


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
