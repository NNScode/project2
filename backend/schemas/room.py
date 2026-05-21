from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RoomBase(BaseModel):
    exam_id: int
    room_name: str
    start_time: datetime
    end_time: datetime
    exam_url: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int

    class Config:
        from_attributes = True
