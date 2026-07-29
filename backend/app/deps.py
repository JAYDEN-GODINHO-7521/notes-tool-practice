"""Shared FastAPI dependencies.

Auth transport: JWT delivered as an httpOnly cookie named "access_token"
(set/cleared by app/routers/auth.py), NOT an Authorization: Bearer header.
"""
import uuid

import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
)


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    """Read the access_token cookie, decode the JWT, and return the user."""
    if not access_token:
        raise CREDENTIALS_EXCEPTION

    try:
        payload = decode_access_token(access_token)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise CREDENTIALS_EXCEPTION

    user = db.get(User, user_id)
    if not user:
        raise CREDENTIALS_EXCEPTION
    return user
