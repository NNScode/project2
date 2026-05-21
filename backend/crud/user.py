from sqlalchemy.orm import Session
import models
from schemas.user import UserCreate, UserUpdate
from core.security import get_password_hash, verify_password


def get_users(db: Session):
    return db.query(models.User).order_by(models.User.id.desc()).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, user_name: str):
    return db.query(models.User).filter(models.User.user_name == user_name).first()


def authenticate_user(db: Session, user_name: str, password: str):
    user = get_user_by_username(db, user_name)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def create_user(db: Session, payload: UserCreate):
    if get_user_by_username(db, payload.user_name):
        raise ValueError("Tên đăng nhập đã tồn tại")

    user = models.User(
        user_name=payload.user_name,
        full_name=payload.full_name,
        role=payload.role,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, payload: UserUpdate):
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    data = payload.model_dump(exclude_unset=True)
    if "user_name" in data:
        existing = get_user_by_username(db, data["user_name"])
        if existing and existing.id != user_id:
            raise ValueError("Tên đăng nhập đã tồn tại")
        user.user_name = data["user_name"]
    if "full_name" in data:
        user.full_name = data["full_name"]
    if "role" in data:
        user.role = data["role"]
    if data.get("password"):
        user.password_hash = get_password_hash(data["password"])

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True


def ensure_seed_admin(db: Session):
    if get_user_by_username(db, "admin"):
        return None
    admin = models.User(
        user_name="admin",
        full_name="Quản trị viên",
        role=models.UserRole.ADMIN,
        password_hash=get_password_hash("admin123"),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
