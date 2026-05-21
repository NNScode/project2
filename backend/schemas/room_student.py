from pydantic import BaseModel


class RoomStudentBase(BaseModel):
    student_id: int
    room_id: int


class RoomStudentCreate(RoomStudentBase):
    pass


class RoomStudentRead(RoomStudentBase):
    id: int

    class Config:
        from_attributes = True
