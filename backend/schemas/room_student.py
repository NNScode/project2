from pydantic import BaseModel
from typing import Optional


class RoomStudentBase(BaseModel):
    student_id: int
    room_id: int


class RoomStudentCreate(RoomStudentBase):
    pass


class RoomStudentUpdate(BaseModel):
    student_id: Optional[int] = None
    room_id: Optional[int] = None


class RoomStudentRead(RoomStudentBase):
    id: int
    student_number: Optional[str] = None
    full_name: Optional[str] = None
    room_name: Optional[str] = None
    exam_name: Optional[str] = None

    class Config:
        from_attributes = True
