# Professional System

A full-stack web application built with React, TypeScript, FastAPI, and PostgreSQL. The system includes JWT authentication, role-based authorization, user management, password security, automated testing, and Docker-based deployment.

## Features

- User login and JWT authentication
- Secure password hashing with Argon2
- User profile and password changing
- Role-based authorization for administrators and regular users
- User management: create, view, edit, and delete users
- Administrator role management
- Login rate limiting
- Dashboard and API health checks
- Database migrations with Alembic
- Docker Compose for running the complete application
- Automated frontend and backend tests
- GitHub Actions CI for testing, production builds, and Docker image validation

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
- Argon2 password hashing with `pwdlib`
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

To run the complete application with Docker, you need:

- Docker Desktop
- Git

For local development without Docker, you will also need Node.js, Python, and a PostgreSQL database.

## Getting Started

### 1. Clone the repository

```powershell
git clone https://github.com/Adday2/professional-system.git
cd professional-system
```

### 2. Configure environment variables

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace the placeholder values with secure, randomly generated secrets.

Configure the PostgreSQL database name, username and password, JWT secret, application environment, log level, CORS origins, and frontend API URL.

**Important:** Never commit your real `.env` file or share its secrets. The file is excluded from Git.

### 3. Build and start the application

From the project root, run:

```powershell
docker compose up -d --build
```

Docker Compose starts the three services:

- React frontend served by Nginx
- FastAPI backend
- PostgreSQL database with persistent storage

The backend runs database migrations during startup.

### 4. Create the initial administrator

Run:

```powershell
docker compose exec backend python -m app.create_admin
```

Follow the prompts to enter the administrator's name, email, and password.

Use a strong password and keep it private.

### 5. Open the application

- **Frontend:** http://localhost:5173
- **API health check:** http://localhost:8000/health
- **API documentation:** http://localhost:8000/docs (available in development mode)

Sign in using the administrator credentials created in the previous step.

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

Stop the application while preserving the database volume:

```powershell
docker compose down
```

**Warning:** `docker compose down -v` removes the Compose database volume and its stored data. Do not use it unless you deliberately intend to delete that data.

## Testing

### Run all tests on Windows

From the project root, run:

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

The backend tests use an isolated SQLite test database rather than the application's PostgreSQL database.

## Continuous Integration

GitHub Actions automatically runs the following checks on pushes and pull requests targeting the `main` branch:

- Frontend tests
- Frontend production build
- Backend tests
- Backend Docker image build
- Frontend Docker image build

The workflow is defined in:

```text
.github/workflows/ci.yml
```

Visit the repository's **Actions** tab to review workflow results:

https://github.com/Adday2/professional-system/actions

## Security

The application includes the following security measures:

- Passwords are hashed with Argon2 rather than stored as plaintext.
- JWT access tokens have a configurable expiration.
- User-management endpoints enforce administrator permissions on the backend.
- Login attempts are rate-limited.
- Environment variables are used for secrets and configuration.
- API documentation can be disabled by setting `APP_ENV=production`.
- CORS origins can be configured for trusted frontend addresses.

Before public production deployment, configure HTTPS, secure hosting, database backups, appropriate logging and monitoring, and production environment variables.

## Deployment

The application currently runs locally through Docker Compose.

Public production hosting, domain configuration, HTTPS, automated backup procedures, and production monitoring must be configured separately before the system is publicly deployed.

## License

No license has been specified yet.