import os
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure tests never use the application's real database or JWT secret.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = (
    "pytest-only-secret-key-not-for-production-123456"
)
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

from app.core.security import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import User


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        name="Test Admin",
        email="admin-test@example.com",
        password_hash=hash_password("AdminPass123!"),
        role="admin",
        created_at=datetime.now(),
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture
def regular_user(db_session):
    user = User(
        name="Test User",
        email="user-test@example.com",
        password_hash=hash_password("UserPass123!"),
        role="user",
        created_at=datetime.now(),
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user