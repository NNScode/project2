from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.exam import ExamCreate, ExamUpdate, ExamRead
from schemas.common import PaginatedResponse
from crud.exam import get_exams, create_exam, update_exam, delete_exam
import models

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("/", response_model=PaginatedResponse[ExamRead])
def list_exams(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: models.ExamStatus | None = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    return get_exams(db, page=page, page_size=page_size, search=search, status=status)


@router.post("/", response_model=ExamRead)
def add_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được thêm kỳ thi")
    return create_exam(db, payload)


@router.put("/{exam_id}", response_model=ExamRead)
def edit_exam(
    exam_id: int,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được sửa kỳ thi")
    exam = update_exam(db, exam_id, payload)
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy kỳ thi")
    return exam


@router.delete("/{exam_id}")
def remove_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa kỳ thi")
    if not delete_exam(db, exam_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy kỳ thi")
    return {"message": "Đã xóa kỳ thi"}
