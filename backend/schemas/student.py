from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class StudentCreate(BaseModel):
    user_id: int
    student_number: str
    cccd_number: str


class StudentUpdate(BaseModel):
    student_number: Optional[str] = None
    cccd_number: Optional[str] = None


class StudentRead(BaseModel):
    id: int
    user_id: int
    student_number: str
    cccd_number: str
    cccd_image_url: Optional[str] = None
    has_face_vector: bool = False
    full_name: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class StudentRoomContext(BaseModel):
    room_id: int
    room_name: str
    exam_id: int
    exam_name: str
    start_time: datetime
    end_time: datetime
    exam_url: Optional[str] = None
    attendance_status: Optional[str] = None
    can_check_in: bool = False


class StudentExamContextRead(BaseModel):
    student_id: int
    full_name: str
    has_face_vector: bool
    rooms: List[StudentRoomContext]
