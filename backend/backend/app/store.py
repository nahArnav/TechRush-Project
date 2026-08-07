from __future__ import annotations

import math
import os
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Optional

import bcrypt
import jwt
from bson import ObjectId
from dotenv import load_dotenv

from . import database
from .models import (
    ActivityCreate,
    ActivityOut,
    AIReportRequest,
    AIReportSuggestion,
    CampusMapOut,
    CampusPath,
    CampusPin,
    CampusPoint,
    CampusZone,
    ClaimCreate,
    ClaimOut,
    AdminClaimOut,
    ClaimStage,
    CctvRequestCreate,
    CctvRequestOut,
    HandoverCreate,
    HandoverOut,
    ItemCreate,
    ItemOut,
    ItemSightingOut,
    ItemStatus,
    ItemType,
    MessageCreate,
    MessageOut,
    Role,
    UserOut,
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_techrush_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
SENSITIVE_CATEGORIES = {"Government ID", "Medicine", "ID Card"}

# ---------------------------------------------------------------------------
# Static campus data
# ---------------------------------------------------------------------------
ZONE_DEFS = [
    {"id": "library", "label": "Hargrove Library", "kind": "building", "x": -2.8, "z": -1.8, "width": 2.6, "depth": 2.0, "height": 1.6, "securityLevel": "public"},
    {"id": "science", "label": "Kessler Science", "kind": "building", "x": 2.4, "z": -1.7, "width": 2.1, "depth": 2.2, "height": 1.3, "securityLevel": "staff"},
    {"id": "dining", "label": "Warren Dining", "kind": "building", "x": -0.2, "z": 1.5, "width": 2.4, "depth": 1.5, "height": 0.95, "securityLevel": "public"},
    {"id": "quad", "label": "Ellsworth Quad", "kind": "ground", "x": -2.6, "z": 1.7, "width": 2.6, "depth": 1.8, "height": 0.06, "securityLevel": "public"},
    {"id": "security", "label": "Security Office", "kind": "service", "x": 2.8, "z": 1.5, "width": 1.4, "depth": 1.2, "height": 0.9, "securityLevel": "security"},
]

PATH_DEFS = [
    {"from": {"x": -4.2, "z": 0.0}, "to": {"x": 4.2, "z": 0.0}},
    {"from": {"x": 0.0, "z": -3.2}, "to": {"x": 0.0, "z": 3.2}},
    {"from": {"x": -2.8, "z": -1.8}, "to": {"x": -0.2, "z": 1.5}},
    {"from": {"x": 2.4, "z": -1.7}, "to": {"x": 2.8, "z": 1.5}},
]

LOCATION_HINTS = [
    ("library", "library", -2.9, -1.35),
    ("study", "library", -2.55, -2.1),
    ("science", "science", 2.35, -1.55),
    ("kessler", "science", 2.55, -1.2),
    ("dining", "dining", -0.15, 1.6),
    ("cafe", "dining", -0.35, 1.25),
    ("quad", "quad", -2.35, 1.65),
    ("fountain", "quad", -2.95, 1.8),
    ("security", "security", 2.85, 1.45),
    ("locker", "security", 3.05, 1.15),
]

SEED_ITEMS = [
    ("LF-1042", "lost", "Electronics", "MacBook Air M2, dented lid corner", "Space grey, sticker of the robotics club on the lid. Left it charging in the third-floor study carrels.", "Hargrove Library, Level 3", "2026-07-29", "open", 0.91),
    ("LF-1043", "found", "Electronics", "Silver laptop in a grey sleeve", "Handed in at the circulation desk by a night-shift cleaner. Lock screen shows a mountain range.", "Hargrove Library, Front Desk", "2026-07-30", "in_review", 0.91),
    ("LF-1044", "lost", "Phone", "iPhone 15, cracked bottom-left", "Clear case with a pressed flower inside. Silent mode, will not ring.", "Ellsworth Quad, near the fountain", "2026-08-01", "open", 0.64),
    ("LF-1045", "found", "Keys", "Keyring with lab fob and blue carabiner", "Three keys plus a departmental access fob. Held in the security safe.", "Kessler Science Building, Security Office", "2026-07-31", "secured", 0.38),
    ("LF-1046", "lost", "Government ID", "Driver's licence and campus ID in a card sleeve", "Slim navy sleeve, both cards inside. Last used at the dining hall reader.", "Warren Dining Hall", "2026-07-28", "escalated", 0.72),
    ("LF-1047", "found", "Bags", "Olive canvas tote, art supplies inside", "Contains brushes, a half-finished sketchbook and a water bottle. No name tag.", "Fine Arts Annexe, Studio 2", "2026-08-02", "open", 0.21),
    ("LF-1048", "lost", "Eyewear", "Tortoiseshell reading glasses", "Thin wire arms, no case. Probably slipped off during the afternoon lecture.", "Bramwell Hall, Lecture Theatre B", "2026-07-27", "open", 0.44),
    ("LF-1049", "found", "Wallet", "Brown bifold wallet, cards removed", "Found empty of cash. Cards logged separately by staff and held securely.", "Athletics Centre, Locker Room A", "2026-07-30", "secured", 0.55),
    ("LF-1050", "lost", "Medicine", "Insulin pen in a cooling pouch", "Urgent. Small navy pouch with a pharmacy label. Time-sensitive for the owner.", "Route between Warren Hall and the bus loop", "2026-08-02", "escalated", 0.83),
    ("LF-1051", "found", "Clothing", "Navy rain shell, size M", "Left on the back of a chair for two days. Bus pass in the left pocket.", "Cadogan Cafe, upper seating", "2026-07-26", "open", 0.17),
    ("LF-1052", "lost", "Books", "Organic Chemistry, 8th edition, heavily annotated", "Margins full of notes in green pen. Name written inside the front cover.", "Kessler Science Building, Room 214", "2026-07-25", "closed", 0.29),
    ("LF-1053", "found", "Jewellery", "Thin gold chain with a small pendant", "Clasp is broken, likely fell off. Being held pending a description match.", "Ellsworth Quad, east path", "2026-08-01", "in_review", 0.68),
    ("LF-1054", "lost", "Electronics", "Wireless earbuds, charging case scuffed", "White case with a chipped hinge. One bud has a blue silicone tip.", "Shuttle bus, Route 4", "2026-07-31", "open", 0.49),
    ("LF-1055", "found", "Keys", "Single bike key on a red cord", "Found looped around a rack post. No identifying markings.", "North Bike Racks, Pemberton Hall", "2026-07-29", "secured", 0.12),
    ("LF-1056", "lost", "Other", "Cello bow in a soft case", "Departmental loan, tagged with an inventory sticker on the frog.", "Music Building, Practice Room 7", "2026-07-24", "open", 0.35),
]

_memory_ready = False
_memory_items: list[dict[str, Any]] = []
_memory_claims: list[dict[str, Any]] = []
_memory_sessions: dict[str, Role] = {}
_memory_messages: list[dict[str, Any]] = []
_memory_handovers: list[dict[str, Any]] = []
_memory_cctv_requests: list[dict[str, Any]] = []
_memory_activity_log: list[dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def infer_coordinates(location: str) -> tuple[float, float]:
    lower = location.lower()
    for token, _, coord_x, coord_z in LOCATION_HINTS:
        if token in lower:
            return coord_x, coord_z

    seed = sum(ord(char) for char in location)
    angle = (seed % 360) * math.pi / 180
    radius = 1.4 + (seed % 120) / 100
    return round(math.cos(angle) * radius, 2), round(math.sin(angle) * radius, 2)


def zone_for_location(location: str) -> str:
    lower = location.lower()
    for token, zone_id, _, _ in LOCATION_HINTS:
        if token in lower:
            return zone_id
    return "quad"


def _doc_to_item(doc: dict) -> ItemOut:
    coordinates = None
    if doc.get("coord_x") is not None and doc.get("coord_z") is not None:
        coordinates = CampusPoint(x=doc["coord_x"], z=doc["coord_z"])
    sighted_by = [str(user_id) for user_id in doc.get("sighted_by_user_ids", []) if user_id]
    raw_count = doc.get("sighting_count", len(sighted_by))
    sighting_count = max(int(raw_count or 0), len(sighted_by))
    return ItemOut(
        id=doc["id"],
        type=doc["type"],
        category=doc["category"],
        title=doc["title"],
        description=doc["description"],
        location=doc["location"],
        date=doc["date"],
        status=doc["status"],
        match_score=doc["match_score"],
        coordinates=coordinates,
        user_id=doc.get("user_id"),
        sighting_count=sighting_count,
        sighted_by_user_ids=sighted_by,
        photos=doc.get("photos", []),
    )


def _doc_to_claim(doc: dict) -> ClaimOut:
    claim_status = doc.get("status") or ("approved" if doc.get("stage") == "approved" else "rejected" if doc.get("stage") == "rejected" else "pending")
    stage = doc.get("stage") or ("approved" if claim_status == "approved" else "rejected" if claim_status == "rejected" else "review")
    return ClaimOut(
        id=str(doc["_id"]),
        item_id=doc["item_id"],
        claimer_id=doc.get("claimer_id"),
        claimer_email=doc.get("claimer_email"),
        proof_description=doc.get("proof_description", doc.get("proof", "")),
        status=claim_status,
        stage=stage,
        claimant_role=doc["claimant_role"],
        proof_submitted=bool(doc.get("proof_description", doc.get("proof"))),
        created_at=doc["created_at"],
        admin_notes=doc.get("admin_notes"),
    )


def _memory_item_docs() -> list[dict[str, Any]]:
    return [doc.copy() for doc in _memory_items]


def _seed_item_docs() -> list[dict[str, Any]]:
    now = utc_now()
    docs: list[dict[str, Any]] = []
    for item in SEED_ITEMS:
        coord_x, coord_z = infer_coordinates(item[5])
        docs.append({
            "id": item[0],
            "type": item[1],
            "category": item[2],
            "title": item[3],
            "description": item[4],
            "location": item[5],
            "date": item[6],
            "status": item[7],
            "match_score": item[8],
            "coord_x": coord_x,
            "coord_z": coord_z,
            "created_at": now,
            "sighting_count": 0,
            "sighted_by_user_ids": [],
        })
    return docs


def _matches_text_query(doc: dict[str, Any], query: str) -> bool:
    needle = query.lower()
    return any(
        needle in str(doc.get(field, "")).lower()
        for field in ("title", "description", "location", "category")
    )


# ---------------------------------------------------------------------------
# Database initialisation & seeding
# ---------------------------------------------------------------------------
async def init_db() -> None:
    """Initialize MongoDB when available, otherwise seed the in-memory fallback."""
    global _memory_ready, _memory_items, _memory_claims

    if database.db is None:
        if not _memory_ready:
            _memory_items = _seed_item_docs()
            _memory_claims = [{
                "_id": ObjectId(),
                "item_id": "LF-1043",
                "stage": "review",
                "status": "pending",
                "claimant_role": "student",
                "claimer_id": "demo-student",
                "claimer_email": "student@demo.local",
                "proof_description": "Sleeve has a small tear near the zipper.",
                "created_at": utc_now(),
            }]
            _memory_ready = True
        return

    await database.db.items.create_index("id", unique=True)
    await database.db.items.create_index([("date", -1), ("created_at", -1)])
    await database.db.items.update_many({"sighting_count": {"$exists": False}}, {"$set": {"sighting_count": 0}})
    await database.db.items.update_many({"sighted_by_user_ids": {"$exists": False}}, {"$set": {"sighted_by_user_ids": []}})
    await database.db.claims.create_index("item_id")
    await database.db.claims.create_index([("status", 1), ("created_at", -1)])
    # Treat pre-workflow claims as pending so they remain reviewable after deployment.
    await database.db.claims.update_many({"status": {"$exists": False}}, {"$set": {"status": "pending"}})
    await database.db.claims.update_many({"stage": "approved"}, {"$set": {"status": "approved"}})
    await database.db.claims.update_many({"stage": "rejected"}, {"$set": {"status": "rejected"}})
    await database.db.sessions.create_index("token", unique=True)

    if await database.db.items.count_documents({}) == 0:
        await _seed_items()


async def _seed_items() -> None:
    item_docs = _seed_item_docs()
    await database.db.items.insert_many(item_docs)

    # One demo claim
    await database.db.claims.insert_one({
        "item_id": "LF-1043",
        "stage": "review",
        "status": "pending",
        "claimant_role": "student",
        "claimer_id": "demo-student",
        "claimer_email": "student@demo.local",
        "proof_description": "Sleeve has a small tear near the zipper.",
        "created_at": utc_now(),
    })


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------
async def issue_session(role: Role) -> str:
    token = secrets.token_urlsafe(32)
    if database.db is None:
        _memory_sessions[token] = role
        return token

    await database.db.sessions.insert_one({
        "token": token,
        "role": role,
        "created_at": utc_now(),
    })
    return token


async def get_session_role(token: str) -> Optional[Role]:
    if database.db is None:
        return _memory_sessions.get(token)

    doc = await database.db.sessions.find_one({"token": token})
    return doc["role"] if doc else None


# ---------------------------------------------------------------------------
# Item CRUD
# ---------------------------------------------------------------------------
async def list_items(
    query: Optional[str] = None,
    item_type: Optional[ItemType] = None,
    status: Optional[ItemStatus] = None,
    category: Optional[str] = None,
) -> list[ItemOut]:
    if database.db is None:
        docs = _memory_item_docs()
        if query:
            docs = [doc for doc in docs if _matches_text_query(doc, query)]
        if item_type:
            docs = [doc for doc in docs if doc["type"] == item_type]
        if status:
            docs = [doc for doc in docs if doc["status"] == status]
        if category:
            docs = [doc for doc in docs if doc["category"] == category]
        docs.sort(key=lambda doc: (doc["date"], doc["created_at"]), reverse=True)
        return [_doc_to_item(doc) for doc in docs[:500]]

    filter_doc: dict = {}
    if query:
        regex = {"$regex": query, "$options": "i"}
        filter_doc["$or"] = [
            {"title": regex},
            {"description": regex},
            {"location": regex},
            {"category": regex},
        ]
    if item_type:
        filter_doc["type"] = item_type
    if status:
        filter_doc["status"] = status
    if category:
        filter_doc["category"] = category

    cursor = database.db.items.find(filter_doc).sort([("date", -1), ("created_at", -1)])
    docs = await cursor.to_list(length=500)
    return [_doc_to_item(doc) for doc in docs]


async def get_item(item_id: str) -> Optional[ItemOut]:
    if database.db is None:
        doc = next((item for item in _memory_items if item["id"] == item_id), None)
        return _doc_to_item(doc) if doc else None

    doc = await database.db.items.find_one({"id": item_id})
    return _doc_to_item(doc) if doc else None


async def _next_item_id() -> str:
    if database.db is None:
        docs = _memory_item_docs()
    else:
        cursor = database.db.items.find({"id": {"$regex": "^LF-"}}, {"id": 1})
        docs = await cursor.to_list(length=10000)

    highest = 1000
    for doc in docs:
        try:
            highest = max(highest, int(doc["id"].split("-", 1)[1]))
        except (IndexError, ValueError):
            continue
    return f"LF-{highest + 1}"


def _infer_status(payload: ItemCreate) -> ItemStatus:
    if payload.category in SENSITIVE_CATEGORIES:
        return "escalated" if payload.type == "lost" else "secured"
    return "open" if payload.type == "lost" else "secured"


async def _infer_match_score(payload: ItemCreate) -> float:
    opposite = "found" if payload.type == "lost" else "lost"
    if database.db is None:
        count = sum(
            1
            for item in _memory_items
            if item["type"] == opposite and item["category"] == payload.category
        )
    else:
        count = await database.db.items.count_documents({"type": opposite, "category": payload.category})
    score = 0.34 + min(count, 5) * 0.11
    if payload.brand:
        score += 0.08
    if payload.color:
        score += 0.05
    return round(min(score, 0.96), 2)


async def create_item(payload: ItemCreate, user_id: str | None) -> ItemOut:
    item_id = await _next_item_id()
    coord_x, coord_z = infer_coordinates(payload.location)
    item_status = _infer_status(payload)
    match_score = await _infer_match_score(payload)
    now = utc_now()

    doc = {
        "id": item_id,
        "type": payload.type,
        "category": payload.category,
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "date": payload.date,
        "status": item_status,
        "match_score": match_score,
        "coord_x": coord_x,
        "coord_z": coord_z,
        "photos": payload.photos[:8],
        "created_at": now,
        "user_id": user_id,
        "sighting_count": 0,
        "sighted_by_user_ids": [],
    }
    if database.db is None:
        _memory_items.append(doc)
        return _doc_to_item(doc)

    await database.db.items.insert_one(doc)
    return _doc_to_item(doc)


async def toggle_item_sighting(item_id: str, user_id: str) -> Optional[ItemSightingOut]:
    if database.db is None:
        doc = next((item for item in _memory_items if item["id"] == item_id), None)
        if doc is None:
            return None

        sighted_by = [str(existing) for existing in doc.get("sighted_by_user_ids", []) if existing]
        if user_id in sighted_by:
            sighted_by = [existing for existing in sighted_by if existing != user_id]
            sighted = False
        else:
            sighted_by.append(user_id)
            sighted = True

        doc["sighted_by_user_ids"] = sighted_by
        doc["sighting_count"] = len(sighted_by)
        return ItemSightingOut(
            item_id=item_id,
            sighting_count=doc["sighting_count"],
            sighted=sighted,
            sighted_by_user_ids=sighted_by,
        )

    doc = await database.db.items.find_one({"id": item_id})
    if doc is None:
        return None

    sighted_by = [str(existing) for existing in doc.get("sighted_by_user_ids", []) if existing]
    if user_id in sighted_by:
        sighted_by = [existing for existing in sighted_by if existing != user_id]
        sighted = False
    else:
        sighted_by.append(user_id)
        sighted = True

    sighting_count = len(sighted_by)
    await database.db.items.update_one(
        {"id": item_id},
        {"$set": {"sighted_by_user_ids": sighted_by, "sighting_count": sighting_count}},
    )
    return ItemSightingOut(
        item_id=item_id,
        sighting_count=sighting_count,
        sighted=sighted,
        sighted_by_user_ids=sighted_by,
    )


# ---------------------------------------------------------------------------
# Claim CRUD
# ---------------------------------------------------------------------------
async def list_claims(claimer_id: str | None = None) -> list[ClaimOut]:
    if database.db is None:
        docs = [doc.copy() for doc in _memory_claims]
        if claimer_id:
            docs = [doc for doc in docs if doc.get("claimer_id") == claimer_id]
        docs.sort(key=lambda doc: doc["created_at"], reverse=True)
        return [_doc_to_claim(doc) for doc in docs[:500]]

    cursor = database.db.claims.find({"claimer_id": claimer_id} if claimer_id else {}).sort([("created_at", -1)])
    docs = await cursor.to_list(length=500)
    return [_doc_to_claim(doc) for doc in docs]


async def create_claim(payload: ClaimCreate, role: Role, claimer_id: str | None = None, claimer_email: str | None = None) -> Optional[ClaimOut]:
    if database.db is None:
        item = next((doc for doc in _memory_items if doc["id"] == payload.item_id), None)
        if not item:
            return None

        doc = {
            "_id": ObjectId(),
            "item_id": payload.item_id,
            "stage": "review",
            "status": "pending",
            "claimant_role": role,
            "claimer_id": claimer_id,
            "claimer_email": claimer_email,
            "proof_description": payload.proof,
            "created_at": utc_now(),
        }
        _memory_claims.append(doc)
        if item["status"] not in {"closed", "escalated"}:
            item["status"] = "in_review"
        return _doc_to_claim(doc)

    item = await database.db.items.find_one({"id": payload.item_id})
    if not item:
        return None

    now = utc_now()
    result = await database.db.claims.insert_one({
        "item_id": payload.item_id,
        "stage": "review",
        "status": "pending",
        "claimant_role": role,
        "claimer_id": claimer_id,
        "claimer_email": claimer_email,
        "proof_description": payload.proof,
        "created_at": now,
    })

    if item["status"] not in {"closed", "escalated"}:
        await database.db.items.update_one({"id": payload.item_id}, {"$set": {"status": "in_review"}})

    doc = await database.db.claims.find_one({"_id": result.inserted_id})
    return _doc_to_claim(doc)


async def update_claim_stage(claim_id: str, stage: ClaimStage) -> Optional[ClaimOut]:
    try:
        oid = ObjectId(claim_id)
    except Exception:
        return None

    if database.db is None:
        doc = next((claim for claim in _memory_claims if claim["_id"] == oid), None)
        if not doc:
            return None
        doc["stage"] = stage
        doc["status"] = "approved" if stage == "approved" else "rejected" if stage == "rejected" else "pending"
        if stage == "approved":
            item = next((item for item in _memory_items if item["id"] == doc["item_id"]), None)
            if item:
                item["status"] = "claimed"
        return _doc_to_claim(doc)

    doc = await database.db.claims.find_one({"_id": oid})
    if not doc:
        return None

    claim_status = "approved" if stage == "approved" else "rejected" if stage == "rejected" else "pending"
    await database.db.claims.update_one({"_id": oid}, {"$set": {"stage": stage, "status": claim_status}})

    if stage == "approved":
        await database.db.items.update_one({"id": doc["item_id"]}, {"$set": {"status": "claimed"}})

    updated = await database.db.claims.find_one({"_id": oid})
    return _doc_to_claim(updated)


async def list_admin_claims(status_filter: str | None = None) -> list[AdminClaimOut]:
    if database.db is None:
        docs = [doc.copy() for doc in _memory_claims]
        if status_filter:
            docs = [doc for doc in docs if (doc.get("status") or "pending") == status_filter]
        docs.sort(key=lambda doc: doc["created_at"], reverse=True)
        items_by_id = {item["id"]: item for item in _memory_items}
        return [AdminClaimOut(**_doc_to_claim(doc).model_dump(), item=_doc_to_item(items_by_id[doc["item_id"]]) if doc["item_id"] in items_by_id else None) for doc in docs[:500]]

    query = {"status": status_filter} if status_filter else {}
    docs = await database.db.claims.find(query).sort([("created_at", -1)]).to_list(length=500)
    result: list[AdminClaimOut] = []
    for doc in docs:
        item_doc = await database.db.items.find_one({"id": doc["item_id"]})
        result.append(AdminClaimOut(**_doc_to_claim(doc).model_dump(), item=_doc_to_item(item_doc) if item_doc else None))
    return result


async def review_claim(claim_id: str, claim_status: str, admin_notes: str) -> Optional[ClaimOut]:
    try:
        oid = ObjectId(claim_id)
    except Exception:
        return None

    stage = "approved" if claim_status == "approved" else "rejected"
    updates = {"status": claim_status, "stage": stage, "admin_notes": admin_notes}
    if database.db is None:
        doc = next((claim for claim in _memory_claims if claim["_id"] == oid), None)
        if not doc:
            return None
        doc.update(updates)
        if claim_status == "approved":
            item = next((item for item in _memory_items if item["id"] == doc["item_id"]), None)
            if item:
                item["status"] = "claimed"
        else:
            has_pending_claim = any(
                claim["_id"] != oid and claim["item_id"] == doc["item_id"] and (claim.get("status") or "pending") == "pending"
                for claim in _memory_claims
            )
            if not has_pending_claim:
                item = next((item for item in _memory_items if item["id"] == doc["item_id"]), None)
                if item and item["status"] == "in_review":
                    item["status"] = "open"
        return _doc_to_claim(doc)

    doc = await database.db.claims.find_one({"_id": oid})
    if not doc:
        return None
    await database.db.claims.update_one({"_id": oid}, {"$set": updates})
    if claim_status == "approved":
        await database.db.items.update_one({"id": doc["item_id"]}, {"$set": {"status": "claimed"}})
    else:
        has_pending_claim = await database.db.claims.count_documents({
            "item_id": doc["item_id"], "status": "pending", "_id": {"$ne": oid},
        }) > 0
        if not has_pending_claim:
            await database.db.items.update_one(
                {"id": doc["item_id"], "status": "in_review"}, {"$set": {"status": "open"}},
            )
    updated = await database.db.claims.find_one({"_id": oid})
    return _doc_to_claim(updated)


# ---------------------------------------------------------------------------
# Messages / Safe Chat
# ---------------------------------------------------------------------------
async def list_messages(item_id: str) -> Optional[list[MessageOut]]:
    item = await get_item(item_id)
    if not item:
        return None
    if database.db is None:
        docs = [doc for doc in _memory_messages if doc["item_id"] == item_id]
        docs.sort(key=lambda doc: doc["created_at"])
        return [
            MessageOut(
                id=str(doc["_id"]),
                item_id=doc["item_id"],
                sender=doc["sender"],
                text=doc["text"],
                created_at=doc["created_at"],
            )
            for doc in docs[:500]
        ]

    cursor = database.db.messages.find({"item_id": item_id}).sort([("created_at", 1)])
    docs = await cursor.to_list(length=500)
    return [
        MessageOut(
            id=str(doc["_id"]),
            item_id=doc["item_id"],
            sender=doc["sender"],
            text=doc["text"],
            created_at=doc["created_at"],
        )
        for doc in docs
    ]


async def create_message(item_id: str, payload: MessageCreate) -> Optional[MessageOut]:
    item = await get_item(item_id)
    if not item:
        return None
    now = utc_now()
    if database.db is None:
        doc = {
            "_id": ObjectId(),
            "item_id": item_id,
            "sender": payload.sender,
            "text": payload.text,
            "created_at": now,
        }
        _memory_messages.append(doc)
        return MessageOut(
            id=str(doc["_id"]),
            item_id=doc["item_id"],
            sender=doc["sender"],
            text=doc["text"],
            created_at=doc["created_at"],
        )

    result = await database.db.messages.insert_one({
        "item_id": item_id,
        "sender": payload.sender,
        "text": payload.text,
        "created_at": now,
    })
    doc = await database.db.messages.find_one({"_id": result.inserted_id})
    return MessageOut(
        id=str(doc["_id"]),
        item_id=doc["item_id"],
        sender=doc["sender"],
        text=doc["text"],
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------------------
# Handovers
# ---------------------------------------------------------------------------
async def create_handover(payload: HandoverCreate) -> Optional[HandoverOut]:
    item = await get_item(payload.item_id)
    if not item:
        return None
    code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
    now = utc_now()
    if database.db is None:
        doc = {
            "_id": ObjectId(),
            "item_id": payload.item_id,
            "date_label": payload.date_label,
            "slot": payload.slot,
            "code": code,
            "created_at": now,
        }
        _memory_handovers.append(doc)
        return HandoverOut(
            id=str(doc["_id"]),
            item_id=doc["item_id"],
            date_label=doc["date_label"],
            slot=doc["slot"],
            code=doc["code"],
            created_at=doc["created_at"],
        )

    result = await database.db.handovers.insert_one({
        "item_id": payload.item_id,
        "date_label": payload.date_label,
        "slot": payload.slot,
        "code": code,
        "created_at": now,
    })
    doc = await database.db.handovers.find_one({"_id": result.inserted_id})
    return HandoverOut(
        id=str(doc["_id"]),
        item_id=doc["item_id"],
        date_label=doc["date_label"],
        slot=doc["slot"],
        code=doc["code"],
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------------------
# CCTV Requests
# ---------------------------------------------------------------------------
async def create_cctv_request(payload: CctvRequestCreate) -> CctvRequestOut:
    now = utc_now()
    if database.db is None:
        doc = {
            "_id": ObjectId(),
            "location": payload.location,
            "item_title": payload.itemTitle,
            "time_window": payload.timeWindow,
            "status": "queued",
            "created_at": now,
        }
        _memory_cctv_requests.append(doc)
        return CctvRequestOut(
            id=str(doc["_id"]),
            location=doc["location"],
            item_title=doc.get("item_title"),
            time_window=doc.get("time_window"),
            status=doc["status"],
            created_at=doc["created_at"],
        )

    result = await database.db.cctv_requests.insert_one({
        "location": payload.location,
        "item_title": payload.itemTitle,
        "time_window": payload.timeWindow,
        "status": "queued",
        "created_at": now,
    })
    doc = await database.db.cctv_requests.find_one({"_id": result.inserted_id})
    return CctvRequestOut(
        id=str(doc["_id"]),
        location=doc["location"],
        item_title=doc.get("item_title"),
        time_window=doc.get("time_window"),
        status=doc["status"],
        created_at=doc["created_at"],
    )


# ---------------------------------------------------------------------------
# Campus Map
# ---------------------------------------------------------------------------
async def campus_map() -> CampusMapOut:
    items = await list_items()
    counts: dict[str, int] = {zone["id"]: 0 for zone in ZONE_DEFS}
    pins: list[CampusPin] = []

    for item in items:
        zone_id = zone_for_location(item.location)
        counts[zone_id] = counts.get(zone_id, 0) + 1
        if len(pins) < 9 and item.status in {"open", "in_review", "secured"} and item.coordinates:
            pins.append(
                CampusPin(
                    id=item.id,
                    label=item.title.split(",", 1)[0][:18],
                    point=item.coordinates,
                    status=item.status,
                )
            )

    zones = [
        CampusZone(
            id=zone["id"],
            label=zone["label"],
            kind=zone["kind"],
            x=zone["x"],
            z=zone["z"],
            width=zone["width"],
            depth=zone["depth"],
            height=zone["height"],
            itemCount=counts.get(zone["id"], 0),
            securityLevel=zone["securityLevel"],
        )
        for zone in ZONE_DEFS
    ]
    paths = [
        CampusPath.model_validate({"from": path["from"], "to": path["to"]})
        for path in PATH_DEFS
    ]
    return CampusMapOut(zones=zones, paths=paths, pins=pins)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
async def analytics_summary() -> dict[str, object]:
    if database.db is None:
        total_items = len(_memory_items)
        open_items = sum(1 for item in _memory_items if item["status"] == "open")
        secured_items = sum(1 for item in _memory_items if item["status"] == "secured")
        active_claims = sum(1 for claim in _memory_claims if claim["stage"] != "approved")
        escalations = sum(1 for item in _memory_items if item["status"] == "escalated")
        category_counts: dict[str, int] = {}
        for item in _memory_items:
            category_counts[item["category"]] = category_counts.get(item["category"], 0) + 1
        by_category = [
            {"category": category, "count": count}
            for category, count in sorted(category_counts.items(), key=lambda pair: pair[1], reverse=True)[:8]
        ]
        return {
            "total_items": total_items,
            "open_items": open_items,
            "secured_items": secured_items,
            "active_claims": active_claims,
            "escalations": escalations,
            "by_category": by_category,
        }

    total_items = await database.db.items.count_documents({})
    open_items = await database.db.items.count_documents({"status": "open"})
    secured_items = await database.db.items.count_documents({"status": "secured"})
    active_claims = await database.db.claims.count_documents({"stage": {"$ne": "approved"}})
    escalations = await database.db.items.count_documents({"status": "escalated"})

    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    cursor = database.db.items.aggregate(pipeline)
    cat_docs = await cursor.to_list(length=8)

    return {
        "total_items": total_items,
        "open_items": open_items,
        "secured_items": secured_items,
        "active_claims": active_claims,
        "escalations": escalations,
        "by_category": [{"category": doc["_id"], "count": doc["count"]} for doc in cat_docs],
    }


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------
def create_access_token(user_id: str, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# User CRUD (SQLite & Mongo fallback)
# ---------------------------------------------------------------------------
GUEST_USER_EMAIL = "guest@pict.edu"
GUEST_USER_PASSWORD = "pict#2026"


async def get_or_create_guest_user() -> UserOut:
    """Provide a durable owner for demo or unauthenticated report submissions."""
    existing = await get_user_by_email(GUEST_USER_EMAIL)
    if existing is not None:
        return UserOut(
            id=existing["id"],
            email=existing["email"],
            role=existing["role"],
            created_at=existing["created_at"],
            updated_at=existing["updated_at"],
        )
    return await create_user(
        email=GUEST_USER_EMAIL,
        password_hash=hash_password(GUEST_USER_PASSWORD),
        role="student",
    )


async def create_user(email: str, password_hash: str, role: str) -> UserOut:
    now = utc_now()
    clean_email = email.strip().lower()
    user_id = str(ObjectId())

    # 1. Store in SQLite users.db
    with database.get_sqlite_conn() as conn:
        conn.execute(
            """
            INSERT INTO users (id, email, hashed_password, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, clean_email, password_hash, role, now, now),
        )
        conn.commit()

    # 2. Store in Mongo if connected
    if database.db is not None:
        try:
            await database.db.users.insert_one({
                "_id": ObjectId(user_id),
                "email": clean_email,
                "password_hash": password_hash,
                "role": role,
                "created_at": now,
                "updated_at": now,
            })
        except Exception:
            pass

    return UserOut(
        id=user_id,
        email=clean_email,
        role=role,
        created_at=now,
        updated_at=now,
    )


async def get_user_by_email(email: str) -> dict | None:
    clean_email = email.strip().lower()

    # 1. Query SQLite users table
    with database.get_sqlite_conn() as conn:
        row = conn.execute(
            "SELECT id, email, hashed_password, role, created_at, updated_at FROM users WHERE email = ?",
            (clean_email,),
        ).fetchone()
        if row:
            return {
                "id": row["id"],
                "email": row["email"],
                "password_hash": row["hashed_password"],
                "role": row["role"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }

    # 2. Query Mongo if connected
    if database.db is not None:
        try:
            doc = await database.db.users.find_one({"email": clean_email})
            if doc:
                return {
                    "id": str(doc["_id"]),
                    "email": doc["email"],
                    "password_hash": doc["password_hash"],
                    "role": doc["role"],
                    "created_at": doc["created_at"],
                    "updated_at": doc["updated_at"],
                }
        except Exception:
            pass

    return None


async def get_user_by_id(user_id: str) -> UserOut | None:
    # 1. Query SQLite users table
    with database.get_sqlite_conn() as conn:
        row = conn.execute(
            "SELECT id, email, role, created_at, updated_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if row:
            return UserOut(
                id=row["id"],
                email=row["email"],
                role=row["role"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

    # 2. Query Mongo if connected
    if database.db is not None:
        try:
            oid = ObjectId(user_id)
            doc = await database.db.users.find_one({"_id": oid})
            if doc:
                return UserOut(
                    id=str(doc["_id"]),
                    email=doc["email"],
                    role=doc["role"],
                    created_at=doc["created_at"],
                    updated_at=doc["updated_at"],
                )
        except Exception:
            pass

    return None


# ---------------------------------------------------------------------------
# Activity Tracking
# ---------------------------------------------------------------------------
async def log_activity(payload: ActivityCreate, user_id: str | None = None) -> ActivityOut:
    now = utc_now()
    doc = {
        "_id": ObjectId(),
        "user_id": user_id,
        "action": payload.action,
        "item_id": payload.item_id,
        "metadata": payload.metadata,
        "created_at": now,
    }
    if database.db is None:
        _memory_activity_log.append(doc)
        return ActivityOut(
            id=str(doc["_id"]),
            user_id=user_id,
            action=payload.action,
            item_id=payload.item_id,
            metadata=payload.metadata,
            created_at=now,
        )

    doc.pop("_id")
    result = await database.db.activity_log.insert_one(doc)
    return ActivityOut(
        id=str(result.inserted_id),
        user_id=user_id,
        action=payload.action,
        item_id=payload.item_id,
        metadata=payload.metadata,
        created_at=now,
    )


async def list_activity(
    user_id: str | None = None,
    action: str | None = None,
    limit: int = 50,
) -> list[ActivityOut]:
    if database.db is None:
        docs = list(_memory_activity_log)
        if user_id:
            docs = [doc for doc in docs if doc.get("user_id") == user_id]
        if action:
            docs = [doc for doc in docs if doc["action"] == action]
        docs.sort(key=lambda doc: doc["created_at"], reverse=True)
        return [
            ActivityOut(
                id=str(doc["_id"]),
                user_id=doc.get("user_id"),
                action=doc["action"],
                item_id=doc.get("item_id"),
                metadata=doc.get("metadata"),
                created_at=doc["created_at"],
            )
            for doc in docs[:limit]
        ]

    filter_doc: dict = {}
    if user_id:
        filter_doc["user_id"] = user_id
    if action:
        filter_doc["action"] = action
    cursor = database.db.activity_log.find(filter_doc).sort([("created_at", -1)]).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [
        ActivityOut(
            id=str(doc["_id"]),
            user_id=doc.get("user_id"),
            action=doc["action"],
            item_id=doc.get("item_id"),
            metadata=doc.get("metadata"),
            created_at=doc["created_at"],
        )
        for doc in docs
    ]


# ---------------------------------------------------------------------------
# AI report assistant
# ---------------------------------------------------------------------------
def suggest_report_details(payload: AIReportRequest) -> AIReportSuggestion:
    """Generate usable report fields from camera, microphone, photo, or text input.

    The app keeps this server-side so an AI provider key is never exposed in the
    browser. A deterministic local fallback keeps the hackathon demo working even
    when the external AI service or network is unavailable.
    """
    notes = (payload.notes or "").strip()
    haystack = f"{payload.source} {notes} {payload.location or ''}".lower()

    if any(word in haystack for word in ("phone", "iphone", "mobile")):
        return AIReportSuggestion(
            category="Phone",
            title="Phone found on campus",
            description=notes or "Phone captured from staff camera or voice report. Verify lock screen, case, and recent location before handover.",
            brand="Apple" if "iphone" in haystack else None,
            color="Black" if "black" in haystack else None,
        )
    if any(word in haystack for word in ("laptop", "macbook", "charger")):
        return AIReportSuggestion(
            category="Electronics",
            title="Laptop or electronic device",
            description=notes or "Electronic item detected. Add stickers, dents, wallpaper, charger details, or sleeve color if visible.",
            brand="Apple" if "macbook" in haystack else None,
            color="Silver" if "silver" in haystack else None,
        )
    if "key" in haystack:
        return AIReportSuggestion(
            category="Keys",
            title="Keyring found",
            description=notes or "Keyring reported by helping staff. Add number of keys, keychain color, and any access fob markings.",
        )
    if "wallet" in haystack or "card" in haystack:
        return AIReportSuggestion(
            category="Wallet",
            title="Wallet or card holder",
            description=notes or "Wallet or card holder reported. Staff should avoid exposing private card details in the public description.",
        )

    source_label = {
        "photo": "photo",
        "camera": "camera capture",
        "microphone": "voice note",
        "text": "typed note",
    }[payload.source]
    return AIReportSuggestion(
        category="Other",
        title="Found item from staff report",
        description=notes or f"Item report generated from {source_label}. Add identifying marks before submission if needed.",
    )
