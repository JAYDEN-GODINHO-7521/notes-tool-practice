"""add note.position, user.notes_view, labels + note_labels tables

Revision ID: b52adb6ad2d2
Revises: b0719cea4743
Create Date: 2026-08-13 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision = "b52adb6ad2d2"
down_revision = "b0719cea4743"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("notes", sa.Column("position", sa.Float(), nullable=False, server_default="0"))
    op.add_column(
        "users", sa.Column("notes_view", sa.String(length=16), nullable=False, server_default="grid")
    )

    op.create_table(
        "labels",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=False, server_default="default"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_labels_user_id", "labels", ["user_id"])

    op.create_table(
        "note_labels",
        sa.Column("note_id", sa.Uuid(), sa.ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("label_id", sa.Uuid(), sa.ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True),
    )

    op.execute(
        """
        UPDATE notes
        SET position = sub.rn
        FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
            FROM notes
        ) AS sub
        WHERE notes.id = sub.id
        """
    )


def downgrade():
    op.drop_table("note_labels")
    op.drop_index("ix_labels_user_id", table_name="labels")
    op.drop_table("labels")
    op.drop_column("users", "notes_view")
    op.drop_column("notes", "position")
