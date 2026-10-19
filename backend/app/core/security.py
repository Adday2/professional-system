from datetime import datetime, timedelta, timezone
import os

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash

import hashlib
import hmac

load_dotenv()


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

_PLACEHOLDER_MARKERS = (
    "change_me",
    "changeme",
    "replace_me",
    "replace-me",
    "placeholder",
    "your_secret",
    "your-secret",
    "example",
    "123456789abcdef",
)

if not JWT_SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY is not configured."
    )

if len(JWT_SECRET_KEY.encode("utf-8")) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY must be at least 32 bytes long for HS256."
    )

if any(
    marker in JWT_SECRET_KEY.lower()
    for marker in _PLACEHOLDER_MARKERS
):
    raise RuntimeError(
        "JWT_SECRET_KEY is a placeholder. "
        "Generate a random secret and set it in .env."
    )

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password,
    )

def password_token_version(hashed_password: str) -> str:
    return hmac.new(
        JWT_SECRET_KEY.encode("utf-8"),
        hashed_password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    *,
    password_hash_value: str | None = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(
            minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": subject,
        "exp": expire,
    }

    if password_hash_value is not None:
        payload["pwdv"] = password_token_version(
            password_hash_value
        )

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
    )