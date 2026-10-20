import os

from slowapi import Limiter
from slowapi.util import get_remote_address

app_environment = os.getenv(
    "APP_ENV",
    "production",
).strip().lower()

limiter = Limiter(
    key_func=get_remote_address,
    enabled=app_environment != "test",
)