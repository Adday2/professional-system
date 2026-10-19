
import pytest
from pydantic import ValidationError

from app.schemas import PasswordChange, UserCreate, UserUpdate

def test_user_create_normalizes_email():
    user = UserCreate(
        name="Test User",
        email="  Bob@Example.com ",
        password="StrongPass123!",
    )

    assert str(user.email) == "bob@example.com"


def test_user_update_normalizes_email():
    user = UserUpdate(
        name="Test User",
        email="  Bob@Example.com ",
    )

    assert str(user.email) == "bob@example.com"
    
def test_user_create_rejects_name_over_100_characters():
    with pytest.raises(ValidationError):
        UserCreate(
            name="A" * 101,
            email="test@example.com",
            password="StrongPass123!",
        )


def test_user_update_rejects_name_over_100_characters():
    with pytest.raises(ValidationError):
        UserUpdate(
            name="A" * 101,
            email="test@example.com",
        )


def test_user_create_rejects_blank_name():
    with pytest.raises(ValidationError):
        UserCreate(
            name="   ",
            email="test@example.com",
            password="StrongPass123!",
        )


def test_user_create_rejects_password_over_128_characters():
    with pytest.raises(ValidationError):
        UserCreate(
            name="Test User",
            email="test@example.com",
            password="A" * 129,
        )


def test_password_change_rejects_oversized_passwords():
    with pytest.raises(ValidationError):
        PasswordChange(
            current_password="CurrentPass123!",
            new_password="N" * 129,
        )

    with pytest.raises(ValidationError):
        PasswordChange(
            current_password="C" * 129,
            new_password="NewPass123!",
        )
