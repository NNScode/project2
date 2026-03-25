from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Hệ thống Điểm danh Thi trực tuyến", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Backend FastAPI đang hoạt động!"}

@app.post("/api/v1/attendance/verify-cccd")
async def verify_cccd(file: UploadFile = File(...)):
    contents = await file.read()
    return {
        "status": "success",
        "message": "Đã nhận ảnh thành công, đang chờ AI xử lý...",
        "filename": file.filename
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)