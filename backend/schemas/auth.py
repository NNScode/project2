from pydantic import BaseModel
from models import UserRole


class LoginRequest(BaseModel):
    user_name: str
    password: str


class UserPublic(BaseModel):
    id: int
    user_name: str
    full_name: str
    role: UserRole

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
