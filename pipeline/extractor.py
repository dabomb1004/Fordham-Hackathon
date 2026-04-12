import anthropic
import base64
import os
from pathlib import Path


client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def extract_claims_from_url(url: str) -> list[str]:
    """Extract falsifiable claims from a URL using Claude."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Visit this URL and extract the key factual claims that can be verified.
Return ONLY a JSON array of short, searchable claim strings.
Focus on specific, falsifiable statements (statistics, medical claims, product claims, etc).
Maximum 5 claims.

URL: {url}

Example output: ["Vitamin X cures diabetes", "Product Y is FDA approved", "Study shows 90% success rate"]

Return only the JSON array, nothing else.""",
            }
        ],
    )
    import json
    try:
        return json.loads(response.content[0].text)
    except Exception:
        return [response.content[0].text]


def extract_claims_from_image(image_path: str) -> list[str]:
    """Extract falsifiable claims from a screenshot using Claude Vision."""
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")

    ext = Path(image_path).suffix.lower()
    media_type_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"}
    media_type = media_type_map.get(ext, "image/png")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": """Extract the key factual claims from this image that can be verified.
Return ONLY a JSON array of short, searchable claim strings.
Focus on specific, falsifiable statements (statistics, medical claims, product claims, etc).
Maximum 5 claims.

Example output: ["Vitamin X cures diabetes", "Product Y is FDA approved", "Study shows 90% success rate"]

Return only the JSON array, nothing else.""",
                    },
                ],
            }
        ],
    )
    import json
    try:
        return json.loads(response.content[0].text)
    except Exception:
        return [response.content[0].text]
