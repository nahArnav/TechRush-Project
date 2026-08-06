import asyncio
import time
from fastapi.testclient import TestClient
from app.main import app
from app import store

def test_user_registration_and_authentication():
    with TestClient(app) as client:
        # 1. Register a new user with unique email
        ts = int(time.time())
        email = f"test_student_{ts}@pict.edu"
        password = "SecurePassword123!"
        role = "student"

        response = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "role": role},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert "access_token" in data
        assert data["email"] == email
        assert data["role"] == role
        assert data["token_type"] == "bearer"

        # 2. Verify database record - password must be hashed with bcrypt, NOT stored in plaintext
        user_row = asyncio.run(store.get_user_by_email(email))
        assert user_row is not None
        assert user_row["password_hash"] != password
        assert user_row["password_hash"].startswith("$2b$")
        assert store.verify_password(password, user_row["password_hash"])

        # 3. Duplicate registration should fail
        dup_res = client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "role": role},
        )
        assert dup_res.status_code == 400

        # 4. Login with correct credentials
        login_res = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_res.status_code == 200
        login_data = login_res.json()
        token = login_data["access_token"]
        assert token is not None

        # 5. Login with invalid password should fail
        bad_login = client.post(
            "/api/auth/login",
            json={"email": email, "password": "WrongPassword!"},
        )
        assert bad_login.status_code == 401

        # 6. Authenticated request using JWT token
        items_res = client.get(
            "/v1/claims",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert items_res.status_code == 200

if __name__ == "__main__":
    test_user_registration_and_authentication()
    print("\nSUCCESS: ALL USER AUTHENTICATION TESTS PASSED!")
