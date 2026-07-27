"""Shared FastAPI dependencies. get_current_user() will be implemented in the
auth task (backend-auth-notes) and used by every protected router."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Decode the JWT bearer token and return the associated user.

    TODO(backend-auth-notes): decode JWT with app.services.auth_service,
    look up the user in the DB, raise 401 on invalid/expired token.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Auth not implemented yet - see todo: backend-auth-notes",
    )
