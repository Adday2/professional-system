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


def test_login_succeeds(client, admin_user):
    response = client.post(
        "/auth/login",
        data={
            "username": admin_user.email,
            "password": "AdminPass123!",
        },
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_rejects_wrong_password(client, admin_user):
    response = client.post(
        "/auth/login",
        data={
            "username": admin_user.email,
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_current_user_requires_authentication(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_current_user_returns_authenticated_user(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == admin_user.email
    assert response.json()["role"] == "admin"
    assert "password_hash" not in response.json()


def test_admin_can_view_users(client, admin_user):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.get(
        "/users/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_regular_user_cannot_view_users(
    client,
    regular_user,
):
    token = get_token(
        client,
        regular_user.email,
        "UserPass123!",
    )

    response = client.get(
        "/users/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_admin_cannot_change_own_role(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.patch(
        f"/users/{admin_user.id}/role",
        json={"role": "user"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "You cannot change your own role."
    )


def test_password_change_invalidates_old_password(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.post(
        "/auth/change-password",
        json={
            "current_password": "AdminPass123!",
            "new_password": "NewAdminPass456!",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    old_login = client.post(
        "/auth/login",
        data={
            "username": admin_user.email,
            "password": "AdminPass123!",
        },
    )

    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login",
        data={
            "username": admin_user.email,
            "password": "NewAdminPass456!",
        },
    )

    assert new_login.status_code == 200