from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.attendance import AttendanceCreate, AttendanceRead
from crud.attendance import get_attendance_records, create_attendance_record

router = APIRouter(prefix="/attendance-records", tags=["attendance-records"])


@router.get("/", response_model=List[AttendanceRead])
def list_attendance_records(db: Session = Depends(get_db)):
    return get_attendance_records(db)


@router.post("/", response_model=AttendanceRead)
def add_attendance_record(payload: AttendanceCreate, db: Session = Depends(get_db)):
    return create_attendance_record(db, payload)
