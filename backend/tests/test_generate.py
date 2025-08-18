"""Tests for campaign generation endpoints.

These tests depend on FastAPI being installed. On environments where FastAPI is
missing (e.g. our CI sandbox), they are skipped gracefully so the overall test
suite can still succeed.
"""

from unittest.mock import patch

import pytest

# Skip this module entirely if FastAPI isn't available.
pytest.importorskip("fastapi")

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

@patch("backend.main.generate_variants", return_value=["Hello A", "Hello B"])
def test_generate_campaign(mock_gen):
    response = client.post("/campaigns/generate", json={"goal": "sell"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["variants"]) == 2
    assert data["variants"][0]["variant"] == "A"
