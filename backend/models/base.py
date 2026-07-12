"""Base document model and PyObjectId helper for MongoDB documents."""
from __future__ import annotations
from typing import Annotated, Any
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, BeforeValidator


def _validate_object_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        if ObjectId.is_valid(v):
            return v
    raise ValueError(f"Invalid ObjectId: {v}")


PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


class BaseDocument(BaseModel):
    """Base model that maps Mongo `_id` <-> `id` and provides serialization helpers."""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, extra="ignore")

    id: PyObjectId | None = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict | None):
        if doc is None:
            return None
        return cls.model_validate(doc)

    def to_mongo(self, exclude_id: bool = True) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if exclude_id and "_id" in data and data["_id"] is None:
            data.pop("_id", None)
        # If id is empty string, drop it so Mongo generates ObjectId
        if exclude_id and data.get("_id") in (None, ""):
            data.pop("_id", None)
        return data
