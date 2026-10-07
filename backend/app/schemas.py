from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, SecretStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: SecretStr = Field(min_length=8)


class UserUpdate(BaseModel):
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = {
        "from_attributes": True
    }