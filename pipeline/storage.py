import json
import os
from datetime import datetime

USER_FILE = "data/user.json"
HISTORY_FILE = "data/history.json"


def get_user() -> dict:
    with open(USER_FILE) as f:
        return json.load(f)


def save_user(user: dict):
    with open(USER_FILE, "w") as f:
        json.dump(user, f, indent=2)


def get_history() -> list:
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE) as f:
        return json.load(f)


def append_history(input_val: str, input_type: str, result: dict):
    history = get_history()
    history.insert(0, {
        "id": len(history) + 1,
        "input": input_val,
        "input_type": input_type,
        "verdict": result.get("overall_verdict"),
        "score": result.get("overall_score"),
        "claim_count": result.get("claim_count", 0),
        "timestamp": datetime.now().isoformat(),
        "claims": result.get("claims", []),
    })
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)
