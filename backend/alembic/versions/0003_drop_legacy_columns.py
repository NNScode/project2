"""drop legacy duplicate columns

Revision ID: 0003_drop_legacy_columns
Revises: 0002_fix_role_enum
Create Date: 2026-06-04

Xóa các cột cũ (schema gốc) đã được thay thế bởi cột mới trong models.py:
  users.username        → đã có user_name
  students.student_code → đã có student_number
  rooms.meeting_url     → đã có exam_url
  exams.created_at      → đã có create_at
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_drop_legacy_columns"
down_revision = "0002_fix_role_enum"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("users",    "username")
    op.drop_column("students", "student_code")
    op.drop_column("rooms",    "meeting_url")
    op.drop_column("exams",    "created_at")


def downgrade():
    op.add_column("exams",    sa.Column("created_at", sa.DateTime(), nullable=True))
    op.add_column("rooms",    sa.Column("meeting_url", sa.String(255), nullable=True))
    op.add_column("students", sa.Column("student_code", sa.String(20), nullable=True))
    op.add_column("users",    sa.Column("username", sa.String(50), nullable=True))
