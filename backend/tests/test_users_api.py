from app.core.security import verify_password
from app.models import User


def get_token(client, email, password):
    response = client.post(
        "/auth/login",
        data={
            "username": email,
            "password": password,
        },
    )

    assert response.status_code == 200
    return response.json()["access_token"]


def test_admin_can_create_user(
    client,
    admin_user,
    db_session,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    password = "NewUserPass123!"

    response = client.post(
        "/users/",
        json={
            "name": "New Test User",
            "email": "new-user@example.com",
            "password": password,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "New Test User"
    assert data["email"] == "new-user@example.com"
    assert data["role"] == "user"
    assert "password_hash" not in data

    saved_user = (
        db_session.query(User)
        .filter(User.email == "new-user@example.com")
        .first()
    )

    assert saved_user is not None
    assert saved_user.password_hash != password
    assert verify_password(
        password,
        saved_user.password_hash,
    )


def test_admin_can_update_user(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.put(
        f"/users/{regular_user.id}",
        json={
            "name": "Updated Test User",
            "email": "updated-user@example.com",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated Test User"
    assert data["email"] == "updated-user@example.com"
    assert data["role"] == "user"
    assert "password_hash" not in data


def test_admin_can_delete_user(
    client,
    admin_user,
    regular_user,
    db_session,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    user_id = regular_user.id

    response = client.delete(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204

    deleted_user = (
        db_session.query(User)
        .filter(User.id == user_id)
        .first()
    )

    assert deleted_user is None


def test_admin_can_change_user_role(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    promote_response = client.patch(
        f"/users/{regular_user.id}/role",
        json={"role": "admin"},
        headers=headers,
    )

    assert promote_response.status_code == 200
    assert promote_response.json()["role"] == "admin"

    demote_response = client.patch(
        f"/users/{regular_user.id}/role",
        json={"role": "user"},
        headers=headers,
    )

    assert demote_response.status_code == 200
    assert demote_response.json()["role"] == "user"


def test_regular_user_cannot_manage_users(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        regular_user.email,
        "UserPass123!",
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    create_response = client.post(
        "/users/",
        json={
            "name": "Unauthorized User",
            "email": "unauthorized@example.com",
            "password": "SecurePass123!",
        },
        headers=headers,
    )

    update_response = client.put(
        f"/users/{admin_user.id}",
        json={
            "name": "Attempted Change",
            "email": "attempted@example.com",
        },
        headers=headers,
    )

    delete_response = client.delete(
        f"/users/{admin_user.id}",
        headers=headers,
    )

    role_response = client.patch(
        f"/users/{admin_user.id}/role",
        json={"role": "user"},
        headers=headers,
    )

    assert create_response.status_code == 403
    assert update_response.status_code == 403
    assert delete_response.status_code == 403
    assert role_response.status_code == 403


def test_invalid_role_is_rejected(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.patch(
        f"/users/{regular_user.id}/role",
        json={"role": "superadmin"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422

def test_admin_cannot_delete_own_account(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.delete(
        f"/users/{admin_user.id}",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "You cannot delete your own account."
    )