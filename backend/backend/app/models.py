from __future__ import annotations

from typing import Annotated, Any, Literal, Optional, Union

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema

ItemType = Literal["lost", "found"]
ItemStatus = Literal["open", "in_review", "secured", "escalated", "closed"]
ClaimStage = Literal["submitted", "review", "approved"]
Role = Literal["student", "staff", "admin"]
SecurityLevel = Literal["public", "staff", "security"]
ZoneKind = Literal["building", "ground", "service"]


# ---------------------------------------------------------------------------
# PyObjectId: custom type that lets Pydantic serialize ObjectId ↔ str
# ---------------------------------------------------------------------------
class _ObjectIdPydanticAnnotation:
    """Pydantic-v2 compatible annotation for BSON ObjectId fields."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        _source_type: Any,
        _handler: Any,
    ) -> core_schema.CoreSchema:
        def validate_object_id(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if ObjectId.is_valid(value):
                return ObjectId(value)
            raise ValueError("Invalid ObjectId")

        return core_schema.no_info_plain_validator_function(
            validate_object_id,
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls,
        _schema: core_schema.CoreSchema,
        handler: GetJsonSchemaHandler,
    ) -> JsonSchemaValue:
        return handler(core_schema.str_schema())


PyObjectId = Annotated[ObjectId, _ObjectIdPydanticAnnotation]


# ---------------------------------------------------------------------------
# Shared / Map models
# ---------------------------------------------------------------------------
class CampusPoint(BaseModel):
    x: float
    z: float


# ---------------------------------------------------------------------------
# Item models
# ---------------------------------------------------------------------------
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
    # Client context only. Ownership is always derived from the authenticated
    # session on the server and never from these optional values.
    reporter_id: Optional[str] = Field(default=None, max_length=80)
    reporter_email: Optional[str] = Field(default=None, max_length=254)


class ItemOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

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
    # The authenticated user who created the report. Seeded legacy reports may
    # not have an owner, so this remains optional for backwards compatibility.
    user_id: Optional[str] = None
    sighting_count: int = 0
    sighted_by_user_ids: list[str] = Field(default_factory=list)


class ItemList(BaseModel):
    items: list[ItemOut]


class ItemSightingOut(BaseModel):
    item_id: str
    sighting_count: int
    sighted: bool
    sighted_by_user_ids: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Claim models
# ---------------------------------------------------------------------------
class ClaimCreate(BaseModel):
    item_id: str
    proof: str = Field(min_length=10, max_length=1200)


class ClaimStageUpdate(BaseModel):
    stage: ClaimStage


class ClaimOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    item_id: str
    stage: ClaimStage
    claimant_role: Role
    proof_submitted: bool
    created_at: str


# ---------------------------------------------------------------------------
# Message / Chat models
# ---------------------------------------------------------------------------
class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    sender: Literal["me", "them", "staff", "system"] = "me"


class MessageOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    item_id: str
    sender: str
    text: str
    created_at: str


# ---------------------------------------------------------------------------
# Handover models
# ---------------------------------------------------------------------------
class HandoverCreate(BaseModel):
    item_id: str
    date_label: str = Field(min_length=3, max_length=40)
    slot: str = Field(min_length=3, max_length=40)


class HandoverOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    item_id: str
    date_label: str
    slot: str
    code: str
    created_at: str


# ---------------------------------------------------------------------------
# CCTV Request models
# ---------------------------------------------------------------------------
class CctvRequestCreate(BaseModel):
    location: str = Field(min_length=2, max_length=180)
    itemTitle: Optional[str] = Field(default=None, max_length=160)
    timeWindow: Optional[str] = Field(default=None, max_length=120)


class CctvRequestOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    location: str
    item_title: Optional[str]
    time_window: Optional[str]
    status: Literal["queued", "reviewing", "closed"]
    created_at: str


# ---------------------------------------------------------------------------
# Campus Map models
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
class AnalyticsSummary(BaseModel):
    total_items: int
    open_items: int
    secured_items: int
    active_claims: int
    escalations: int
    by_category: list[dict[str, Union[int, str]]]


# ---------------------------------------------------------------------------
# Auth / Session models
# ---------------------------------------------------------------------------
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
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    email: str
    role: Role
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: Role


# ---------------------------------------------------------------------------
# Activity Tracking models
# ---------------------------------------------------------------------------
class ActivityCreate(BaseModel):
    action: str = Field(min_length=1, max_length=120)
    item_id: Optional[str] = Field(default=None, max_length=40)
    metadata: Optional[dict] = None


class ActivityOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

    id: str
    user_id: Optional[str] = None
    action: str
    item_id: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: str


# ---------------------------------------------------------------------------
# AI report assistant models
# ---------------------------------------------------------------------------
class AIReportRequest(BaseModel):
    source: Literal["photo", "camera", "microphone", "text"]
    notes: Optional[str] = Field(default=None, max_length=1200)
    location: Optional[str] = Field(default=None, max_length=180)


class AIReportSuggestion(BaseModel):
    category: str
    title: str
    description: str
    brand: Optional[str] = None
    color: Optional[str] = None
