"""add check_in_attempt_count

Revision ID: 0004_check_in_attempt_count
Revises: 0003_drop_legacy_columns
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_check_in_attempt_count"
down_revision = "0003_drop_legacy_columns"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "attendance_records",
        sa.Column("check_in_attempt_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_column("attendance_records", "check_in_attempt_count")
