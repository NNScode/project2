from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.user import UserCreate, UserRead, UserUpdate
from schemas.common import PaginatedResponse
from crud.user import get_users, get_user_by_id, create_user, update_user, delete_user
import models

router = APIRouter(prefix="/users", tags=["users"])


def _require_admin_or_proctor(user: models.User):
    if user.role not in (models.UserRole.ADMIN, models.UserRole.PROCTOR):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")


@router.get("/", response_model=PaginatedResponse[UserRead])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: models.UserRole | None = None,
    has_student_profile: bool | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin_or_proctor(current_user)
    return get_users(
        db,
        page=page,
        page_size=page_size,
        search=search,
        role=role,
        has_student_profile=has_student_profile,
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


@router.post("/", response_model=UserRead)
def add_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được thêm người dùng")
    try:
        return create_user(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{user_id}", response_model=UserRead)
def edit_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được sửa người dùng")
    try:
        user = update_user(db, user_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Chỉ quản trị viên mới được xóa người dùng")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản đang đăng nhập")
    if not delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return {"message": "Đã xóa người dùng"}
