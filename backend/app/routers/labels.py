"""Labels router: CRUD for /api/labels, scoped to current_user."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.label import Label
from app.models.user import User
from app.schemas.label import LabelCreate, LabelOut, LabelUpdate

router = APIRouter()


def _get_owned_label(label_id: uuid.UUID, db: Session, current_user: User) -> Label:
    label = db.get(Label, label_id)
    if not label or label.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    return label


@router.get("", response_model=list[LabelOut])
def list_labels(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Label).where(Label.user_id == current_user.id).order_by(Label.name)
    return db.execute(stmt).scalars().all()


@router.post("", response_model=LabelOut, status_code=status.HTTP_201_CREATED)
def create_label(
    payload: LabelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.execute(
        select(Label).where(Label.user_id == current_user.id, Label.name == payload.name)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Label already exists")

    label = Label(user_id=current_user.id, name=payload.name, color=payload.color)
    db.add(label)
    db.commit()
    db.refresh(label)
    return label


@router.patch("/{label_id}", response_model=LabelOut)
def update_label(
    label_id: uuid.UUID,
    payload: LabelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    label = _get_owned_label(label_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(label, field, value)
    db.commit()
    db.refresh(label)
    return label


@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(
    label_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    label = _get_owned_label(label_id, db, current_user)
    db.delete(label)
    db.commit()
    return None
