import os
import json
from datetime import datetime, timezone
import tldextract
import whois
import anthropic


_anthropic_client = None


def _get_anthropic_client():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    return _anthropic_client


def score_domain(url: str) -> float:
    """Score domain trustworthiness based on age and TLD heuristics."""
    try:
        extracted = tldextract.extract(url)
        domain = f"{extracted.domain}.{extracted.suffix}"

        # High-trust TLD bonuses
        if any(t in url for t in [".gov", ".edu"]):
            return 0.95

        # Known trusted domains
        trusted = ["reuters.com", "bbc.com", "apnews.com", "nature.com",
                   "nih.gov", "who.int", "cdc.gov", "mayoclinic.org",
                   "webmd.com", "harvard.edu", "nytimes.com", "wsj.com"]
        if any(t in url for t in trusted):
            return 0.90

        # Check domain age
        w = whois.whois(domain)
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]

        if creation:
            age_days = (datetime.now() - creation.replace(tzinfo=None)).days
            if age_days > 365 * 5:
                return 0.80
            elif age_days > 365 * 2:
                return 0.65
            elif age_days > 180:
                return 0.50
            elif age_days > 90:
                return 0.35
            else:
                return 0.10  # Very new domain — suspicious

        return 0.40  # Unknown age — moderate distrust

    except Exception:
        return 0.40


def _jaccard_similarity(text_a: str, text_b: str) -> float:
    """Lightweight keyword overlap similarity (no ML dependencies)."""
    words_a = set(text_a.lower().split())
    words_b = set(text_b.lower().split())
    if not words_a or not words_b:
        return 0.0
    return len(words_a & words_b) / len(words_a | words_b)


def detect_burst(sources: list[dict]) -> float:
    """Detect coordinated content burst — many similar articles published at once."""
    contents = [s["content"] for s in sources if s.get("content")]
    if len(contents) < 3:
        return 0.0

    # Compute average pairwise Jaccard similarity
    pairs = 0
    total_sim = 0.0
    for i in range(len(contents)):
        for j in range(i + 1, len(contents)):
            total_sim += _jaccard_similarity(contents[i], contents[j])
            pairs += 1
    avg_similarity = total_sim / pairs if pairs else 0.0

    # Check temporal clustering
    dates = []
    for s in sources:
        if s.get("published_date"):
            try:
                dates.append(datetime.fromisoformat(s["published_date"].replace("Z", "+00:00")))
            except Exception:
                pass

    temporal_flag = 0.0
    if len(dates) >= 3:
        dates.sort()
        span_days = (dates[-1] - dates[0]).days
        if span_days < 2 and avg_similarity > 0.75:
            temporal_flag = 1.0
        elif span_days < 7 and avg_similarity > 0.85:
            temporal_flag = 0.7

    burst_score = (avg_similarity * 0.5) + (temporal_flag * 0.5)
    return min(burst_score, 1.0)


def score_manipulation(content: str) -> dict:
    """Use Claude Haiku to score text for manipulation signals."""
    client = _get_anthropic_client()

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze this text for content manipulation or misinformation signals.
Score each signal from 0 (not present) to 1 (strongly present):

1. exaggerated_sentiment: Superlatives, alarming language, emotional manipulation
2. lacks_citations: No verifiable sources, vague references
3. one_sided: No counterarguments or alternative perspectives
4. ai_generated_spam: Templated, repetitive, or synthetic-feeling text
5. unverifiable_claims: Specific statistics or facts with no attribution

Return ONLY valid JSON:
{{"exaggerated_sentiment": 0.0, "lacks_citations": 0.0, "one_sided": 0.0, "ai_generated_spam": 0.0, "unverifiable_claims": 0.0, "manipulation_score": 0.0, "flags": []}}

Text: {content[:1500]}""",
            }
        ],
    )

    try:
        return json.loads(response.content[0].text)
    except Exception:
        return {
            "manipulation_score": 0.5,
            "flags": ["parse_error"],
        }


def detect_stance(content: str, claim: str) -> str:
    """Detect whether a source agrees, disagrees, or is neutral on a claim."""
    client = _get_anthropic_client()

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=64,
        messages=[
            {
                "role": "user",
                "content": f"""Does this text AGREE, DISAGREE, or is NEUTRAL regarding this claim?

Claim: {claim}
Text: {content[:800]}

Reply with exactly one word: AGREE, DISAGREE, or NEUTRAL""",
            }
        ],
    )

    stance = response.content[0].text.strip().upper()
    if stance not in ["AGREE", "DISAGREE", "NEUTRAL"]:
        return "NEUTRAL"
    return stance


def score_source(source: dict, all_sources: list[dict], claim: str) -> dict:
    """Run all scoring signals on a single source."""
    domain_score = score_domain(source["url"])
    manipulation = score_manipulation(source["content"])
    manipulation_score = manipulation.get("manipulation_score", 0.5)
    burst_score = detect_burst(all_sources)
    stance = detect_stance(source["content"], claim)

    final_score = (
        0.35 * domain_score
        + 0.30 * (1 - burst_score)
        + 0.35 * (1 - manipulation_score)
    )

    if final_score < 0.40:
        verdict = "BLOCKED"
    elif final_score < 0.65:
        verdict = "FLAGGED"
    else:
        verdict = "ALLOWED"

    return {
        **source,
        "domain_score": round(domain_score, 2),
        "manipulation_score": round(manipulation_score, 2),
        "burst_score": round(burst_score, 2),
        "trust_score": round(final_score, 2),
        "verdict": verdict,
        "stance": stance,
        "flags": manipulation.get("flags", []),
    }
