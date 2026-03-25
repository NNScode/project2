from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import engine, get_db
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hệ thống điểm danh thi trực tuyến tích hợp CCCD")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Test Database: Lấy danh sách thí sinh
@app.get("/api/v1/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(models.Student).all()
    return {
        "status": "success",
        "total": len(students),
        "data": students
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)