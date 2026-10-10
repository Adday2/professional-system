# Professional System

A full-stack web application built with React, TypeScript, FastAPI, and PostgreSQL. The application includes JWT authentication, role-based authorization, user management, password security, automated testing, and Docker-based deployment.

## Features

- User login and JWT authentication
- Password hashing with Argon2
- User profile and password changing
- Role-based authorization for administrators and regular users
- Admin user management: create, view, edit, and delete users
- Admin role management
- Login rate limiting
- Dashboard and system health check
- Database migrations with Alembic
- Docker Compose for running the full application
- Automated frontend and backend tests
- GitHub Actions CI for tests, production builds, and Docker image validation

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- TanStack React Query
- Lucide React
- Vitest
- React Testing Library

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- Psycopg
- Alembic
- PyJWT
- Argon2 password hashing through `pwdlib`
- SlowAPI
- pytest

### Database and DevOps
- PostgreSQL 18
- Docker
- Docker Compose
- Nginx
- Git and GitHub
- GitHub Actions

## Project Structure

```text
professional-system/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── routes/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── scripts/
│   └── test-all.ps1
├── .env.example
├── docker-compose.yml
└── README.md
```

## Requirements

To run the complete application with Docker, install:

- Docker Desktop
- Git

For local development without Docker, you will also need Node.js and Python, along with a PostgreSQL database.

## Getting Started with Docker

### 1. Clone the repository

```powershell
git clone https://github.com/Adday2/professional-system.git
cd professional-system
```

### 2. Configure environment variables

Create a local `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace the placeholder values with strong, randomly generated secrets.

Configure the PostgreSQL database name, username, and password, JWT secret, application environment, log level, CORS origins, and frontend API URL.

Never commit `.env` or share its secrets. The actual `.env` file is excluded from Git.

### 3. Build and start the application

```powershell
docker compose up -d --build
```

Docker Compose starts PostgreSQL, the FastAPI backend, and the React frontend. Database migrations run when the backend starts.

### 4. Create the initial administrator

```powershell
docker compose exec backend python -m app.create_admin
```

Follow the prompts to create an administrator account. Use a strong password.

### 5. Open the application

- Frontend: http://localhost:5173
- API health check: http://localhost:8000/health
- API documentation in development mode: http://localhost:8000/docs

Log in using the administrator email and password created in the previous step.

## Useful Docker Commands

Check service status:

```powershell
docker compose ps
```

View backend logs:

```powershell
docker compose logs -f backend
```

Restart services:

```powershell
docker compose restart
```

Stop services without deleting the database volume:

```powershell
docker compose down
```

**Warning:** `docker compose down -v` removes the Compose database volume and its stored data. Do not use it unless you deliberately intend to delete that data.

## Testing

### Run all tests on Windows

From the project root:

```powershell
.\scripts\test-all.ps1
```

This runs the frontend and backend test suites.

### Run frontend tests

```powershell
cd frontend
npm ci
npm test
npm run build
```

### Run backend tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```

The backend tests use an isolated SQLite test database rather than your application database.

## Continuous Integration

GitHub Actions runs the frontend tests and production build, backend tests, and Docker image builds on pushes and pull requests targeting `main`.

Workflow configuration:

```text
.github/workflows/ci.yml
```

Check the repository's **Actions** tab to review each workflow run.

## Security Notes

- Passwords are hashed using Argon2; plaintext passwords are not stored.
- JWT access tokens have a configurable expiration.
- User-management endpoints enforce administrator permissions on the backend.
- Login attempts are rate-limited.
- Secrets are supplied through environment variables rather than committed to Git.
- Interactive API documentation can be disabled by setting `APP_ENV=production`.
- CORS origins should be restricted to trusted frontend addresses.
- Production deployment should use HTTPS and an appropriately secured hosting environment.

## Current Deployment Model

The application can run locally as three Docker Compose services:

1. React frontend served by Nginx
2. FastAPI backend
3. PostgreSQL database with persistent storage

Production hosting, domain configuration, HTTPS, backup procedures, and monitoring must be configured separately before public deployment.

## License

No license has been specified yet.