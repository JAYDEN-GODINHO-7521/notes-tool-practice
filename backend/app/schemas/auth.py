"""Auth request/response schemas."""
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterSchema(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    name: str


class UserResponse(BaseModel):
    user: UserOut
