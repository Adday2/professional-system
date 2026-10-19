from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.main import app


def test_health_reports_database_healthy(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "database": "ok",
    }


def test_health_returns_503_when_database_unavailable(client):
    class BrokenSession:
        def execute(self, statement):
            raise SQLAlchemyError("Simulated database failure")

    def failing_db():
        yield BrokenSession()

    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = failing_db

    try:
        response = client.get("/health")
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override

    assert response.status_code == 503
    assert response.json()["detail"] == "Database unavailable."