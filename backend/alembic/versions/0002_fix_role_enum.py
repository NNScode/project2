"""fix role enum — add STUDENTS value

Revision ID: 0002_fix_role_enum
Revises: 0001_init_schema
Create Date: 2026-06-04
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_fix_role_enum"
down_revision = "0001_init_schema"
branch_labels = None
depends_on = None


def upgrade():
    # Thêm STUDENTS vào ENUM và đảm bảo NOT NULL + thống nhất với models.py
    op.alter_column(
        "users",
        "role",
        existing_type=sa.Enum("ADMIN", "PROCTOR", name="userrole"),
        type_=sa.Enum("ADMIN", "PROCTOR", "STUDENTS", name="userrole"),
        existing_nullable=True,
        nullable=False,
    )


def downgrade():
    # Không thể xóa STUDENTS nếu có dữ liệu dùng nó — set nullable để an toàn
    op.alter_column(
        "users",
        "role",
        existing_type=sa.Enum("ADMIN", "PROCTOR", "STUDENTS", name="userrole"),
        type_=sa.Enum("ADMIN", "PROCTOR", name="userrole"),
        existing_nullable=False,
        nullable=True,
    )
