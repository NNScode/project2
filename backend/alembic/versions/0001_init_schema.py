"""init schema

Revision ID: 0001_init_schema
Revises:
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_init_schema"
down_revision = None
branch_labels = None
depends_on = None


user_role_enum = sa.Enum("ADMIN", "PROCTOR", "STUDENTS", name="userrole")
exam_status_enum = sa.Enum("PAST", "NOW", "FUTURE", name="examstatus")
attendance_status_enum = sa.Enum("PENDING", "SUCCESS", "FAILED", "NEEDS_REVIEW", name="attendancestatus")


def upgrade():
    user_role_enum.create(op.get_bind(), checkfirst=True)
    exam_status_enum.create(op.get_bind(), checkfirst=True)
    attendance_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_name", sa.String(length=20), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role_enum, nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_user_name", "users", ["user_name"], unique=True)

    op.create_table(
        "exams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", exam_status_enum, nullable=False),
        sa.Column("create_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_exams_id", "exams", ["id"])

    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("student_number", sa.String(length=20), nullable=False, unique=True),
        sa.Column("cccd_number", sa.String(length=20), nullable=False, unique=True),
        sa.Column("cccd_image_url", sa.String(length=255), nullable=True),
        sa.Column("face_vector", sa.Text(), nullable=True),
    )
    op.create_index("ix_students_id", "students", ["id"])
    op.create_index("ix_students_student_number", "students", ["student_number"], unique=True)
    op.create_index("ix_students_cccd_number", "students", ["cccd_number"], unique=True)

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exam_id", sa.Integer(), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("room_name", sa.String(length=100), nullable=False),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=False),
        sa.Column("exam_url", sa.String(length=255), nullable=True),
    )
    op.create_index("ix_rooms_id", "rooms", ["id"])

    op.create_table(
        "room_students",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("room_id", sa.Integer(), sa.ForeignKey("rooms.id"), nullable=False),
    )
    op.create_index("ix_room_students_id", "room_students", ["id"])

    op.create_table(
        "attendance_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("room_id", sa.Integer(), sa.ForeignKey("rooms.id"), nullable=False),
        sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("status", attendance_status_enum, nullable=False),
        sa.Column("check_in_time", sa.DateTime(), nullable=True),
        sa.Column("captured_image_url", sa.String(length=255), nullable=True),
        sa.Column("liveness_score", sa.Float(), nullable=True),
        sa.Column("match_score", sa.Float(), nullable=True),
        sa.Column("proctor_note", sa.Text(), nullable=True),
    )
    op.create_index("ix_attendance_records_id", "attendance_records", ["id"])


def downgrade():
    op.drop_index("ix_attendance_records_id", table_name="attendance_records")
    op.drop_table("attendance_records")

    op.drop_index("ix_room_students_id", table_name="room_students")
    op.drop_table("room_students")

    op.drop_index("ix_rooms_id", table_name="rooms")
    op.drop_table("rooms")

    op.drop_index("ix_students_cccd_number", table_name="students")
    op.drop_index("ix_students_student_number", table_name="students")
    op.drop_index("ix_students_id", table_name="students")
    op.drop_table("students")

    op.drop_index("ix_exams_id", table_name="exams")
    op.drop_table("exams")

    op.drop_index("ix_users_user_name", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

    attendance_status_enum.drop(op.get_bind(), checkfirst=True)
    exam_status_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
