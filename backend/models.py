from sqlalchemy import Column, Integer, String, TIMESTAMP
from database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_code = Column(String(20), unique=True, index=True)
    full_name = Column(String(100))
    cccd_number = Column(String(12), unique=True)
    created_at = Column(TIMESTAMP)