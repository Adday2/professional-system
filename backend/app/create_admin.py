from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import User


def main() -> None:
    print("Create the initial administrator account")
    print("----------------------------------------")

    name = input("Name: ").strip()
    email_input = input("Email: ").strip().lower()

    if not name:
        print("Error: Name cannot be empty.")
        return

    try:
        email = str(TypeAdapter(EmailStr).validate_python(email_input))
    except ValidationError:
        print("Error: Enter a valid email address.")
        return

    password = getpass("Password (minimum 8 characters): ")
    confirm_password = getpass("Confirm password: ")

    if len(password) < 8:
        print("Error: Password must contain at least 8 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("Error: An account with this email already exists.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
        )

        db.add(admin)
        db.commit()

        print(f"Administrator account created for {email}.")

    except IntegrityError:
        db.rollback()
        print("Error: The account could not be created because of a database constraint.")
    finally:
        db.close()


if __name__ == "__main__":
    main()