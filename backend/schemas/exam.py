from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from models import ExamStatus


class ExamBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ExamStatus = ExamStatus.FUTURE


class ExamCreate(ExamBase):
    pass


class ExamRead(ExamBase):
    id: int
    create_at: datetime

    class Config:
        from_attributes = True
