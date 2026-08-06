"""Database connection manager for SQLite (user credentials) & Motor/MongoDB (app state)."""

from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "campus_lost_and_found")
SQLITE_DB_PATH: Path = Path(__file__).resolve().parents[1] / "users.db"

_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None  # type: ignore[assignment]


def get_sqlite_conn() -> sqlite3.Connection:
    """Return a thread-safe connection to users.db."""
    conn = sqlite3.connect(SQLITE_DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn


def init_sqlite_db() -> None:
    """Ensure the SQLite database and `users` table exist with proper schema."""
    with get_sqlite_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        conn.commit()


async def startup_db() -> None:
    """Initialize SQLite database table and open optional Motor client."""
    global _client, db

    # 1. Always initialize local SQLite database table for users
    init_sqlite_db()

    # 2. Try connecting to Mongo if available
    try:
        _client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = _client[MONGO_DB_NAME]
        await _client.admin.command("ping")
    except Exception:
        # Fallback if MongoDB daemon is not running locally
        _client = None
        db = None  # type: ignore[assignment]


async def shutdown_db() -> None:
    """Close the motor client cleanly."""
    global _client, db
    if _client is not None:
        _client.close()
        _client = None
        db = None

