import asyncio
import os
import sqlite3
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.database import SQLITE_DB_PATH, get_sqlite_conn, init_sqlite_db

def test_auth_and_db():
    print("\n--- Starting Auth & SQLite Database Test ---")
    
    # 1. Initialize DB
    init_sqlite_db()
    assert SQLITE_DB_PATH.exists(), "SQLite database file users.db should exist"
    
    # Clean up test user if exists
    test_email = "lead_dev_test@pict.edu"
    with get_sqlite_conn() as conn:
        conn.execute("DELETE FROM users WHERE email = ?", (test_email,))
        conn.commit()

    # 2. Test Registration (POST /api/auth/register)
    reg_payload = {
        "email": test_email,
        "password": "SecurePassword#2026",
        "role": "student"
    }
    with TestClient(app) as client:
        res = client.post("/api/auth/register", json=reg_payload)
        print(f"Register status: {res.status_code}")
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["email"] == test_email
        assert data["role"] == "student"
        print("[OK] Registration successful with JWT token issued")

        # 3. Test Duplicate Registration Attempt (POST /api/auth/register)
        dup_res = client.post("/api/auth/register", json=reg_payload)
        print(f"Duplicate Register status: {dup_res.status_code}")
        assert dup_res.status_code == 400, f"Expected 400 for duplicate email, got {dup_res.status_code}"
        assert "already registered" in dup_res.json()["detail"].lower()
        print("[OK] Duplicate registration correctly rejected with HTTP 400")

        # 4. Test Login with Correct Password (POST /api/auth/login)
        login_payload = {
            "email": test_email,
            "password": "SecurePassword#2026"
        }
        login_res = client.post("/api/auth/login", json=login_payload)
        print(f"Login status: {login_res.status_code}")
        assert login_res.status_code == 200, f"Expected 200, got {login_res.status_code}: {login_res.text}"
        login_data = login_res.json()
        assert "access_token" in login_data
        assert login_data["email"] == test_email
        print("[OK] Login with valid credentials successful")

        # 5. Test Login with Incorrect Password (POST /api/auth/login)
        bad_login_payload = {
            "email": test_email,
            "password": "WrongPassword123"
        }
        bad_res = client.post("/api/auth/login", json=bad_login_payload)
        print(f"Bad Password Login status: {bad_res.status_code}")
        assert bad_res.status_code == 401, f"Expected 401, got {bad_res.status_code}"
        assert "invalid email or password" in bad_res.json()["detail"].lower()
        print("[OK] Invalid password correctly rejected with HTTP 401 Unauthorized")

    # 6. Verify SQLite Database Record
    with get_sqlite_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (test_email,)).fetchone()
        assert row is not None, "User record must exist in SQLite users table"
        assert row["email"] == test_email
        assert row["hashed_password"] != "SecurePassword#2026", "Password must NEVER be stored in plain text"
        assert row["hashed_password"].startswith("$2b$"), "Password hash must be valid bcrypt hash"
        print(f"[OK] SQLite DB verified: User ID={row['id']}, Email={row['email']}, Hash={row['hashed_password'][:15]}...")

    print("\n--- ALL AUTHENTICATION & DATABASE TESTS PASSED ---")

if __name__ == "__main__":
    test_auth_and_db()
