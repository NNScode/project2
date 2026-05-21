from typing import Optional
from pydantic import BaseModel
from models import UserRole


class UserBase(BaseModel):
    user_name: str
    full_name: str
    role: UserRole = UserRole.STUDENTS


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    user_name: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True
