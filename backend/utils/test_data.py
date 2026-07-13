"""Test-data detection & filter helpers.

Belt-and-suspenders strategy:
  1. `is_test_data: true` boolean flag  — primary signal, set by future test infra.
  2. Regex fallback on `name`/`title`  — defensive net for legacy pytest data
     that predates the flag (e.g., "TEST_Foo", "V1", "U2 Widget").

Regex pattern (case-insensitive):
    ^(test\b|test_|[uv]\d+ |[uv]\d+$)

  Matches:
    - "test", "Test", "TEST any"
    - "TEST_Buyer", "test_widget"
    - "V1 Foo", "u2 Boost Test"
    - "V1", "U9"  (exact single-token)
"""
from __future__ import annotations

# Raw regex (Python + MongoDB-compatible). Use \\b in Python source → \b at runtime.
TEST_DATA_REGEX = r"^(test\b|test_|[uv]\d+ |[uv]\d+$)"


def not_test_filter(name_field: str) -> dict:
    """Return the AND-clauses to add to a Mongo query to exclude test data.

    Usage:
        q = {"is_deleted": {"$ne": True}, **not_test_filter("title")}
    """
    return {
        "is_test_data": {"$ne": True},
        name_field: {"$not": {"$regex": TEST_DATA_REGEX, "$options": "i"}},
    }


def test_data_or_filter(name_field: str) -> dict:
    """Return a Mongo $or filter that MATCHES test data (used by the purge job)."""
    return {
        "$or": [
            {"is_test_data": True},
            {name_field: {"$regex": TEST_DATA_REGEX, "$options": "i"}},
        ]
    }
