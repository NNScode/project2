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


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None
    check_in_time: Optional[datetime] = None
    captured_image_url: Optional[str] = None
    liveness_score: Optional[float] = None
    match_score: Optional[float] = None
    proctor_note: Optional[str] = None


class AttendanceRead(AttendanceBase):
    id: int
    student_number: Optional[str] = None
    full_name: Optional[str] = None
    room_name: Optional[str] = None

    class Config:
        from_attributes = True


class CheckInRead(BaseModel):
    id: int
    status: AttendanceStatus
    match_score: Optional[float] = None
    liveness_score: Optional[float] = None
    distance: float
    tolerance: float
    is_same_person: bool
    message: str
