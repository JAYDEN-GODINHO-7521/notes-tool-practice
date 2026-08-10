"""add fsrs_card_data to flashcards, create review_log table

Revision ID: b0719cea4743
Revises: 0b21aaec01bb
Create Date: 2026-08-06 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "b0719cea4743"
down_revision = "0b21aaec01bb"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("flashcards", sa.Column("fsrs_card_data", sa.JSON(), nullable=True))

    op.create_table(
        "review_log",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "flashcard_id", sa.Uuid(), sa.ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("elapsed_ms", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_review_log_flashcard_id", "review_log", ["flashcard_id"])
    op.create_index("ix_review_log_user_id", "review_log", ["user_id"])
    op.create_index("ix_review_log_user_reviewed_at", "review_log", ["user_id", "reviewed_at"])


def downgrade():
    op.drop_index("ix_review_log_user_reviewed_at", table_name="review_log")
    op.drop_index("ix_review_log_user_id", table_name="review_log")
    op.drop_index("ix_review_log_flashcard_id", table_name="review_log")
    op.drop_table("review_log")
    op.drop_column("flashcards", "fsrs_card_data")
