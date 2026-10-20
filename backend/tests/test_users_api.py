from app.core.security import verify_password
from app.models import AuditLog, User


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


def test_create_user_rejects_duplicate_email_case_insensitively(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )
    headers = {"Authorization": f"Bearer {token}"}

    first_response = client.post(
        "/users/",
        headers=headers,
        json={
            "name": "First User",
            "email": "CaseTest@example.com",
            "password": "StrongPass123!",
        },
    )
    assert first_response.status_code == 201

    duplicate_response = client.post(
        "/users/",
        headers=headers,
        json={
            "name": "Second User",
            "email": "casetest@example.com",
            "password": "StrongPass123!",
        },
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"] == (
        "A user with this email already exists."
    )


def test_update_user_rejects_duplicate_email_case_insensitively(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )
    headers = {"Authorization": f"Bearer {token}"}

    first_response = client.post(
        "/users/",
        headers=headers,
        json={
            "name": "First User",
            "email": "first@example.com",
            "password": "StrongPass123!",
        },
    )
    assert first_response.status_code == 201
    first_user = first_response.json()

    second_response = client.post(
        "/users/",
        headers=headers,
        json={
            "name": "Second User",
            "email": "second@example.com",
            "password": "StrongPass123!",
        },
    )
    assert second_response.status_code == 201
    second_user = second_response.json()

    update_response = client.put(
        f"/users/{second_user['id']}",
        headers=headers,
        json={
            "name": "Second User",
            "email": first_user["email"].upper(),
        },
    )

    assert update_response.status_code == 409
    assert update_response.json()["detail"] == (
        "A user with this email already exists."
    )

def test_password_change_invalidates_old_token(
    client,
    admin_user,
):
    old_token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    old_headers = {
        "Authorization": f"Bearer {old_token}",
    }

    response = client.post(
        "/auth/change-password",
        headers=old_headers,
        json={
            "current_password": "AdminPass123!",
            "new_password": "ChangedPass456!",
        },
    )

    assert response.status_code == 200

    payload = response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]

    old_token_response = client.get(
        "/auth/me",
        headers=old_headers,
    )
    assert old_token_response.status_code == 401

    new_headers = {
        "Authorization": (
            f"Bearer {payload['access_token']}"
        ),
    }

    new_token_response = client.get(
        "/auth/me",
        headers=new_headers,
    )
    assert new_token_response.status_code == 200

def test_get_users_supports_pagination(client, admin_user):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Create a second user so there are two records to paginate.
    created_response = client.post(
        "/users/",
        headers=headers,
        json={
            "name": "Pagination User",
            "email": "pagination@example.com",
            "password": "StrongPass123!",
        },
    )

    assert created_response.status_code == 201

    first_response = client.get(
        "/users/?skip=0&limit=1",
        headers=headers,
    )
    second_response = client.get(
        "/users/?skip=1&limit=1",
        headers=headers,
    )

    first_page = first_response.json()
    second_page = second_response.json()

    assert first_response.status_code == 200
    assert second_response.status_code == 200

    assert first_page["total"] == 2
    assert first_page["skip"] == 0
    assert first_page["limit"] == 1

    assert len(first_page["items"]) == 1
    assert len(second_page["items"]) == 1

    assert (
        first_page["items"][0]["id"]
        != second_page["items"][0]["id"]
    )

def test_creating_user_writes_audit_log(
    client,
    admin_user,
    db_session,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.post(
        "/users/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Audit Test User",
            "email": "audit-create@example.com",
            "password": "StrongPass123!",
        },
    )

    assert response.status_code == 201

    created_user = response.json()

    audit = (
        db_session.query(AuditLog)
        .filter_by(
            action="user_created",
            target_user_id=created_user["id"],
        )
        .one_or_none()
    )

    assert audit is not None
    assert audit.actor_user_id == admin_user.id
    assert audit.actor_email == admin_user.email
    assert audit.target_email == "audit-create@example.com"


def test_updating_user_writes_audit_log(
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

    response = client.put(
        f"/users/{regular_user.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Test User",
            "email": "updated-user@example.com",
        },
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter_by(
            action="user_updated",
            target_user_id=regular_user.id,
        )
        .one_or_none()
    )

    assert audit is not None
    assert audit.actor_user_id == admin_user.id
    assert audit.target_email == "updated-user@example.com"
    assert "name" in audit.details
    assert "email" in audit.details


def test_deleting_user_writes_audit_log(
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

    response = client.delete(
        f"/users/{regular_user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204

    audit = (
        db_session.query(AuditLog)
        .filter_by(
            action="user_deleted",
            target_user_id=regular_user.id,
        )
        .one_or_none()
    )

    assert audit is not None
    assert audit.actor_user_id == admin_user.id
    assert audit.target_email == regular_user.email


def test_role_change_writes_audit_log(
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

    response = client.patch(
        f"/users/{regular_user.id}/role",
        headers={"Authorization": f"Bearer {token}"},
        json={"role": "admin"},
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter_by(
            action="role_changed",
            target_user_id=regular_user.id,
        )
        .one_or_none()
    )

    assert audit is not None
    assert audit.actor_user_id == admin_user.id
    assert audit.target_email == regular_user.email
    assert audit.details == "Role changed from user to admin."


def test_failed_duplicate_email_update_creates_no_audit_log(
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

    response = client.put(
        f"/users/{regular_user.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Updated Test User",
            "email": admin_user.email.upper(),
        },
    )

    assert response.status_code == 409

    audit_count = (
        db_session.query(AuditLog)
        .filter_by(
            action="user_updated",
            target_user_id=regular_user.id,
        )
        .count()
    )

    assert audit_count == 0


def test_failed_self_deletion_creates_no_audit_log(
    client,
    admin_user,
    db_session,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.delete(
        f"/users/{admin_user.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400

    audit_count = (
        db_session.query(AuditLog)
        .filter_by(
            action="user_deleted",
            target_user_id=admin_user.id,
        )
        .count()
    )

    assert audit_count == 0


def test_admin_can_view_paginated_audit_logs(
    client,
    admin_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )
    headers = {
        "Authorization": f"Bearer {token}",
    }

    # Generate two audit records through normal API operations.
    for email in (
        "audit-view-one@example.com",
        "audit-view-two@example.com",
    ):
        response = client.post(
            "/users/",
            headers=headers,
            json={
                "name": "Audit View Test",
                "email": email,
                "password": "StrongPass123!",
            },
        )
        assert response.status_code == 201

    first_page = client.get(
        "/users/audit-logs?skip=0&limit=1",
        headers=headers,
    )
    second_page = client.get(
        "/users/audit-logs?skip=1&limit=1",
        headers=headers,
    )

    assert first_page.status_code == 200
    assert second_page.status_code == 200

    first_items = first_page.json()
    second_items = second_page.json()

    assert len(first_items) == 1
    assert len(second_items) == 1
    assert first_items[0]["id"] != second_items[0]["id"]
    assert first_items[0]["action"] == "user_created"
    assert first_items[0]["actor_email"] == admin_user.email
    assert "password_hash" not in first_items[0]
    assert "password" not in first_items[0]


def test_regular_user_cannot_view_audit_logs(
    client,
    regular_user,
):
    token = get_token(
        client,
        regular_user.email,
        "UserPass123!",
    )

    response = client.get(
        "/users/audit-logs",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 403

def test_get_users_searches_across_matching_users(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.get(
        "/users/?search=USER",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    payload = response.json()

    assert payload["total"] == 1
    assert len(payload["items"]) == 1
    assert payload["items"][0]["id"] == regular_user.id

def test_user_stats_returns_total_and_latest_user(
    client,
    admin_user,
    regular_user,
):
    token = get_token(
        client,
        admin_user.email,
        "AdminPass123!",
    )

    response = client.get(
        "/users/stats",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    payload = response.json()

    assert payload["total_users"] == 2
    assert payload["users_created_today"] >= 0
    assert payload["latest_user"] is not None