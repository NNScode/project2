from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.room_student import RoomStudentCreate, RoomStudentUpdate, RoomStudentRead, RoomStudentBulkCreate, RoomStudentBulkResult
from schemas.common import PaginatedResponse
from crud.room_student import (
    get_room_students,
    get_room_student_by_id,
    create_room_student,
    create_room_students_bulk,
    update_room_student,
    delete_room_student,
)
import models

router = APIRouter(prefix="/room-students", tags=["room-students"])


def _require_staff(user: models.User):
    if user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")


@router.get("/", response_model=PaginatedResponse[RoomStudentRead])
def list_room_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    room_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_staff(current_user)
    return get_room_students(db, page=page, page_size=page_size, search=search, room_id=room_id)


@router.post("/bulk", response_model=RoomStudentBulkResult)
def add_room_students_bulk(
    payload: RoomStudentBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được gán thí sinh")
    try:
        return create_room_students_bulk(db, payload.room_id, payload.student_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=RoomStudentRead)
def add_room_student(
    payload: RoomStudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được gán thí sinh")
    try:
        return create_room_student(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{rs_id}", response_model=RoomStudentRead)
def edit_room_student(
    rs_id: int,
    payload: RoomStudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được sửa gán phòng")
    try:
        rs = update_room_student(db, rs_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not rs:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi gán phòng")
    return rs


@router.delete("/{rs_id}")
def remove_room_student(
    rs_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa gán phòng")
    if not delete_room_student(db, rs_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi gán phòng")
    return {"message": "Đã xóa gán phòng"}
