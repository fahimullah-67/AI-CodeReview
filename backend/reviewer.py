from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from github import Github, Auth
from dotenv import load_dotenv
import os
import json

load_dotenv()

# -----------------------------------------------
# GITHUB CLIENT
# -----------------------------------------------
def get_github_client():
    token = os.getenv("GITHUB_TOKEN")
    auth = Auth.Token(token)
    return Github(auth=auth)

# -----------------------------------------------
# FETCH PR DIFF
# -----------------------------------------------
def get_pr_diff(repo_name, pr_number):
    g = get_github_client()
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)

    print(f"\n📥 Fetching PR #{pr_number}: {pr.title}")
    print("-" * 50)

    files_data = []
    for file in pr.get_files():
        if file.patch:  # Only files that have diff
            files_data.append({
                "filename": file.filename,
                "status": file.status,
                "additions": file.additions,
                "deletions": file.deletions,
                "diff": file.patch
            })
            print(f"  ✅ {file.filename} ({file.additions}+ / {file.deletions}-)")
        else:
            print(f"  ⚠️ {file.filename} skipped (no diff)")

    return {
        "number": pr.number,
        "title": pr.title,
        "author": pr.user.login,
        "url": pr.html_url,
        "files": files_data
    }

# -----------------------------------------------
# AI REVIEW SETUP
# -----------------------------------------------
# model = ChatGoogleGenerativeAI(
#     model="gemini-2.0-flash",
#     temperature=0.2
# )

model = ChatGoogleGenerativeAI(model="gemini-flash-latest")


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
chain = template | model | parser

# -----------------------------------------------
# REVIEW SINGLE FILE
# -----------------------------------------------
def review_file(filename, status, diff):
    print(f"\n🤖 AI reviewing: {filename}...")

    result = chain.invoke({
        "filename": filename,
        "status": status,
        "diff": diff
    })

    raw = result.strip()

    # Clean markdown if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        print(f"  ❌ JSON parse failed for {filename}")
        return None

# -----------------------------------------------
# POST COMMENT TO GITHUB PR
# -----------------------------------------------
def post_review_comment(repo_name, pr_number, filename, review):
    g = get_github_client()
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)

    comment = f"""## 🤖 AI Code Review — `{filename}`

**Overall Score:** {review['overall_score']}/100

---

### 📝 Summary
{review['summary']}

---

### 🐛 Bugs Found ({len(review['bugs'])})
"""
    if review['bugs']:
        for bug in review['bugs']:
            comment += f"- **Line {bug['line']}** `[{bug['severity'].upper()}]`: {bug['description']}\n"
    else:
        comment += "- ✅ No bugs found!\n"

    comment += f"""
---

### 💡 Improvements ({len(review['improvements'])})
"""
    if review['improvements']:
        for imp in review['improvements']:
            comment += f"- **Line {imp['line']}** `[{imp['severity'].upper()}]`: {imp['description']}\n"
    else:
        comment += "- ✅ No improvements needed!\n"

    comment += f"""
---

### 🔐 Security Issues ({len(review['security_issues'])})
"""
    if review['security_issues']:
        for sec in review['security_issues']:
            comment += f"- **Line {sec['line']}** `[{sec['severity'].upper()}]`: {sec['description']}\n"
    else:
        comment += "- ✅ No security issues found!\n"

    comment += f"""
---

### ✅ Positive Points
"""
    for point in review['positive_points']:
        comment += f"- {point}\n"

    comment += "\n---\n*Review generated by AI Code Reviewer 🤖*"

    pr.create_issue_comment(comment)
    print(f"  ✅ Comment posted for {filename}!")

# -----------------------------------------------
# MAIN PIPELINE
# -----------------------------------------------
def run_review_pipeline(repo_name, pr_number):
    print("\n🚀 Starting AI Code Review Pipeline...")
    print("=" * 50)

    # Step 1: Fetch PR diff
    pr_data = get_pr_diff(repo_name, pr_number)

    if not pr_data["files"]:
        print("\n⚠️ No reviewable files found in this PR!")
        return

    print(f"\n📊 Total files to review: {len(pr_data['files'])}")
    print("=" * 50)

    all_reviews = []

    # Step 2: Review each file
    for file in pr_data["files"]:
        review = review_file(
            filename=file["filename"],
            status=file["status"],
            diff=file["diff"]
        )

        if review:
            all_reviews.append({
                "filename": file["filename"],
                "review": review
            })

            # Print results
            print(f"\n📊 Results for {file['filename']}:")
            print(f"  Score    : {review['overall_score']}/100")
            print(f"  Bugs     : {len(review['bugs'])}")
            print(f"  Improvements : {len(review['improvements'])}")
            print(f"  Security : {len(review['security_issues'])}")

            # Step 3: Post comment to GitHub
            post_review_comment(
                repo_name,
                pr_number,
                file["filename"],
                review
            )

    # Step 4: Final Summary
    print("\n" + "=" * 50)
    print("✅ AI REVIEW PIPELINE COMPLETE!")
    print(f"📁 Files reviewed : {len(all_reviews)}")
    print(f"🔗 View PR at     : {pr_data['url']}")
    print("=" * 50)

# -----------------------------------------------
# RUN
# -----------------------------------------------
if __name__ == "__main__":
    REPO_NAME = "fahimullah-67/ai-reviewer-test"
    PR_NUMBER = 3

    run_review_pipeline(REPO_NAME, PR_NUMBER)