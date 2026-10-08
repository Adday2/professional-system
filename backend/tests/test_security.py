from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hash_is_different_from_plain_password():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert hashed_password != password


def test_password_verification_succeeds_for_correct_password():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    assert verify_password(
        password,
        hashed_password,
    )


def test_password_verification_fails_for_wrong_password():
    password = "TestPassword123!"
    wrong_password = "WrongPassword123!"

    hashed_password = hash_password(password)

    assert not verify_password(
        wrong_password,
        hashed_password,
    )


def test_access_token_contains_user_id():
    user_id = "123"

    token = create_access_token(user_id)
    payload = decode_access_token(token)

    assert payload["sub"] == user_id


def test_access_token_contains_expiration():
    token = create_access_token("123")
    payload = decode_access_token(token)

    assert "exp" in payload