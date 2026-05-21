from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas.room import RoomCreate, RoomRead
from crud.room import get_rooms, create_room

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", response_model=List[RoomRead])
def list_rooms(db: Session = Depends(get_db)):
    return get_rooms(db)


@router.post("/", response_model=RoomRead)
def add_room(payload: RoomCreate, db: Session = Depends(get_db)):
    return create_room(db, payload)
