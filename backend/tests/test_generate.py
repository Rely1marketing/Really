from fastapi.testclient import TestClient
from unittest.mock import patch
from api.index import app

client = TestClient(app)

@patch("api.index.generate_variants", return_value=["Hello A", "Hello B"])
def test_generate_campaign(mock_gen):
    response = client.post("/campaigns/generate", json={"goal": "sell"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["variants"]) == 2
    assert data["variants"][0]["variant"] == "A"
