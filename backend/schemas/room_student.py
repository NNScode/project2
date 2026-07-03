from pydantic import BaseModel, Field
from typing import Optional


class RoomStudentBase(BaseModel):
    student_id: int
    room_id: int


class RoomStudentCreate(RoomStudentBase):
    pass


class RoomStudentBulkCreate(BaseModel):
    room_id: int
    student_ids: list[int] = Field(..., min_length=1)


class RoomStudentBulkResult(BaseModel):
    created: int
    skipped: int


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
