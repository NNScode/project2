from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from crud.attendance import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)
