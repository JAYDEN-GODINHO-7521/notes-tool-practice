"""SQLAlchemy models. Import all models here so Alembic autogenerate can see them."""
from app.database import Base  # noqa: F401

from app.models.user import User  # noqa: F401
from app.models.label import Label, note_labels  # noqa: F401
from app.models.note import Note  # noqa: F401
from app.models.flashcard import Flashcard  # noqa: F401
from app.models.review_log import ReviewLog  # noqa: F401
