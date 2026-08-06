"""create flashcards table

Revision ID: 0b21aaec01bb
Revises: 6b2107169ebe
Create Date: 2026-08-04 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "0b21aaec01bb"
down_revision = "6b2107169ebe"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "flashcards",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("note_id", sa.Uuid(), sa.ForeignKey("notes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("front", sa.String(), nullable=False),
        sa.Column("back", sa.String(), nullable=False),
        sa.Column("front_variants", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("variant_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stability", sa.Float(), nullable=False, server_default="0"),
        sa.Column("difficulty", sa.Float(), nullable=False, server_default="0"),
        sa.Column("elapsed_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("scheduled_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reps", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lapses", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("state", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("due", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_review", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_flashcards_note_id", "flashcards", ["note_id"])
    op.create_index("ix_flashcards_user_id", "flashcards", ["user_id"])


def downgrade():
    op.drop_index("ix_flashcards_user_id", table_name="flashcards")
    op.drop_index("ix_flashcards_note_id", table_name="flashcards")
    op.drop_table("flashcards")
