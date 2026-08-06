from __future__ import annotations

import os
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import store
from .models import (
    AnalyticsSummary,
    CampusMapOut,
    ClaimCreate,
    ClaimOut,
    ClaimStageUpdate,
    CctvRequestCreate,
    CctvRequestOut,
    DemoSessionCreate,
    HandoverCreate,
    HandoverOut,
    ItemCreate,
    ItemList,
    ItemOut,
    ItemStatus,
    ItemType,
    MessageCreate,
    MessageOut,
    Role,
    SessionOut,
    TokenResponse,
    UserLogin,
    UserRegister,
)

security = HTTPBearer(auto_error=False)


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:8443,http://127.0.0.1:8443,http://localhost:5173,http://localhost:5174")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app = FastAPI(
    title="LostAndFound API",
    description="Campus lost-and-found backend for item discovery, verification, handovers, CCTV queueing, map data, and user authentication.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    store.init_db()


def require_session(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]) -> Role:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = credentials.credentials
    payload = store.decode_access_token(token)
    if payload and "role" in payload:
        return payload["role"]
    role = store.get_session_role(token)
    if role is not None:
        return role
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired bearer token")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "lost-found-api"}


@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@app.post("/v1/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegister) -> TokenResponse:
    existing = store.get_user_by_email(payload.email)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
    
    password_hash = store.hash_password(payload.password)
    user = store.create_user(email=payload.email, password_hash=password_hash, role=payload.role or "student")
    
    token = store.create_access_token(user_id=user.id, email=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
    )


@app.post("/api/auth/login", response_model=TokenResponse)
@app.post("/v1/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin) -> TokenResponse:
    user_row = store.get_user_by_email(payload.email)
    if user_row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if not store.verify_password(payload.password, user_row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = store.create_access_token(user_id=user_row["id"], email=user_row["email"], role=user_row["role"])
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_row["id"],
        email=user_row["email"],
        role=user_row["role"],
    )


@app.post("/v1/auth/demo-session", response_model=SessionOut)
def demo_session(payload: DemoSessionCreate) -> SessionOut:
    token = store.issue_session(payload.role)
    return SessionOut(token=token, role=payload.role)


@app.get("/v1/items", response_model=ItemList)
def list_items(
    q: Annotated[Optional[str], Query(max_length=120)] = None,
    type: Optional[ItemType] = None,
    status: Optional[ItemStatus] = None,
    category: Annotated[Optional[str], Query(max_length=80)] = None,
) -> ItemList:
    return ItemList(items=store.list_items(query=q, item_type=type, status=status, category=category))


@app.post("/v1/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, _: Annotated[Role, Depends(require_session)]) -> ItemOut:
    return store.create_item(payload)


@app.get("/v1/items/{item_id}", response_model=ItemOut)
def get_item(item_id: str) -> ItemOut:
    item = store.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


@app.get("/v1/claims", response_model=list[ClaimOut])
def list_claims(_: Annotated[Role, Depends(require_session)]) -> list[ClaimOut]:
    return store.list_claims()


@app.post("/v1/claims", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
def create_claim(payload: ClaimCreate, role: Annotated[Role, Depends(require_session)]) -> ClaimOut:
    claim = store.create_claim(payload, role)
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return claim


@app.patch("/v1/claims/{claim_id}/stage", response_model=ClaimOut)
def update_claim_stage(
    claim_id: int,
    payload: ClaimStageUpdate,
    role: Annotated[Role, Depends(require_session)],
) -> ClaimOut:
    if role not in {"staff", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    claim = store.update_claim_stage(claim_id, payload.stage)
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return claim


@app.get("/v1/messages/{item_id}", response_model=list[MessageOut])
def list_messages(item_id: str, _: Annotated[Role, Depends(require_session)]) -> list[MessageOut]:
    messages = store.list_messages(item_id)
    if messages is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return messages


@app.post("/v1/messages/{item_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def create_message(
    item_id: str,
    payload: MessageCreate,
    _: Annotated[Role, Depends(require_session)],
) -> MessageOut:
    message = store.create_message(item_id, payload)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return message


@app.post("/v1/handovers", response_model=HandoverOut, status_code=status.HTTP_201_CREATED)
def create_handover(payload: HandoverCreate, _: Annotated[Role, Depends(require_session)]) -> HandoverOut:
    handover = store.create_handover(payload)
    if handover is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return handover


@app.post("/v1/cctv-requests", response_model=CctvRequestOut, status_code=status.HTTP_201_CREATED)
def create_cctv_request(
    payload: CctvRequestCreate,
    _: Annotated[Role, Depends(require_session)],
) -> CctvRequestOut:
    return store.create_cctv_request(payload)


@app.get("/v1/map", response_model=CampusMapOut)
def campus_map() -> CampusMapOut:
    return store.campus_map()


@app.get("/v1/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(_: Annotated[Role, Depends(require_session)]) -> dict[str, object]:
    return store.analytics_summary()
