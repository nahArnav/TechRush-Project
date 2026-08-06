from __future__ import annotations

from typing import Literal, Optional, Union

from pydantic import BaseModel, Field

ItemType = Literal["lost", "found"]
ItemStatus = Literal["open", "in_review", "secured", "escalated", "closed"]
ClaimStage = Literal["submitted", "review", "approved"]
Role = Literal["student", "staff", "admin"]
SecurityLevel = Literal["public", "staff", "security"]
ZoneKind = Literal["building", "ground", "service"]


class CampusPoint(BaseModel):
    x: float
    z: float


class ItemCreate(BaseModel):
    type: ItemType
    category: str = Field(min_length=2, max_length=80)
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=3, max_length=800)
    location: str = Field(min_length=2, max_length=180)
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    brand: Optional[str] = Field(default=None, max_length=80)
    color: Optional[str] = Field(default=None, max_length=80)
    anonymous: bool = False


class ItemOut(BaseModel):
    id: str
    type: ItemType
    category: str
    title: str
    description: str
    location: str
    date: str
    status: ItemStatus
    match_score: float = Field(ge=0, le=1)
    coordinates: Optional[CampusPoint] = None


class ItemList(BaseModel):
    items: list[ItemOut]


class ClaimCreate(BaseModel):
    item_id: str
    proof: str = Field(min_length=10, max_length=1200)


class ClaimStageUpdate(BaseModel):
    stage: ClaimStage


class ClaimOut(BaseModel):
    id: int
    item_id: str
    stage: ClaimStage
    claimant_role: Role
    proof_submitted: bool
    created_at: str


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    sender: Literal["me", "them", "staff", "system"] = "me"


class MessageOut(BaseModel):
    id: int
    item_id: str
    sender: str
    text: str
    created_at: str


class HandoverCreate(BaseModel):
    item_id: str
    date_label: str = Field(min_length=3, max_length=40)
    slot: str = Field(min_length=3, max_length=40)


class HandoverOut(BaseModel):
    id: int
    item_id: str
    date_label: str
    slot: str
    code: str
    created_at: str


class CctvRequestCreate(BaseModel):
    location: str = Field(min_length=2, max_length=180)
    itemTitle: Optional[str] = Field(default=None, max_length=160)
    timeWindow: Optional[str] = Field(default=None, max_length=120)


class CctvRequestOut(BaseModel):
    id: int
    location: str
    item_title: Optional[str]
    time_window: Optional[str]
    status: Literal["queued", "reviewing", "closed"]
    created_at: str


class CampusZone(BaseModel):
    id: str
    label: str
    kind: ZoneKind
    x: float
    z: float
    width: float
    depth: float
    height: float
    itemCount: int
    securityLevel: SecurityLevel


class CampusPath(BaseModel):
    from_: CampusPoint = Field(alias="from")
    to: CampusPoint


class CampusPin(BaseModel):
    id: str
    label: str
    point: CampusPoint
    status: ItemStatus


class CampusMapOut(BaseModel):
    zones: list[CampusZone]
    paths: list[CampusPath]
    pins: list[CampusPin]


class AnalyticsSummary(BaseModel):
    total_items: int
    open_items: int
    secured_items: int
    active_claims: int
    escalations: int
    by_category: list[dict[str, Union[int, str]]]


class DemoSessionCreate(BaseModel):
    role: Role


class SessionOut(BaseModel):
    token: str
    role: Role


class UserRegister(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=6, max_length=128)
    role: Optional[Role] = "student"


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    role: Role
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: Role

