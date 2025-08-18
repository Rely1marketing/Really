"""Tests for utility fallbacks used when OpenAI isn't available.

The test module tweaks ``sys.path`` so it can import the package when running
from the repository root without installation.
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend import openai_utils


def test_generate_variants_fallback(monkeypatch):
    # Simulate missing OpenAI dependency or API key
    monkeypatch.setattr(openai_utils, "openai", None)
    monkeypatch.setattr(openai_utils, "OPENAI_API_KEY", None)
    assert openai_utils.generate_variants("sell") == ["sell - option A", "sell - option B"]
