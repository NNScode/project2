from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceRead, CheckInRead
from schemas.common import PaginatedResponse
from crud.attendance import (
    get_attendance_records,
    update_attendance_record,
    delete_attendance_record,
    create_attendance_record,
    student_check_in,
)
import models

router = APIRouter(prefix="/attendance-records", tags=["attendance-records"])


def _require_staff(user: models.User):
    if user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")


@router.post("/check-in", response_model=CheckInRead)
async def check_in(
    room_id: int = Form(...),
    file: UploadFile = File(...),
    liveness_score: float | None = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.STUDENTS:
        raise HTTPException(status_code=403, detail="Chỉ thí sinh mới được điểm danh")
    data = await file.read()
    try:
        return student_check_in(
            db,
            current_user.id,
            room_id,
            data,
            file.content_type,
            liveness_score,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=PaginatedResponse[AttendanceRead])
def list_attendance_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: models.AttendanceStatus | None = None,
    room_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_staff(current_user)
    proctor_id = current_user.id if current_user.role == models.UserRole.PROCTOR else None
    return get_attendance_records(
        db,
        page=page,
        page_size=page_size,
        proctor_id=proctor_id,
        search=search,
        status=status,
        room_id=room_id,
    )


@router.post("/", response_model=AttendanceRead)
def add_attendance_record(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được thêm bản ghi thủ công")
    try:
        return create_attendance_record(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{record_id}", response_model=AttendanceRead)
def edit_attendance_record(
    record_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_staff(current_user)
    if current_user.role == models.UserRole.PROCTOR:
        rec = (
            db.query(models.AttendanceRecord)
            .join(models.Room)
            .filter(
                models.AttendanceRecord.id == record_id,
                models.Room.proctor_id == current_user.id,
            )
            .first()
        )
        if not rec:
            raise HTTPException(status_code=403, detail="Không có quyền duyệt bản ghi này")
    record = update_attendance_record(db, record_id, payload)
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi điểm danh")
    return record


@router.delete("/{record_id}")
def remove_attendance_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa bản ghi điểm danh")
    if not delete_attendance_record(db, record_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi điểm danh")
    return {"message": "Đã xóa bản ghi điểm danh"}
