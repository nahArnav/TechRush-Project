from __future__ import annotations

import math
import os
import secrets
import sqlite3
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from dotenv import load_dotenv

from .models import (
    CampusMapOut,
    CampusPath,
    CampusPin,
    CampusPoint,
    CampusZone,
    ClaimCreate,
    ClaimOut,
    ClaimStage,
    CctvRequestCreate,
    CctvRequestOut,
    HandoverCreate,
    HandoverOut,
    ItemCreate,
    ItemOut,
    ItemStatus,
    ItemType,
    MessageCreate,
    MessageOut,
    Role,
    UserOut,
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DB_PATH = Path(os.getenv("LOST_FOUND_DB", Path(__file__).resolve().parents[1] / "lost_found.sqlite3"))
JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_jwt_key_techrush_2026")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
SENSITIVE_CATEGORIES = {"Government ID", "Medicine", "ID Card"}

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


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'student',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              role TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS items (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              category TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              location TEXT NOT NULL,
              date TEXT NOT NULL,
              status TEXT NOT NULL,
              match_score REAL NOT NULL,
              coord_x REAL,
              coord_z REAL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS claims (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              stage TEXT NOT NULL,
              claimant_role TEXT NOT NULL,
              proof TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              sender TEXT NOT NULL,
              text TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS handovers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
              date_label TEXT NOT NULL,
              slot TEXT NOT NULL,
              code TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS cctv_requests (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              location TEXT NOT NULL,
              item_title TEXT,
              time_window TEXT,
              status TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        count = conn.execute("SELECT COUNT(*) AS count FROM items").fetchone()["count"]
        if count == 0:
            seed_items(conn)


def seed_items(conn: sqlite3.Connection) -> None:
    now = utc_now()
    for item in SEED_ITEMS:
        coord_x, coord_z = infer_coordinates(item[5])
        conn.execute(
            """
            INSERT INTO items
              (id, type, category, title, description, location, date, status, match_score, coord_x, coord_z, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (*item, coord_x, coord_z, now),
        )

    conn.execute(
        "INSERT INTO claims (item_id, stage, claimant_role, proof, created_at) VALUES (?, ?, ?, ?, ?)",
        ("LF-1043", "review", "student", "Sleeve has a small tear near the zipper.", now),
    )


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


def row_to_item(row: sqlite3.Row) -> ItemOut:
    coordinates = None
    if row["coord_x"] is not None and row["coord_z"] is not None:
        coordinates = CampusPoint(x=row["coord_x"], z=row["coord_z"])
    return ItemOut(
        id=row["id"],
        type=row["type"],
        category=row["category"],
        title=row["title"],
        description=row["description"],
        location=row["location"],
        date=row["date"],
        status=row["status"],
        match_score=row["match_score"],
        coordinates=coordinates,
    )


def row_to_claim(row: sqlite3.Row) -> ClaimOut:
    return ClaimOut(
        id=row["id"],
        item_id=row["item_id"],
        stage=row["stage"],
        claimant_role=row["claimant_role"],
        proof_submitted=bool(row["proof"]),
        created_at=row["created_at"],
    )


def issue_session(role: Role) -> str:
    token = secrets.token_urlsafe(32)
    with connect() as conn:
        conn.execute(
            "INSERT INTO sessions (token, role, created_at) VALUES (?, ?, ?)",
            (token, role, utc_now()),
        )
    return token


def get_session_role(token: str) -> Optional[Role]:
    with connect() as conn:
        row = conn.execute("SELECT role FROM sessions WHERE token = ?", (token,)).fetchone()
    return row["role"] if row else None


def list_items(
    query: Optional[str] = None,
    item_type: Optional[ItemType] = None,
    status: Optional[ItemStatus] = None,
    category: Optional[str] = None,
) -> list[ItemOut]:
    clauses = []
    params: list[str] = []
    if query:
        clauses.append("(title LIKE ? OR description LIKE ? OR location LIKE ? OR category LIKE ?)")
        term = f"%{query}%"
        params.extend([term, term, term, term])
    if item_type:
        clauses.append("type = ?")
        params.append(item_type)
    if status:
        clauses.append("status = ?")
        params.append(status)
    if category:
        clauses.append("category = ?")
        params.append(category)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with connect() as conn:
        rows = conn.execute(
            f"SELECT * FROM items {where} ORDER BY date DESC, created_at DESC, id DESC",
            params,
        ).fetchall()
    return [row_to_item(row) for row in rows]


def get_item(item_id: str) -> Optional[ItemOut]:
    with connect() as conn:
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    return row_to_item(row) if row else None


def next_item_id(conn: sqlite3.Connection) -> str:
    rows = conn.execute("SELECT id FROM items WHERE id LIKE 'LF-%'").fetchall()
    highest = 1000
    for row in rows:
        try:
            highest = max(highest, int(row["id"].split("-", 1)[1]))
        except (IndexError, ValueError):
            continue
    return f"LF-{highest + 1}"


def infer_status(payload: ItemCreate) -> ItemStatus:
    if payload.category in SENSITIVE_CATEGORIES:
        return "escalated" if payload.type == "lost" else "secured"
    return "open" if payload.type == "lost" else "secured"


def infer_match_score(conn: sqlite3.Connection, payload: ItemCreate) -> float:
    opposite = "found" if payload.type == "lost" else "lost"
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM items WHERE type = ? AND category = ?",
        (opposite, payload.category),
    ).fetchone()
    count = row["count"] if row else 0
    score = 0.34 + min(count, 5) * 0.11
    if payload.brand:
        score += 0.08
    if payload.color:
        score += 0.05
    return round(min(score, 0.96), 2)


def create_item(payload: ItemCreate) -> ItemOut:
    with connect() as conn:
        item_id = next_item_id(conn)
        coord_x, coord_z = infer_coordinates(payload.location)
        status = infer_status(payload)
        match_score = infer_match_score(conn, payload)
        conn.execute(
            """
            INSERT INTO items
              (id, type, category, title, description, location, date, status, match_score, coord_x, coord_z, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                payload.type,
                payload.category,
                payload.title,
                payload.description,
                payload.location,
                payload.date,
                status,
                match_score,
                coord_x,
                coord_z,
                utc_now(),
            ),
        )
        row = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
    return row_to_item(row)


def list_claims() -> list[ClaimOut]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM claims ORDER BY created_at DESC, id DESC").fetchall()
    return [row_to_claim(row) for row in rows]


def create_claim(payload: ClaimCreate, role: Role) -> Optional[ClaimOut]:
    with connect() as conn:
        item = conn.execute("SELECT id, status FROM items WHERE id = ?", (payload.item_id,)).fetchone()
        if not item:
            return None
        conn.execute(
            "INSERT INTO claims (item_id, stage, claimant_role, proof, created_at) VALUES (?, ?, ?, ?, ?)",
            (payload.item_id, "submitted", role, payload.proof, utc_now()),
        )
        if item["status"] not in {"closed", "escalated"}:
            conn.execute("UPDATE items SET status = ? WHERE id = ?", ("in_review", payload.item_id))
        row = conn.execute("SELECT * FROM claims WHERE id = last_insert_rowid()").fetchone()
    return row_to_claim(row)


def update_claim_stage(claim_id: int, stage: ClaimStage) -> Optional[ClaimOut]:
    with connect() as conn:
        row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
        if not row:
            return None
        conn.execute("UPDATE claims SET stage = ? WHERE id = ?", (stage, claim_id))
        if stage == "approved":
            conn.execute("UPDATE items SET status = ? WHERE id = ?", ("closed", row["item_id"]))
        updated = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    return row_to_claim(updated)


def list_messages(item_id: str) -> Optional[list[MessageOut]]:
    if not get_item(item_id):
        return None
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM messages WHERE item_id = ? ORDER BY created_at ASC, id ASC",
            (item_id,),
        ).fetchall()
    return [MessageOut(**dict(row)) for row in rows]


def create_message(item_id: str, payload: MessageCreate) -> Optional[MessageOut]:
    if not get_item(item_id):
        return None
    with connect() as conn:
        conn.execute(
            "INSERT INTO messages (item_id, sender, text, created_at) VALUES (?, ?, ?, ?)",
            (item_id, payload.sender, payload.text, utc_now()),
        )
        row = conn.execute("SELECT * FROM messages WHERE id = last_insert_rowid()").fetchone()
    return MessageOut(**dict(row))


def create_handover(payload: HandoverCreate) -> Optional[HandoverOut]:
    if not get_item(payload.item_id):
        return None
    code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
    with connect() as conn:
        conn.execute(
            "INSERT INTO handovers (item_id, date_label, slot, code, created_at) VALUES (?, ?, ?, ?, ?)",
            (payload.item_id, payload.date_label, payload.slot, code, utc_now()),
        )
        row = conn.execute("SELECT * FROM handovers WHERE id = last_insert_rowid()").fetchone()
    return HandoverOut(**dict(row))


def create_cctv_request(payload: CctvRequestCreate) -> CctvRequestOut:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO cctv_requests (location, item_title, time_window, status, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.location, payload.itemTitle, payload.timeWindow, "queued", utc_now()),
        )
        row = conn.execute("SELECT * FROM cctv_requests WHERE id = last_insert_rowid()").fetchone()
    return CctvRequestOut(**dict(row))


def campus_map() -> CampusMapOut:
    items = list_items()
    counts = {zone["id"]: 0 for zone in ZONE_DEFS}
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


def analytics_summary() -> dict[str, object]:
    with connect() as conn:
        total_items = conn.execute("SELECT COUNT(*) AS count FROM items").fetchone()["count"]
        open_items = conn.execute("SELECT COUNT(*) AS count FROM items WHERE status = 'open'").fetchone()["count"]
        secured_items = conn.execute("SELECT COUNT(*) AS count FROM items WHERE status = 'secured'").fetchone()["count"]
        active_claims = conn.execute("SELECT COUNT(*) AS count FROM claims WHERE stage != 'approved'").fetchone()["count"]
        escalations = conn.execute("SELECT COUNT(*) AS count FROM items WHERE status = 'escalated'").fetchone()["count"]
        rows = conn.execute(
            "SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC LIMIT 8"
        ).fetchall()
    return {
        "total_items": total_items,
        "open_items": open_items,
        "secured_items": secured_items,
        "active_claims": active_claims,
        "escalations": escalations,
        "by_category": [{"category": row["category"], "count": row["count"]} for row in rows],
    }


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: int, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
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


def create_user(email: str, password_hash: str, role: str) -> UserOut:
    now = utc_now()
    clean_email = email.strip().lower()
    with connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO users (email, password_hash, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (clean_email, password_hash, role, now, now),
        )
        user_id = cursor.lastrowid
        return UserOut(
            id=user_id,
            email=clean_email,
            role=role,
            created_at=now,
            updated_at=now,
        )


def get_user_by_email(email: str) -> sqlite3.Row | None:
    clean_email = email.strip().lower()
    with connect() as conn:
        return conn.execute("SELECT * FROM users WHERE email = ?", (clean_email,)).fetchone()


def get_user_by_id(user_id: int) -> UserOut | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if row is None:
            return None
        return UserOut(
            id=row["id"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

