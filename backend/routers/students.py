from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.student import StudentCreate, StudentUpdate, StudentRead, StudentExamContextRead
from crud.student import (
    get_students,
    get_student_by_id,
    get_student_exam_context,
    create_student,
    update_student,
    delete_student,
    save_student_cccd_image,
)
import models

router = APIRouter(prefix="/students", tags=["students"])


def _require_staff(user: models.User):
    if user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")


@router.get("/", response_model=List[StudentRead])
def list_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_staff(current_user)
    return get_students(db)


@router.get("/me/exam-context", response_model=StudentExamContextRead)
def my_exam_context(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.STUDENTS:
        raise HTTPException(status_code=403, detail="Chỉ thí sinh mới truy cập")
    ctx = get_student_exam_context(db, current_user.id)
    if not ctx:
        raise HTTPException(status_code=400, detail="Chưa có hồ sơ thí sinh")
    return ctx


@router.get("/{student_id}", response_model=StudentRead)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_staff(current_user)
    student = get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy thí sinh")
    return student


@router.post("/", response_model=StudentRead)
def add_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được thêm thí sinh")
    try:
        return create_student(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{student_id}", response_model=StudentRead)
def edit_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được sửa thí sinh")
    student = update_student(db, student_id, payload)
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy thí sinh")
    return student


@router.post("/{student_id}/cccd-image", response_model=StudentRead)
async def upload_cccd_image(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được tải ảnh CCCD")
    if not file.content_type:
        raise HTTPException(status_code=400, detail="Không xác định được loại file")

    data = await file.read()
    try:
        student = save_student_cccd_image(db, student_id, data, file.content_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy thí sinh")
    return student


@router.delete("/{student_id}")
def remove_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa thí sinh")
    if not delete_student(db, student_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy thí sinh")
    return {"message": "Đã xóa thí sinh"}
