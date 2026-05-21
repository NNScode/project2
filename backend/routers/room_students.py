from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.room_student import RoomStudentCreate, RoomStudentRead
from crud.room_student import get_room_students, create_room_student

router = APIRouter(prefix="/room-students", tags=["room-students"])


@router.get("/", response_model=List[RoomStudentRead])
def list_room_students(db: Session = Depends(get_db)):
    return get_room_students(db)


@router.post("/", response_model=RoomStudentRead)
def add_room_student(payload: RoomStudentCreate, db: Session = Depends(get_db)):
    return create_room_student(db, payload)
