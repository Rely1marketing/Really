import os
from typing import List

# ``openai`` is an optional dependency during development/testing.  The
# frontend calls the backend even when no OpenAI API key is configured which
# would previously raise an exception and result in the "Failed to generate
# campaign" error message.  Import ``openai`` defensively and fall back to a
# simple variant generator when it is unavailable or an API error occurs.
try:  # pragma: no cover - import failure is tested separately
    import openai  # type: ignore
except Exception:  # ImportError or any runtime error
    openai = None  # type: ignore

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if openai and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

PROMPT_TEMPLATE = (
    "Generate two short SMS messages (max 160 characters) that achieve the goal: '{goal}'. "
    "Provide variants A and B. Messages must comply with SMS marketing rules."
)

def _fallback(goal: str) -> List[str]:
    """Return simple placeholder messages."""
    return [f"{goal} - option A", f"{goal} - option B"]


def generate_variants(goal: str) -> List[str]:
    """Generate two SMS variants for the given goal.

    The function attempts to call the OpenAI API but gracefully falls back to
    deterministic placeholder messages if the API is unavailable or returns an
    unexpected response.  This prevents the frontend from showing an error
    when the developer does not have an API key configured.
    """

    # If the OpenAI library or API key is missing, return the fallback variants
    if not openai or not OPENAI_API_KEY:  # pragma: no cover - handled by tests
        return _fallback(goal)

    prompt = PROMPT_TEMPLATE.format(goal=goal)
    try:
        response = openai.ChatCompletion.create(  # type: ignore[attr-defined]
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            n=1,
            temperature=0.7,
        )
        text = response.choices[0].message["content"]
    except Exception:
        return _fallback(goal)

    # Expect output like "A: message1\nB: message2"
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    variants = []
    for line in lines:
        if line[0].upper() in ("A", "B"):
            variants.append(line.split(":", 1)[1].strip())
    if len(variants) < 2:
        return _fallback(goal)
    return variants[:2]
