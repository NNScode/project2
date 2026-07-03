from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import SessionLocal
from crud.user import ensure_seed_admin
from core.config import UPLOAD_DIR
from core.uploads import ensure_upload_dirs
from routers import (
    auth_router,
    users_router,
    students_router,
    exams_router,
    rooms_router,
    room_students_router,
    attendance_router,
    dashboard_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_upload_dirs()
    db = SessionLocal()
    try:
        ensure_seed_admin(db)
    finally:
        db.close()
    yield


app = FastAPI(title="FacePass API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(students_router)
app.include_router(exams_router)
app.include_router(rooms_router)
app.include_router(room_students_router)
app.include_router(attendance_router)
app.include_router(dashboard_router)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.get("/")
def read_root():
    return {"message": "FacePass API đang chạy"}


@app.get("/health")
def health_check():
    return {"status": "ok"}