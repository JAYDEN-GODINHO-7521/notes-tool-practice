"""Shared FastAPI dependencies. get_current_user() will be fully implemented in
the auth task (backend-auth-notes) and used by every protected router.

Auth transport: JWT delivered as an httpOnly cookie named "access_token"
(set/cleared by app/routers/auth.py), NOT an Authorization: Bearer header.
"""
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Read the access_token cookie, decode the JWT, and return the user.

    TODO(backend-auth-notes): decode JWT with app.services.auth_service,
    look up the user in the DB, raise 401 on invalid/expired/missing token.
    """
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Auth not implemented yet - see todo: backend-auth-notes",
    )
