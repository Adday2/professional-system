from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, SecretStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: SecretStr = Field(min_length=8)


class UserUpdate(BaseModel):
    name: str
    email: EmailStr


class RoleUpdate(BaseModel):
    role: Literal["admin", "user"]

class PasswordChange(BaseModel):
    current_password: SecretStr
    new_password: SecretStr = Field(min_length=8)

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Literal["admin", "user"]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

