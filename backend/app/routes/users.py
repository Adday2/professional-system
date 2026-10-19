
import sqlite3

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models import AuditLog, User
from app.schemas import (
    AuditLogResponse,
    RoleUpdate,
    UserCreate,
    UserResponse,
    UserUpdate,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def _is_duplicate_email_error(exc: IntegrityError) -> bool:
    original = exc.orig

    sqlstate = (
        getattr(original, "sqlstate", None)
        or getattr(original, "pgcode", None)
    )

    if sqlstate == "23505":
        diagnostic = getattr(original, "diag", None)
        constraint = getattr(
            diagnostic,
            "constraint_name",
            None,
        )

        return (
            constraint is None
            or "email" in constraint.lower()
        )

    return (
        isinstance(original, sqlite3.IntegrityError)
        and "unique constraint failed: users.email"
        in str(original).lower()
    )


def _add_audit_log(
    db: Session,
    actor: User,
    action: str,
    target_user_id: int | None,
    target_email: str | None,
    details: str | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_user_id=actor.id,
            actor_email=actor.email,
            action=action,
            target_user_id=target_user_id,
            target_email=target_email,
            details=details,
        )
    )


@router.get(
    "/",
    response_model=list[UserResponse],
    dependencies=[Depends(require_admin)],
)
def get_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return (
        db.query(User)
        .order_by(User.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_data: UserCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    email = str(user_data.email).strip().lower()

    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = User(
        name=user_data.name,
        email=email,
        password_hash=hash_password(
            user_data.password.get_secret_value()
        ),
    )

    db.add(user)

    try:
        # Flush assigns the new user's ID without committing.
        db.flush()

        _add_audit_log(
            db=db,
            actor=current_admin,
            action="user_created",
            target_user_id=user.id,
            target_email=user.email,
            details="User account created.",
        )

        # User and audit entry commit together.
        db.commit()
        db.refresh(user)

    except IntegrityError as exc:
        db.rollback()

        if _is_duplicate_email_error(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while creating the user.",
        ) from exc

    return user


@router.get(
    "/audit-logs",
    response_model=list[AuditLogResponse],
    dependencies=[Depends(require_admin)],
)
def get_audit_logs(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    _add_audit_log(
        db=db,
        actor=current_admin,
        action="user_deleted",
        target_user_id=user.id,
        target_email=user.email,
        details="User account deleted.",
    )

    db.delete(user)
    db.commit()


@router.put(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    email = str(user_data.email).strip().lower()

    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.email) == email,
            User.id != user.id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    old_name = user.name
    old_email = user.email

    user.name = user_data.name
    user.email = email

    changed_fields = []

    if old_name != user.name:
        changed_fields.append("name")

    if old_email != user.email:
        changed_fields.append("email")

    try:
        if changed_fields:
            _add_audit_log(
                db=db,
                actor=current_admin,
                action="user_updated",
                target_user_id=user.id,
                target_email=user.email,
                details=(
                    "Updated fields: "
                    + ", ".join(changed_fields)
                ),
            )

        db.commit()
        db.refresh(user)

    except IntegrityError as exc:
        db.rollback()

        if _is_duplicate_email_error(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists.",
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while updating the user.",
        ) from exc

    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
)
def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    old_role = user.role

    if old_role != role_data.role:
        user.role = role_data.role

        _add_audit_log(
            db=db,
            actor=current_admin,
            action="role_changed",
            target_user_id=user.id,
            target_email=user.email,
            details=f"Role changed from {old_role} to {user.role}.",
        )

        db.commit()
        db.refresh(user)

    return user
