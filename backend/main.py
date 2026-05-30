from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from webhook import verify_webhook_signature, parse_pr_event
import json, os

load_dotenv()

app = FastAPI(title="AI Code Reviewer")

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:5173",
        "https://your-app.vercel.app",
        "*"  
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------
# DYNAMIC REVIEWER — uses model from request
# -----------------------------------------------
def build_chain(provider: str, model: str, api_key: str):
    from langchain_core.prompts import PromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    template = PromptTemplate(
        template="""You are a senior software engineer performing a
professional GitHub Pull Request code review.

Analyze the given code diff and return a structured
JSON response ONLY. No extra text. No markdown.
No backticks. Just raw JSON.

Return this exact JSON format:
{{
  "summary": "brief overall review summary",
  "overall_score": 85,
  "bugs": [
    {{
      "line": 10,
      "description": "bug description here",
      "severity": "high"
    }}
  ],
  "improvements": [
    {{
      "line": 5,
      "description": "improvement suggestion here",
      "severity": "medium"
    }}
  ],
  "security_issues": [
    {{
      "line": 3,
      "description": "security issue description",
      "severity": "high"
    }}
  ],
  "positive_points": [
    "what developer did well"
  ]
}}

Severity levels: "high", "medium", "low"
Return JSON only. No markdown. No explanation.

File: {filename}
Status: {status}

Diff to review:
{diff}""",
        input_variables=["filename", "status", "diff"]
    )

    parser = StrOutputParser()

    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model=model,
            temperature=0.2,
            google_api_key=api_key
        )
    elif provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        llm = ChatAnthropic(
            model=model,
            temperature=0.2,
            anthropic_api_key=api_key
        )
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(
            model=model,
            temperature=0.2,
            openai_api_key=api_key
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")

    return template | llm | parser


def review_file_dynamic(filename, status, diff, provider, model, api_key):
    import json
    chain = build_chain(provider, model, api_key)

    result = chain.invoke({
        "filename": filename,
        "status": status,
        "diff": diff
    })

    raw = result.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


# -----------------------------------------------
# HEALTH CHECK
# -----------------------------------------------
@app.get("/")
def health_check():
    return {"status": "running", "message": "AI Code Reviewer active!"}


# -----------------------------------------------
# AVAILABLE MODELS LIST
# -----------------------------------------------
@app.get("/api/models")
def get_models():
    return {
        "providers": [
            {
                "id": "google",
                "name": "Google Gemini",
                "models": [
                    "gemini-2.0-flash",
                    "gemini-1.5-pro",
                    "gemini-1.5-flash"
                ]
            },
            {
                "id": "anthropic",
                "name": "Anthropic Claude",
                "models": [
                    "claude-sonnet-4-6",
                    "claude-haiku-4-5-20251001",
                    "claude-opus-4-6"
                ]
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "models": [
                    "gpt-4o",
                    "gpt-4o-mini",
                    "gpt-4-turbo"
                ]
            }
        ]
    }


# -----------------------------------------------
# GET OPEN PRs
# -----------------------------------------------
@app.get("/api/prs/{owner}/{repo}")
def get_prs(owner: str, repo: str):
    from github_client import get_open_prs
    try:
        prs = get_open_prs(f"{owner}/{repo}")
        return {"prs": prs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------------
# REVIEW A PR
# -----------------------------------------------
@app.post("/api/review/{owner}/{repo}/{pr_number}")
async def review_pr(
    owner: str,
    repo: str,
    pr_number: int,
    request: Request
):
    from github_client import get_pr_diff, post_review_comment

    # Get model config from request body
    body = await request.json()
    provider = body.get("provider", "google")
    model = body.get("model", "gemini-2.0-flash")
    api_key = body.get("api_key", "")
    post_to_github = body.get("post_to_github", True)

    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    repo_name = f"{owner}/{repo}"

    try:
        pr_data = get_pr_diff(repo_name, pr_number)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"GitHub error: {str(e)}")

    if not pr_data["files"]:
        raise HTTPException(status_code=404, detail="No reviewable files found")

    all_reviews = []

    for file in pr_data["files"]:
        review = review_file_dynamic(
            filename=file["filename"],
            status=file["status"],
            diff=file["diff"],
            provider=provider,
            model=model,
            api_key=api_key
        )

        if review:
            all_reviews.append({
                "filename": file["filename"],
                "review": review
            })

            # Post to GitHub if enabled
            if post_to_github:
                try:
                    post_review_comment(repo_name, pr_number, file["filename"], review)
                except Exception:
                    pass

    return {
        "pr": pr_data,
        "reviews": all_reviews,
        "total_files": len(all_reviews),
        "model_used": f"{provider}/{model}"
    }


# -----------------------------------------------
# WEBHOOK
# -----------------------------------------------
@app.post("/webhook")
async def github_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    payload_bytes = await request.body()
    signature = request.headers.get("X-Hub-Signature-256", "")

    if not verify_webhook_signature(payload_bytes, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event_type = request.headers.get("X-GitHub-Event", "")
    if event_type != "pull_request":
        return {"message": f"Event '{event_type}' ignored"}

    payload = json.loads(payload_bytes)
    pr_data = parse_pr_event(payload)

    if not pr_data:
        return {"message": "PR action ignored"}

    return {"message": "Webhook received!", "pr": pr_data["pr_number"]}