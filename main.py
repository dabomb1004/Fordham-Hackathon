import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import tempfile

from pipeline.extractor import extract_claims_from_url, extract_claims_from_image
from pipeline.searcher import search_claim
from pipeline.scorer import score_source
from pipeline.aggregator import aggregate_multi_claim

app = FastAPI(title="AI Content Validation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "AI Content Validation API"}


@app.post("/validate/url")
def validate_url(url: str = Form(...)):
    """Validate claims found at a given URL."""
    claims = extract_claims_from_url(url)
    return _run_pipeline(claims)


@app.post("/validate/image")
def validate_image(file: UploadFile = File(...)):
    """Validate claims found in an uploaded screenshot."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        claims = extract_claims_from_image(tmp_path)
        return _run_pipeline(claims)
    finally:
        os.unlink(tmp_path)


def _run_pipeline(claims: list[str]) -> dict:
    all_scored = []
    for claim in claims:
        sources = search_claim(claim)
        scored = [score_source(s, sources, claim) for s in sources]
        all_scored.append(scored)

    return aggregate_multi_claim(claims, all_scored)
