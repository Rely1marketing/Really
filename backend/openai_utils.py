import os
from typing import List

import openai

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
openai.api_key = os.getenv("OPENAI_API_KEY")

PROMPT_TEMPLATE = (
    "Generate two short SMS messages (max 160 characters) that achieve the goal: '{goal}'. "
    "Provide variants A and B. Messages must comply with SMS marketing rules."
)

def generate_variants(goal: str) -> List[str]:
    prompt = PROMPT_TEMPLATE.format(goal=goal)
    response = openai.ChatCompletion.create(
        model=OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        n=1,
        temperature=0.7,
    )
    text = response.choices[0].message["content"]
    # Expect output like "A: message1\nB: message2"
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    variants = []
    for line in lines:
        if line[0].upper() in ("A", "B"):
            variants.append(line.split(":", 1)[1].strip())
    if len(variants) < 2:
        # Fallback simple messages
        variants = [f"{goal} - option A", f"{goal} - option B"]
    return variants[:2]
