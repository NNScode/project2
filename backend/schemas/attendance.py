from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models import AttendanceStatus


class AttendanceBase(BaseModel):
    room_id: int
    student_id: int
    status: AttendanceStatus = AttendanceStatus.PENDING
    check_in_time: Optional[datetime] = None
    captured_image_url: Optional[str] = None
    liveness_score: Optional[float] = None
    match_score: Optional[float] = None
    proctor_note: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceRead(AttendanceBase):
    id: int

    class Config:
        from_attributes = True
