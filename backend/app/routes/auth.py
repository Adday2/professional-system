from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.schemas import PasswordChange, UserResponse
from app.core.limiter import limiter

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

# Used to perform password verification when an account is not found.
# This helps reduce timing differences between login failure paths.
DUMMY_PASSWORD_HASH = hash_password(
    "dummy-password-for-timing-equalization-only"
)


@router.post("/login")
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            func.lower(User.email)
            == form_data.username.strip().lower()
        )
        .first()
    )

    if not user or not user.password_hash:
        verify_password(
            form_data.password,
            DUMMY_PASSWORD_HASH,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(user.id),
        password_hash_value=user.password_hash,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post("/change-password")
@limiter.limit("5/minute")
def change_password(
    request: Request,
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account does not have a password set.",
        )

    if not verify_password(
        password_data.current_password.get_secret_value(),
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    new_password = password_data.new_password.get_secret_value()

    if verify_password(
        new_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password.",
        )

    current_user.password_hash = hash_password(
        new_password
    )

    db.commit()

    access_token = create_access_token(
        subject=str(current_user.id),
        password_hash_value=current_user.password_hash,
    )

    return {
        "message": "Password changed successfully.",
        "access_token": access_token,
        "token_type": "bearer",
    }