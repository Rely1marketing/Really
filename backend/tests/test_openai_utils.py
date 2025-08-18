from backend import openai_utils


def test_generate_variants_fallback(monkeypatch):
    # Simulate missing OpenAI dependency or API key
    monkeypatch.setattr(openai_utils, "openai", None)
    monkeypatch.setattr(openai_utils, "OPENAI_API_KEY", None)
    assert openai_utils.generate_variants("sell") == ["sell - option A", "sell - option B"]
