"""markdown content migration: content JSONB -> text, add highlighted_spans

Originally flattened existing TipTap JSON `content` into plain markdown
text before changing the column type — see ADR-001 /
session-summary-markdown-editor-migration.md. That flatten step has been
removed here since this DB is stateless (no existing notes to migrate);
this now only performs the schema change.

Revision ID: c1a9f3e7d2b4
Revises: b52adb6ad2d2
Create Date: 2026-08-26 00:00:00
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "c1a9f3e7d2b4"
down_revision = "b52adb6ad2d2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "notes", sa.Column("highlighted_spans", sa.JSON(), nullable=False, server_default="[]")
    )
    op.alter_column(
        "notes",
        "content",
        type_=sa.Text(),
        postgresql_using="content::text",
        server_default="",
    )


def downgrade():
    op.alter_column(
        "notes",
        "content",
        type_=JSONB(),
        postgresql_using="content::jsonb",
        server_default="{}",
    )
    op.drop_column("notes", "highlighted_spans")