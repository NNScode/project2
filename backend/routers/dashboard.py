from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from crud.attendance import (
    get_dashboard_summary,
    get_proctor_dashboard,
    get_student_dashboard,
)
import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == models.UserRole.ADMIN:
        return get_dashboard_summary(db)
    if current_user.role == models.UserRole.PROCTOR:
        return get_proctor_dashboard(db, current_user.id)
    return get_student_dashboard(db, current_user.id)
