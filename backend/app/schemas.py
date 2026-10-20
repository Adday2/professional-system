
from datetime import datetime
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    SecretStr,
    StringConstraints,
    BeforeValidator
)

def normalize_email(value: object) -> object:
    if isinstance(value, str):
        return value.strip().lower()
    return value


NormalizedEmail = Annotated[
    EmailStr,
    BeforeValidator(normalize_email),
]


UserName = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=100,
    ),
]


class UserCreate(BaseModel):
    name: UserName
    email: NormalizedEmail
    password: SecretStr = Field(
        min_length=8,
        max_length=128,
    )


class UserUpdate(BaseModel):
    name: UserName
    email: NormalizedEmail


class RoleUpdate(BaseModel):
    role: Literal["admin", "user"]


class PasswordChange(BaseModel):
    current_password: SecretStr = Field(max_length=128)
    new_password: SecretStr = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Literal["admin", "user"]
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    skip: int
    limit: int


class UserStatsResponse(BaseModel):
    total_users: int
    users_created_today: int
    latest_user: UserResponse | None

class AuditLogResponse(BaseModel):
    id: int
    actor_user_id: int | None
    actor_email: str
    action: str
    target_user_id: int | None
    target_email: str | None
    details: str | None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

