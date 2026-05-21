from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.student import StudentCreate, StudentRead
from crud.student import get_students, create_student

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/", response_model=List[StudentRead])
def list_students(db: Session = Depends(get_db)):
    return get_students(db)


@router.post("/", response_model=StudentRead)
def add_student(payload: StudentCreate, db: Session = Depends(get_db)):
    return create_student(db, payload)
