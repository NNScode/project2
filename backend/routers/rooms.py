from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.room import RoomCreate, RoomUpdate, RoomRead
from schemas.common import PaginatedResponse
from crud.room import get_rooms, get_room_by_id, get_room_read, create_room, update_room, delete_room
import models

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/", response_model=PaginatedResponse[RoomRead])
def list_rooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    exam_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    proctor_id = current_user.id if current_user.role == models.UserRole.PROCTOR else None
    return get_rooms(
        db,
        page=page,
        page_size=page_size,
        search=search,
        exam_id=exam_id,
        proctor_id=proctor_id,
    )


@router.get("/{room_id}", response_model=RoomRead)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    room = get_room_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng thi")
    if current_user.role == models.UserRole.PROCTOR and room.proctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xem phòng thi này")
    return get_room_read(db, room_id)


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
