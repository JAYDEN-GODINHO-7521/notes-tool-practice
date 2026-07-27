"""Auth router: /api/auth/register, /api/auth/login, /api/auth/me.

TODO(backend-auth-notes): implement register/login (bcrypt + JWT issue)
and /me (protected via deps.get_current_user).
"""
from fastapi import APIRouter

router = APIRouter()
