from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RoomBase(BaseModel):
    exam_id: int
    room_name: str
    start_time: datetime
    end_time: datetime
    exam_url: Optional[str] = None
    proctor_id: Optional[int] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    exam_url: Optional[str] = None
    proctor_id: Optional[int] = None
    exam_id: Optional[int] = None


class RoomRead(RoomBase):
    id: int

    class Config:
        from_attributes = True
