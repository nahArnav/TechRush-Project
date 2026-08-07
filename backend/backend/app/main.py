from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Annotated, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import store
from .database import startup_db, shutdown_db
from .models import (
    ActivityCreate,
    ActivityOut,
    AIReportRequest,
    AIReportSuggestion,
    AnalyticsSummary,
    CampusMapOut,
    ClaimCreate,
    ClaimReview,
    ClaimOut,
    AdminClaimOut,
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
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8443,http://127.0.0.1:8443,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


# ---------------------------------------------------------------------------
# Lifespan: replaces deprecated @app.on_event("startup") / ("shutdown")
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_db()
    await store.init_db()
    yield
    await shutdown_db()


app = FastAPI(
    title="LostAndFound API",
    description="Campus lost-and-found backend for item discovery, verification, handovers, CCTV queueing, map data, and user authentication.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------
async def require_session(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)]) -> Role:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = credentials.credentials
    payload = store.decode_access_token(token)
    if payload and "role" in payload:
        return payload["role"]
    role = await store.get_session_role(token)
    if role is not None:
        return role
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired bearer token")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "lost-found-api"}


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@app.post("/v1/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegister) -> TokenResponse:
    existing = await store.get_user_by_email(payload.email)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    password_hash = store.hash_password(payload.password)
    user = await store.create_user(email=payload.email, password_hash=password_hash, role=payload.role or "student")

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
async def login_user(payload: UserLogin) -> TokenResponse:
    user_row = await store.get_user_by_email(payload.email)
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
async def demo_session(payload: DemoSessionCreate) -> SessionOut:
    token = await store.issue_session(payload.role)
    return SessionOut(token=token, role=payload.role)


# ---------------------------------------------------------------------------
# Item endpoints
# ---------------------------------------------------------------------------
@app.get("/v1/items", response_model=ItemList)
async def list_items(
    q: Annotated[Optional[str], Query(max_length=120)] = None,
    type: Optional[ItemType] = None,
    status: Optional[ItemStatus] = None,
    category: Annotated[Optional[str], Query(max_length=80)] = None,
) -> ItemList:
    items = await store.list_items(query=q, item_type=type, status=status, category=category)
    return ItemList(items=items)


@app.post("/v1/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: ItemCreate,
    _: Annotated[Role, Depends(require_session)],
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
) -> ItemOut:
    user_id: str | None = None
    if credentials:
        token_payload = store.decode_access_token(credentials.credentials)
        if token_payload and "sub" in token_payload:
            user_id = token_payload["sub"]
    return await store.create_item(payload, user_id)


@app.get("/v1/items/{item_id}", response_model=ItemOut)
async def get_item(item_id: str) -> ItemOut:
    item = await store.get_item(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item


# ---------------------------------------------------------------------------
# Claim endpoints
# ---------------------------------------------------------------------------
@app.get("/v1/claims", response_model=list[ClaimOut])
async def list_claims(
    role: Annotated[Role, Depends(require_session)],
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
) -> list[ClaimOut]:
    token_payload = store.decode_access_token(credentials.credentials) if credentials else None
    claimer_id = token_payload.get("sub") if token_payload else None
    # Only administrators can see all claims through this legacy endpoint.
    return await store.list_claims(None if role == "admin" else claimer_id)


@app.post("/v1/claims", response_model=ClaimOut, status_code=status.HTTP_201_CREATED)
async def create_claim(
    payload: ClaimCreate,
    role: Annotated[Role, Depends(require_session)],
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
) -> ClaimOut:
    token_payload = store.decode_access_token(credentials.credentials) if credentials else None
    claim = await store.create_claim(payload, role, token_payload.get("sub") if token_payload else None, token_payload.get("email") if token_payload else None)
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return claim


@app.get("/api/admin/claims", response_model=list[AdminClaimOut])
async def admin_list_claims(
    role: Annotated[Role, Depends(require_session)],
    status_filter: Annotated[Optional[Literal["pending", "approved", "rejected"]], Query(alias="status")] = None,
) -> list[AdminClaimOut]:
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return await store.list_admin_claims(status_filter)


@app.patch("/api/admin/claims/{claim_id}/review", response_model=ClaimOut)
@app.post("/api/admin/claims/{claim_id}/review", response_model=ClaimOut)
async def review_claim(
    claim_id: str,
    payload: ClaimReview,
    role: Annotated[Role, Depends(require_session)],
) -> ClaimOut:
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    claim = await store.review_claim(claim_id, payload.status, payload.admin_notes)
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return claim


@app.patch("/v1/claims/{claim_id}/stage", response_model=ClaimOut)
async def update_claim_stage(
    claim_id: str,
    payload: ClaimStageUpdate,
    role: Annotated[Role, Depends(require_session)],
) -> ClaimOut:
    if role not in {"staff", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff or admin role required")
    claim = await store.update_claim_stage(claim_id, payload.stage)
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
    return claim


# ---------------------------------------------------------------------------
# Message / Chat endpoints
# ---------------------------------------------------------------------------
@app.get("/v1/messages/{item_id}", response_model=list[MessageOut])
async def list_messages(item_id: str, _: Annotated[Role, Depends(require_session)]) -> list[MessageOut]:
    messages = await store.list_messages(item_id)
    if messages is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return messages


@app.post("/v1/messages/{item_id}", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(
    item_id: str,
    payload: MessageCreate,
    _: Annotated[Role, Depends(require_session)],
) -> MessageOut:
    message = await store.create_message(item_id, payload)
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return message


# ---------------------------------------------------------------------------
# Handover endpoints
# ---------------------------------------------------------------------------
@app.post("/v1/handovers", response_model=HandoverOut, status_code=status.HTTP_201_CREATED)
async def create_handover(payload: HandoverCreate, _: Annotated[Role, Depends(require_session)]) -> HandoverOut:
    handover = await store.create_handover(payload)
    if handover is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return handover


# ---------------------------------------------------------------------------
# CCTV endpoints
# ---------------------------------------------------------------------------
@app.post("/v1/cctv-requests", response_model=CctvRequestOut, status_code=status.HTTP_201_CREATED)
async def create_cctv_request(
    payload: CctvRequestCreate,
    _: Annotated[Role, Depends(require_session)],
) -> CctvRequestOut:
    return await store.create_cctv_request(payload)


# ---------------------------------------------------------------------------
# Map & Analytics
# ---------------------------------------------------------------------------
@app.get("/v1/map", response_model=CampusMapOut)
async def campus_map() -> CampusMapOut:
    return await store.campus_map()


@app.get("/v1/analytics/summary", response_model=AnalyticsSummary)
async def analytics_summary(_: Annotated[Role, Depends(require_session)]) -> dict[str, object]:
    return await store.analytics_summary()


# ---------------------------------------------------------------------------
# Activity Tracking
# ---------------------------------------------------------------------------
@app.post("/v1/activity", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def log_activity(
    payload: ActivityCreate,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
) -> ActivityOut:
    """Record a user interaction. Auth is optional — unauthenticated events are
    stored with user_id=None so the frontend can fire-and-forget."""
    user_id: str | None = None
    if credentials:
        token_payload = store.decode_access_token(credentials.credentials)
        if token_payload and "sub" in token_payload:
            user_id = token_payload["sub"]
    return await store.log_activity(payload, user_id=user_id)


@app.get("/v1/activity", response_model=list[ActivityOut])
async def list_activity(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    action: Annotated[Optional[str], Query(max_length=120)] = None,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[ActivityOut]:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token_payload = store.decode_access_token(credentials.credentials)
    user_id = token_payload.get("sub") if token_payload else None
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired bearer token")
    return await store.list_activity(user_id=user_id, action=action, limit=limit)


# ---------------------------------------------------------------------------
# AI report assistant
# ---------------------------------------------------------------------------
@app.post("/v1/ai/report-details", response_model=AIReportSuggestion)
async def suggest_report_details(
    payload: AIReportRequest,
    _: Annotated[Role, Depends(require_session)],
) -> AIReportSuggestion:
    return store.suggest_report_details(payload)
