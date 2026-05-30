import hmac
import hashlib
import os

def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verify GitHub webhook signature for security
    """
    secret = os.getenv("GITHUB_WEBHOOK_SECRET", "")

    if not secret:
        print("⚠️ No webhook secret set, skipping verification")
        return True

    expected = "sha256=" + hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def parse_pr_event(payload: dict) -> dict | None:
    """
    Extract useful data from GitHub webhook payload
    Returns None if not a PR open/reopen event
    """
    action = payload.get("action")

    # Only review when PR is opened or reopened
    if action not in ["opened", "reopened", "synchronize"]:
        print(f"⏭️ Skipping action: {action}")
        return None

    pr = payload.get("pull_request", {})
    repo = payload.get("repository", {})

    return {
        "action": action,
        "pr_number": pr.get("number"),
        "pr_title": pr.get("title"),
        "pr_author": pr.get("user", {}).get("login"),
        "pr_url": pr.get("html_url"),
        "repo_name": repo.get("full_name"),
    }