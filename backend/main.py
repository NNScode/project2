from fastapi import FastAPI
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hệ thống Điểm danh API")

@app.get("/")
def read_root():
    return {"message": "Chào mừng đến với API Hệ thống điểm danh thi trực tuyến!"}