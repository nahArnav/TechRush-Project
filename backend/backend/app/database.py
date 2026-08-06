"""MongoDB async connection manager using motor."""

from __future__ import annotations

import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "campus_lost_and_found")

_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None  # type: ignore[assignment]


async def startup_db() -> None:
    """Open the motor client and select the database."""
    global _client, db
    _client = AsyncIOMotorClient(MONGO_URI)
    db = _client[MONGO_DB_NAME]
    # Quick connectivity check
    await _client.admin.command("ping")


async def shutdown_db() -> None:
    """Close the motor client cleanly."""
    global _client, db
    if _client is not None:
        _client.close()
        _client = None
        db = None
