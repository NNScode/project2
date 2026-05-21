from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.exam import ExamCreate, ExamRead
from crud.exam import get_exams, create_exam

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("/", response_model=List[ExamRead])
def list_exams(db: Session = Depends(get_db)):
    return get_exams(db)


@router.post("/", response_model=ExamRead)
def add_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    return create_exam(db, payload)
