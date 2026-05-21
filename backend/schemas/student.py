from typing import Optional
from pydantic import BaseModel


class StudentBase(BaseModel):
    user_id: int
    student_number: str
    cccd_number: str
    cccd_image_url: Optional[str] = None
    face_vector: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentRead(StudentBase):
    id: int

    class Config:
        from_attributes = True
