from fastapi import FastAPI

from app.database import Base, engine
from app import models
from app.routes.users import router as users_router


app = FastAPI(
    title="Professional System API",
    description="Backend API for the professional system",
    version="1.0.0",
)

app.include_router(users_router)


@app.get("/")
def root():
    return {"message": "Professional System API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}