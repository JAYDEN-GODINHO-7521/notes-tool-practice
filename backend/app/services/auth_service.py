"""bcrypt password hashing + JWT create/verify.

TODO(backend-auth-notes): implement hash_password, verify_password,
create_access_token, decode_access_token.

JWT-in-httpOnly-cookie note.
token creation stays basically the same (still a signed JWT), but now you also need a helper to set/clear the cookie.
"""
