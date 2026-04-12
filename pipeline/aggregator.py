import os
import anthropic


client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def aggregate_results(claim: str, scored_sources: list[dict]) -> dict:
    """Aggregate scored sources into a final verdict for a claim."""
    allowed = [s for s in scored_sources if s["verdict"] == "ALLOWED"]
    flagged = [s for s in scored_sources if s["verdict"] == "FLAGGED"]
    blocked = [s for s in scored_sources if s["verdict"] == "BLOCKED"]

    agree = [s for s in allowed + flagged if s["stance"] == "AGREE"]
    disagree = [s for s in allowed + flagged if s["stance"] == "DISAGREE"]
    neutral = [s for s in allowed + flagged if s["stance"] == "NEUTRAL"]

    total_trusted = len(allowed) + len(flagged)
    if total_trusted == 0:
        overall_score = 0
    else:
        agree_ratio = len(agree) / total_trusted
        avg_trust = sum(s["trust_score"] for s in allowed + flagged) / total_trusted
        overall_score = int((agree_ratio * 0.6 + avg_trust * 0.4) * 100)

    if overall_score >= 70:
        verdict = "LIKELY CREDIBLE"
    elif overall_score >= 40:
        verdict = "DISPUTED"
    else:
        verdict = "LIKELY FALSE"

    explanation = _generate_explanation(claim, agree, disagree, blocked, flagged, overall_score)

    return {
        "claim": claim,
        "overall_score": overall_score,
        "verdict": verdict,
        "explanation": explanation,
        "summary": {
            "agree": len(agree),
            "disagree": len(disagree),
            "neutral": len(neutral),
            "flagged": len(flagged),
            "blocked": len(blocked),
            "total_searched": len(scored_sources),
        },
        "sources": {
            "agree": agree,
            "disagree": disagree,
            "neutral": neutral,
            "flagged": flagged,
            "blocked": blocked,
        },
    }


def _generate_explanation(claim, agree, disagree, blocked, flagged, score) -> str:
    """Generate a plain-language explanation of the verdict."""
    context = f"""
Claim: "{claim}"
Sources that agree: {len(agree)}
Sources that disagree: {len(disagree)}
Sources flagged as low-trust: {len(flagged)}
Sources blocked as unreliable: {len(blocked)}
Overall credibility score: {score}/100

Write a 2-3 sentence plain-language explanation of this verdict for a non-technical user.
Be specific about the numbers. Mention if sources were blocked and why briefly.
Do not use technical jargon.
"""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{"role": "user", "content": context}],
    )
    return response.content[0].text.strip()


def aggregate_multi_claim(claims: list[str], all_scored: list[list[dict]]) -> dict:
    """Aggregate results across multiple claims into one overall report."""
    claim_results = []
    for claim, scored in zip(claims, all_scored):
        claim_results.append(aggregate_results(claim, scored))

    scores = [r["overall_score"] for r in claim_results]
    overall = int(sum(scores) / len(scores)) if scores else 0

    if overall >= 70:
        overall_verdict = "LIKELY CREDIBLE"
    elif overall >= 40:
        overall_verdict = "DISPUTED"
    else:
        overall_verdict = "LIKELY FALSE"

    return {
        "overall_score": overall,
        "overall_verdict": overall_verdict,
        "claim_count": len(claims),
        "claims": claim_results,
    }
