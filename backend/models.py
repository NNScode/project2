from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum, Text
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime


class AttendanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    NEEDS_REVIEW = "NEEDS_REVIEW"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    PROCTOR = "PROCTOR"
    STUDENTS = "STUDENTS"


class ExamStatus(str, enum.Enum):
    PAST = "PAST"
    NOW = "NOW"
    FUTURE = "FUTURE"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(20), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENTS)

    student_profile = relationship("Student", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_number = Column(String(20), unique=True, index=True, nullable=False)
    cccd_number = Column(String(20), unique=True, index=True, nullable=False)
    cccd_image_url = Column(String(255), nullable=True)
    face_vector = Column(Text, nullable=True)

    user = relationship("User", back_populates="student_profile")
    room_assignments = relationship("RoomStudent", back_populates="student", cascade="all, delete-orphan")
    records = relationship("AttendanceRecord", back_populates="student")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(ExamStatus), nullable=False, default=ExamStatus.FUTURE)
    create_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    rooms = relationship("Room", back_populates="exam")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    proctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    room_name = Column(String(100), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    exam_url = Column(String(255), nullable=True)

    exam = relationship("Exam", back_populates="rooms")
    room_students = relationship("RoomStudent", back_populates="room", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="room")


class RoomStudent(Base):
    __tablename__ = "room_students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)

    student = relationship("Student", back_populates="room_assignments")
    room = relationship("Room", back_populates="room_students")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.PENDING)
    check_in_time = Column(DateTime, nullable=True)
    captured_image_url = Column(String(255), nullable=True)
    liveness_score = Column(Float, nullable=True)
    match_score = Column(Float, nullable=True)
    proctor_note = Column(Text, nullable=True)
    check_in_attempt_count = Column(Integer, nullable=False, default=0)

    room = relationship("Room", back_populates="attendance_records")
    student = relationship("Student", back_populates="records")