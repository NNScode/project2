from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.room import RoomCreate, RoomUpdate, RoomRead
from crud.room import get_rooms, create_room, update_room, delete_room
import models

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", response_model=List[RoomRead])
def list_rooms(db: Session = Depends(get_db)):
    return get_rooms(db)


@router.post("/", response_model=RoomRead)
def add_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền thêm phòng thi")
    return create_room(db, payload)


@router.put("/{room_id}", response_model=RoomRead)
def edit_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền sửa phòng thi")
    room = update_room(db, room_id, payload)
    if not room:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng thi")
    return room


@router.delete("/{room_id}")
def remove_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa phòng thi")
    if not delete_room(db, room_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng thi")
    return {"message": "Đã xóa phòng thi"}
